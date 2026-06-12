import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { placeOrderOnSupplier, getSupplierForBundle } from "@/lib/supplierBridge";
import { OrderResponse } from "@/lib/suppliers/types";
import { normalizeOrderStatus } from "@/lib/utils";
import { processOrderCommission } from "@/lib/commissions";
import { processOrderRefund } from "@/lib/orderUtils";
import { sendPushNotification } from "@/lib/notifications";


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Session is only strictly required for WALLET payments

  try {
    const body = await req.json();
    const { bundleId, phone, paystackRef, amount, agentId, paymentMethod = "PAYSTACK" } = body;
    
    const sanitizedPhone = phone.replace(/\D/g, "");
    const ghPhoneRegex = /^(02|05)\d{8}$/;
    if (!ghPhoneRegex.test(sanitizedPhone)) {
        return NextResponse.json({ message: "Invalid Ghanaian phone number" }, { status: 400 });
    }
    
    let verifyData: any = null;

    if (paymentMethod === "PAYSTACK") {
        const setting = await prisma.systemSetting.findUnique({ where: { key: "PAYSTACK_SECRET_KEY" } });
        const paystackSecret = setting?.value || process.env.PAYSTACK_SECRET_KEY;

        if (!paystackSecret) {
            console.error("Order Error: PAYSTACK_SECRET_KEY is missing from environment/settings.");
            return NextResponse.json({ message: "Payment setup incomplete" }, { status: 500 });
        }

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${paystackRef}`, {
              headers: {
                Authorization: `Bearer ${paystackSecret}`,
              },
            });

            verifyData = await verifyRes.json();
            
            if (verifyRes.ok && verifyData.data?.status === "success") {
                break; 
            }
            
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!verifyData || verifyData.data?.status !== "success") {
            const errorMsg = verifyData?.message || "Payment verification failed after retries";
            return NextResponse.json({ message: errorMsg }, { status: 400 });
        }
    }

    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
    });

    if (!bundle) {
      return NextResponse.json({ message: "Bundle not found" }, { status: 404 });
    }

    // HIGH-2 + MED-2: Always re-fetch role from DB — JWT can be stale after demotion or expiry.
    // This also enforces agent subscription expiry at purchase time, not just at dashboard login.
    let liveRole = "USER";
    if (session) {
      const dbUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { role: true, agentExpiry: true }
      });
      if (dbUser) {
        // Auto-expire agents whose subscription has lapsed
        if (dbUser.role === "AGENT" && dbUser.agentExpiry && new Date() > new Date(dbUser.agentExpiry)) {
          await prisma.user.update({ where: { id: (session.user as any).id }, data: { role: "USER" } });
          liveRole = "USER";
        } else {
          liveRole = dbUser.role;
        }
      }
    }

    const isOnAgentStore = !!agentId && agentId !== (session?.user as any)?.id;
    const basePrice = (!isOnAgentStore && (liveRole === "AGENT" || liveRole === "ADMIN"))
        ? Number(bundle.agentPrice)
        : Number(bundle.userPrice);

    // CRIT-6: For Paystack payments, verify the paid amount matches the bundle price from the DB.
    // This prevents clients from paying less than the required amount.
    if (paymentMethod === "PAYSTACK" && verifyData) {
        const paidAmountGHS = verifyData.data.amount / 100;
        if (Math.abs(paidAmountGHS - basePrice) > 0.01) {
            console.error(`Amount mismatch: paid=${paidAmountGHS} expected=${basePrice} for bundle=${bundleId}`);
            return NextResponse.json({ message: "Payment amount does not match the bundle price" }, { status: 400 });
        }
    }

    // Always use the DB price — never the client-supplied amount
    const finalAmount = basePrice;

    const order = await prisma.$transaction(async (tx) => {
        if (paymentMethod === "WALLET") {
            if (!session) {
                throw new Error("Unauthorized");
            }
            const user = await tx.user.findUnique({
                where: { id: (session.user as any).id },
                select: { balance: true }
            });

            // Use Decimal-safe comparison with small epsilon to avoid floating point rejection
            const userBal = Number(user?.balance ?? 0);
            const EPSILON = 0.005; // half a pesewa tolerance
            if (!user || (userBal + EPSILON) < finalAmount) {
                console.warn(`Insufficient balance: User has ${user?.balance}, needs ${finalAmount}`);
                throw new Error(`Insufficient wallet balance. You need GHS ${finalAmount.toFixed(2)} but have GHS ${userBal.toFixed(2)}`);
            }

            await tx.user.update({
                where: { id: (session.user as any).id },
                data: { balance: { decrement: finalAmount } }
            });

            // Record the debit transaction
            await tx.walletTransaction.create({
                data: {
                    userId: (session.user as any).id,
                    amount: finalAmount,
                    type: "DEBIT",
                    reference: `ORDER-${Date.now()}`,
                    description: `Data Bundle Purchase - ${bundle.network} ${bundle.size}`
                }
            });
        }

        return await tx.order.create({
            data: {
                userId: session ? (session.user as any).id : null,
                bundleId: bundle.id,
                phone: sanitizedPhone,
                amount: finalAmount,
                paystackRef: paymentMethod === "WALLET" ? `WALLET-${Date.now()}` : paystackRef,
                paymentMethod,
                agentId: agentId || null,
                status: "PENDING",
            },
            include: {
                bundle: true
            }
        });
    });

    if (order.userId) {
      await sendPushNotification({
        userId: order.userId,
        title: "Order Placed 🚀",
        message: `Your order for ${bundle.size} ${bundle.network} data to ${sanitizedPhone} has been received.`,
        url: "/dashboard/orders"
      });
    }


    // Resolve which supplier handles this bundle (multi-supplier routing)
    const { supplierProductId: resolvedProductId, supplierType } = await getSupplierForBundle(bundle.id);
    const effectiveProductId = resolvedProductId || bundle.supplierProductId;

    if (!effectiveProductId) {
        console.error("Order error: Bundle missing supplierProductId", bundle.id);
        return NextResponse.json({ message: "This bundle is not correctly configured for automated delivery." }, { status: 400 });
    }

    const supplierRes = await placeOrderOnSupplier({
      bundleId: bundle.id,
      supplierProductId: effectiveProductId,
      phone: sanitizedPhone,
      reference: order.id,
    });

    if (supplierRes.success) {
      const res = supplierRes as OrderResponse;
      const supplierOrderId = res.supplierOrderId || (res as any).supplier_order_id;
      
      if (supplierOrderId) {
        const rawStatus = res.status || "PROCESSING";
        const normalizedStatus = normalizeOrderStatus(rawStatus);
        
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: normalizedStatus,
            supplierStatus: rawStatus,
            supplierOrderId: supplierOrderId,
            supplierType: supplierType, // Store which supplier handled this order
          },
        });

        if (normalizedStatus === "COMPLETED" || normalizedStatus === "PROCESSING") {
          await processOrderCommission(order.id);
        }
      }
    } else {
      // Save the supplierType on the order first so the failure is properly associated with the supplier
      await prisma.order.update({
        where: { id: order.id },
        data: { supplierType }
      });

      // Use the refund utility to mark as failed and refund if necessary
      await processOrderRefund(
        order.id, 
        (supplierRes as any).error || "Supplier rejection"
      );
    }

    return NextResponse.json(order, { status: 201 });

  } catch (error: any) {
    console.error("Order error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

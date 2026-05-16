import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { placeOrderOnSupplier } from "@/lib/supplierBridge";
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
    console.log("Order Request Body:", JSON.stringify(body));
    console.log("Session detected:", !!session, session?.user?.email);

    const { bundleId, phone, paystackRef, amount, agentId, paymentMethod = "PAYSTACK" } = body;
    
    const sanitizedPhone = phone.replace(/\D/g, "");
    const ghPhoneRegex = /^(02|05)\d{8}$/;
    if (!ghPhoneRegex.test(sanitizedPhone)) {
        return NextResponse.json({ message: "Invalid Ghanaian phone number" }, { status: 400 });
    }
    
    if (paymentMethod === "PAYSTACK") {
        const setting = await prisma.systemSetting.findUnique({ where: { key: "PAYSTACK_SECRET_KEY" } });
        const paystackSecret = setting?.value || process.env.PAYSTACK_SECRET_KEY;

        if (!paystackSecret) {
            console.error("Order Error: PAYSTACK_SECRET_KEY is missing from environment/settings.");
            return NextResponse.json({ message: "Payment setup incomplete" }, { status: 500 });
        }

        console.log(`Verifying Paystack Ref: ${paystackRef}`);
        
        let verifyData: any = null;
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
            console.log(`Attempt ${attempts}: Paystack Verify Status:`, verifyRes.status);
            
            if (verifyRes.ok && verifyData.data?.status === "success") {
                break; 
            }
            
            if (attempts < maxAttempts) {
                console.log("Retrying Paystack verification in 2s...");
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!verifyData || verifyData.data?.status !== "success") {
            const errorMsg = verifyData?.message || "Payment verification failed after retries";
            console.error(`Paystack Error: ${errorMsg}`);
            return NextResponse.json({ message: errorMsg }, { status: 400 });
        }
    }

    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
    });

    if (!bundle) {
      return NextResponse.json({ message: "Bundle not found" }, { status: 404 });
    }

    // Server-side Price Verification: Always use the correct price for the user role
    const userRole = session ? (session.user as any).role : "USER";
    const basePrice = (userRole === "AGENT" || userRole === "ADMIN") 
        ? Number(bundle.agentPrice) 
        : Number(bundle.userPrice);
    
    // Use the price from DB if not provided or if we want to be strict
    // For WALLET payments, we MUST use the DB price to prevent client-side manipulation
    const finalAmount = paymentMethod === "WALLET" ? basePrice : Number(amount);

    const order = await prisma.$transaction(async (tx) => {
        if (paymentMethod === "WALLET") {
            if (!session) {
                throw new Error("Unauthorized");
            }
            const user = await tx.user.findUnique({
                where: { id: (session.user as any).id },
                select: { balance: true }
            });

            // Use exact Decimal comparison to avoid floating point issues
            if (!user || Number(user.balance) < finalAmount) {
                console.warn(`Insufficient balance: User has ${user?.balance}, needs ${finalAmount}`);
                throw new Error(`Insufficient wallet balance. You need GHS ${finalAmount.toFixed(2)} but have GHS ${Number(user?.balance).toFixed(2)}`);
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


    if (!bundle.supplierProductId) {
        console.error("Order error: Bundle missing supplierProductId", bundle.id);
        return NextResponse.json({ message: "This bundle is not correctly configured for automated delivery." }, { status: 400 });
    }

    console.log(`Placing order on supplier for bundle ${bundle.id}, phone ${sanitizedPhone}, productID ${bundle.supplierProductId}`);
    
    const supplierRes = await placeOrderOnSupplier({
      supplierProductId: bundle.supplierProductId,
      phone: sanitizedPhone,
      reference: order.id, 
    });

    console.log("Supplier Response:", JSON.stringify(supplierRes));

    if (supplierRes.success) {
      const res = supplierRes as OrderResponse;
      const supplierOrderId = res.supplierOrderId || res.supplier_order_id;
      
      if (supplierOrderId) {
        const rawStatus = res.status || "PROCESSING";
        const normalizedStatus = normalizeOrderStatus(rawStatus);
        
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: normalizedStatus,
            supplierStatus: rawStatus,
            supplierOrderId: supplierOrderId
          },
        });

        if (normalizedStatus === "COMPLETED" || normalizedStatus === "PROCESSING") {
          await processOrderCommission(order.id);
        }
      }
    } else {
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

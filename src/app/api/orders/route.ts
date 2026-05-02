import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { placeOrderOnSupplier } from "@/lib/supplierBridge";
import { OrderResponse } from "@/lib/suppliers/types";
import { normalizeOrderStatus } from "@/lib/utils";
import { processOrderCommission } from "@/lib/commissions";
import { processOrderRefund } from "@/lib/orderUtils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bundleId, phone, paystackRef, amount, agentId, paymentMethod = "PAYSTACK" } = await req.json();
    
    const sanitizedPhone = phone.replace(/\D/g, "");
    const ghPhoneRegex = /^(02|05)\d{8}$/;
    if (!ghPhoneRegex.test(sanitizedPhone)) {
        return NextResponse.json({ message: "Invalid Ghanaian phone number" }, { status: 400 });
    }
    
    if (paymentMethod === "PAYSTACK") {
        const setting = await prisma.systemSetting.findUnique({ where: { key: "PAYSTACK_SECRET_KEY" } });
        const paystackSecret = setting?.value || process.env.PAYSTACK_SECRET_KEY;

        if (!paystackSecret) {
            return NextResponse.json({ message: "Payment setup incomplete" }, { status: 500 });
        }

        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${paystackRef}`, {
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
          },
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || verifyData.data.status !== "success") {
            return NextResponse.json({ message: "Payment verification failed" }, { status: 400 });
        }
    }

    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
    });

    if (!bundle) {
      return NextResponse.json({ message: "Bundle not found" }, { status: 404 });
    }

    const order = await prisma.$transaction(async (tx) => {
        if (paymentMethod === "WALLET") {
            const user = await tx.user.findUnique({
                where: { id: (session.user as any).id },
                select: { balance: true }
            });

            if (!user || Number(user.balance) < Number(amount)) {
                throw new Error("Insufficient wallet balance");
            }

            await tx.user.update({
                where: { id: (session.user as any).id },
                data: { balance: { decrement: Number(amount) } }
            });
        }

        return await tx.order.create({
            data: {
                userId: (session.user as any).id,
                bundleId: bundle.id,
                phone: sanitizedPhone,
                amount: Number(amount),
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

    const supplierRes = await placeOrderOnSupplier({
      supplierProductId: bundle.supplierProductId!,
      phone: sanitizedPhone,
      reference: order.id, 
    });

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

        if (normalizedStatus === "COMPLETED") {
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

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { placeOrderOnSupplier } from "@/lib/supplierBridge";
import { OrderResponse } from "@/lib/suppliers/types";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bundleId, phone, paystackRef, amount, agentId, paymentMethod = "PAYSTACK" } = await req.json();
    
    // Sanitize and Validate Phone
    const sanitizedPhone = phone.replace(/\D/g, "");
    const ghPhoneRegex = /^(02|05)\d{8}$/;
    if (!ghPhoneRegex.test(sanitizedPhone)) {
        return NextResponse.json({ message: "Invalid Ghanaian phone number" }, { status: 400 });
    }
    
    // 1. PAYMENT VERIFICATION
    if (paymentMethod === "PAYSTACK") {
        // Fetch Paystack Secret from DB or ENV
        const setting = await prisma.systemSetting.findUnique({ where: { key: "PAYSTACK_SECRET_KEY" } });
        const paystackSecret = setting?.value || process.env.PAYSTACK_SECRET_KEY;

        if (!paystackSecret) {
            return NextResponse.json({ message: "Payment setup incomplete" }, { status: 500 });
        }

        // Verify Paystack Payment
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

    // 2. Fetch Bundle info
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
    });

    if (!bundle) {
      return NextResponse.json({ message: "Bundle not found" }, { status: 404 });
    }

    // 3. DATABASE UPDATES (Transaction)
    const order = await prisma.$transaction(async (tx) => {
        // If wallet payment, check and deduct balance
        if (paymentMethod === "WALLET") {
            const user = await tx.user.findUnique({
                where: { id: (session.user as any).id },
                select: { balance: true }
            });

            if (!user || Number(user.balance) < Number(amount)) {
                throw new Error("Insufficient wallet balance");
            }

            // Deduct balance
            await tx.user.update({
                where: { id: (session.user as any).id },
                data: { balance: { decrement: Number(amount) } }
            });
        }

        // Create Order
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

    // 4. Trigger Supplier Bridge
    const supplierRes = await placeOrderOnSupplier({
      supplierProductId: bundle.supplierProductId!,
      phone: sanitizedPhone,
      reference: order.id, 
    });

    if (supplierRes.success) {
      const res = supplierRes as OrderResponse;
      const supplierOrderId = res.supplierOrderId || res.supplier_order_id;
      
      if (supplierOrderId) {
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: "PROCESSING",
            supplierOrderId: supplierOrderId
          },
        });
      }
    }

    return NextResponse.json(order, { status: 201 });

  } catch (error: any) {
    console.error("Order error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

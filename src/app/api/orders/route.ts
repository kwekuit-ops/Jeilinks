import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { placeOrderOnSupplier } from "@/lib/supplierBridge";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bundleId, phone, paystackRef, amount, agentId } = await req.json();
    
    // Fetch Paystack Secret from DB or ENV
    const setting = await prisma.systemSetting.findUnique({ where: { key: "PAYSTACK_SECRET_KEY" } });
    const paystackSecret = setting?.value || process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
        return NextResponse.json({ message: "Payment setup incomplete" }, { status: 500 });
    }

    // 1. Verify Paystack Payment (Server-side)
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${paystackRef}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.data.status !== "success") {
       // Check if it's already a wallet payment or if verification failed
       if (verifyData.data.status !== "success") {
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

    // 3. Create Order in DB
    const order = await prisma.order.create({
      data: {
        userId: (session.user as any).id,
        bundleId: bundle.id,
        phone,
        amount: Number(amount),
        paystackRef,
        agentId: agentId || null,
        status: "PENDING",
      },
      include: {
        bundle: true
      }
    });

    // 4. Trigger Supplier Bridge
    const supplierRes = await placeOrderOnSupplier({
      supplierProductId: bundle.supplierProductId!,
      phone: order.phone,
      reference: order.id, // Using internal ID as reference for the supplier
    });

    if (supplierRes.success) {
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: "PROCESSING",
          supplierOrderId: supplierRes.supplier_order_id 
        },
      });
    } else {
      console.error("Supplier error:", supplierRes.error);
      // We don't necessarily fail the whole request since payment was successful
      // Admin might need to handle this manually or retry
    }

    return NextResponse.json(order, { status: 201 });

  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

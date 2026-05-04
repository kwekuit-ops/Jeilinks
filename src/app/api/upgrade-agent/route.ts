import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reference } = await req.json();

    // 1. Verify Paystack Payment
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.data.status !== "success" || verifyData.data.amount < 1000) {
      return NextResponse.json({ message: "Payment verification failed" }, { status: 400 });
    }

    // 2. Check if reference already used
    const existingTx = await prisma.walletTransaction.findUnique({
      where: { reference: reference }
    });

    if (existingTx) {
      return NextResponse.json({ message: "Payment already processed" }, { status: 400 });
    }

    // 3. Update User Role
    const userId = (session.user as any).id;
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    
    if (existingUser?.role === "AGENT" && existingUser.storeSlug) {
        // Just extend expiry or record payment
        await prisma.walletTransaction.create({
            data: {
                userId,
                amount: verifyData.data.amount / 100,
                type: "CREDIT",
                reference: reference,
                description: "Agent Subscription Renewal"
            }
        });
        return NextResponse.json({ message: "Subscription renewed", user: existingUser }, { status: 200 });
    }

    const userName = session.user?.name || "agent";
    const storeSlug = userName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);

    const user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
            where: { id: userId },
            data: {
                role: "AGENT",
                storeSlug: storeSlug,
            },
        });

        await tx.walletTransaction.create({
            data: {
                userId,
                amount: verifyData.data.amount / 100,
                type: "CREDIT",
                reference: reference,
                description: "Agent Upgrade Fee"
            }
        });

        return u;
    });

    return NextResponse.json({ message: "Success", user }, { status: 200 });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

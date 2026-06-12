import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    // HIGH-5: Verify amount against the real subscription price from settings
    const agentFeeSetting = await prisma.systemSetting.findUnique({ where: { key: "AGENT_UPGRADE_FEE" } });
    const expectedPesewas = agentFeeSetting ? Number(agentFeeSetting.value) * 100 : 1000; // fallback to GHS 10

    if (!verifyRes.ok || verifyData.data.status !== "success" || verifyData.data.amount < expectedPesewas) {
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

    // Compute new expiry (stack on top of existing if not yet expired)
    let newExpiry = new Date();
    if (existingUser?.agentExpiry && new Date(existingUser.agentExpiry) > new Date()) {
      newExpiry = new Date(existingUser.agentExpiry);
    }
    newExpiry.setDate(newExpiry.getDate() + 14);

    if (existingUser?.role === "AGENT" && existingUser.storeSlug) {
        // MED-6: Extend expiry on renewal (was missing before)
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { agentExpiry: newExpiry }
          }),
          prisma.walletTransaction.create({
            data: {
                userId,
                amount: verifyData.data.amount / 100,
                type: "CREDIT",
                reference: reference,
                description: "Agent Subscription Renewal"
            }
          })
        ]);
        return NextResponse.json({ message: "Subscription renewed", expiresAt: newExpiry }, { status: 200 });
    }

    const userName = session.user?.name || "agent";
    const storeSlug = userName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);

    const user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
            where: { id: userId },
            data: {
                role: "AGENT",
                storeSlug: storeSlug,
                agentExpiry: newExpiry,
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

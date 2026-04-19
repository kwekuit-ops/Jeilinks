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

    if (!verifyRes.ok || verifyData.data.status !== "success" || verifyData.data.amount < 5000) {
      return NextResponse.json({ message: "Payment verification failed" }, { status: 400 });
    }

    // 2. Update User Role
    const userId = (session.user as any).id;
    const userName = session.user?.name || "agent";
    const storeSlug = userName.toLowerCase().replace(/\s+/g, '-') + "-" + Math.floor(Math.random() * 1000);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "AGENT",
        storeSlug: storeSlug,
      },
    });

    return NextResponse.json({ message: "Success", user }, { status: 200 });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

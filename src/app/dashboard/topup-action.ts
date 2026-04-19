"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function topUpWallet(paystackRef: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${paystackRef}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.data.status !== "success") {
      return { success: false, error: "Payment verification failed" };
    }

    const amountGHS = verifyData.data.amount / 100;

    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        balance: {
          increment: amountGHS,
        },
      },
    });

    revalidatePath("/dashboard");
    return { success: true, amount: amountGHS };

  } catch (error) {
    console.error("Topup error:", error);
    return { success: false, error: "Internal error during top-up" };
  }
}

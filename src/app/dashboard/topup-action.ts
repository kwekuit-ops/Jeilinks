"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/notifications";

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

    // Check if reference has already been used
    const existingTx = await prisma.walletTransaction.findUnique({
      where: { reference: paystackRef }
    });

    if (existingTx) {
      return { success: false, error: "This payment has already been processed" };
    }

    const amountGHS = verifyData.data.amount / 100;

    // Use a transaction to ensure both user balance and transaction record are updated
    await prisma.$transaction([
      prisma.user.update({
        where: { id: (session.user as any).id },
        data: {
          balance: {
            increment: amountGHS,
          },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: (session.user as any).id,
          amount: amountGHS,
          type: "TOPUP",
          reference: paystackRef,
          description: `Wallet top-up via Paystack`
        }
      })
    ]);

    await sendPushNotification({
      userId: (session.user as any).id,
      title: "Top-up Successful! 💰",
      message: `Your wallet has been credited with GHS ${amountGHS.toFixed(2)}.`,
      url: "/dashboard"
    });

    revalidatePath("/dashboard");
    return { success: true, amount: amountGHS };

  } catch (error) {
    console.error("Topup error:", error);
    return { success: false, error: "Internal error during top-up" };
  }
}

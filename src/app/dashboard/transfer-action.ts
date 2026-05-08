"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function transferEarningsToWallet(amount: number) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  const userId = (session.user as any).id;

  try {
    if (amount <= 0) throw new Error("Invalid amount");

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { commissionBalance: true }
      });

      if (!user || Number(user.commissionBalance) < amount) {
        throw new Error("Insufficient earnings balance");
      }

      // 1. Deduct from earnings
      await tx.user.update({
        where: { id: userId },
        data: { commissionBalance: { decrement: amount } }
      });

      // 2. Add to wallet balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } }
      });

      // 3. Log transaction
      await tx.walletTransaction.create({
          data: {
              userId,
              amount,
              type: "TOPUP",
              reference: `TRANSFER-${Date.now()}`,
              description: `Earnings transfer to main wallet`
          }
      });
    });

    revalidatePath("/dashboard");
    return { success: true };

  } catch (error: any) {
    console.error("Transfer error:", error);
    return { success: false, error: error.message || "An error occurred" };
  }
}

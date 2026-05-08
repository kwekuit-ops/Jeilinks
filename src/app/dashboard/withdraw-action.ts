"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requestWithdrawal(amount: number, phone: string, source: "WALLET" | "COMMISSION" = "WALLET") {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  const userId = (session.user as any).id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true, commissionBalance: true }
      });

      if (!user) throw new Error("User not found");

      const currentBalance = source === "COMMISSION" ? Number(user.commissionBalance) : Number(user.balance);

      if (currentBalance < amount) {
        throw new Error(`Insufficient ${source === "COMMISSION" ? "earnings" : "wallet"} balance for withdrawal`);
      }

      // Deduct from correct balance
      await tx.user.update({
        where: { id: userId },
        data: source === "COMMISSION" 
            ? { commissionBalance: { decrement: amount } }
            : { balance: { decrement: amount } }
      });

      // Create withdrawal request
      const wdl = await tx.withdrawal.create({
        data: {
          userId,
          amount,
          phone,
          status: "PENDING"
        }
      });

      // Record transaction
      await tx.walletTransaction.create({
          data: {
              userId,
              amount,
              type: "DEBIT",
              reference: `WDL-REQ-${wdl.id}`,
              description: `Withdrawal request initiated to ${phone}`
          }
      });

      return wdl;
    });

    revalidatePath("/dashboard");
    return { success: true, withdrawalId: result.id };

  } catch (error: any) {
    console.error("Withdrawal error:", error);
    return { success: false, error: error.message || "An error occurred" };
  }
}

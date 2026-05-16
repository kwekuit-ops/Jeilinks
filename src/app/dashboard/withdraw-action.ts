"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requestWithdrawal(amount: number, phone: string, source: "WALLET" | "COMMISSION" = "WALLET") {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  const userId = (session.user as any).id;

  // Restriction: Store earnings (COMMISSION) can only be withdrawn on Fridays
  if (source === "COMMISSION") {
    const today = new Date().getDay(); // 0: Sunday, 1: Monday, ..., 5: Friday, 6: Saturday
    if (today !== 5) {
      return { success: false, error: "Store earnings can only be withdrawn on Fridays" };
    }
  }

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

export async function transferCommissionToWallet(amount: number) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };
  
    const userId = (session.user as any).id;
  
    if (amount <= 0) return { success: false, error: "Invalid amount" };
  
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { commissionBalance: true }
        });
  
        if (!user) throw new Error("User not found");
        if (Number(user.commissionBalance) < amount) {
          throw new Error("Insufficient earnings for transfer");
        }
  
        // Move funds
        await tx.user.update({
          where: { id: userId },
          data: {
            commissionBalance: { decrement: amount },
            balance: { increment: amount }
          }
        });
  
        // Record log
        await tx.walletTransaction.create({
            data: {
                userId,
                amount,
                type: "CREDIT",
                reference: `XFER-${Date.now()}`,
                description: `Transferred earnings to main wallet`
            }
        });
      });
  
      revalidatePath("/dashboard");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Transfer failed" };
    }
}

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function requestWithdrawal(amount: number, phone: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  const userId = (session.user as any).id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });

      if (!user || Number(user.balance) < amount) {
        throw new Error("Insufficient balance for withdrawal");
      }

      // Deduct balance immediately
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } }
      });

      // Create withdrawal request
      return await tx.withdrawal.create({
        data: {
          userId,
          amount,
          phone,
          status: "PENDING"
        }
      });
    });

    revalidatePath("/dashboard");
    return { success: true, withdrawalId: result.id };

  } catch (error: any) {
    console.error("Withdrawal error:", error);
    return { success: false, error: error.message || "An error occurred" };
  }
}

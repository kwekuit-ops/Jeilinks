"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function getWithdrawals() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") throw new Error("Unauthorized");

  return await prisma.withdrawal.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function updateWithdrawalStatus(id: string, status: "COMPLETED" | "REJECTED") {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") throw new Error("Unauthorized");

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!withdrawal) throw new Error("Withdrawal not found");

  const ref = `WDL-${id}-${status}`;

  await prisma.$transaction(async (tx) => {
    if (status === "REJECTED" && withdrawal.status === "PENDING") {
        // Return funds to user balance if rejected
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: withdrawal.amount } }
        });

        await tx.walletTransaction.create({
            data: {
                userId: withdrawal.userId,
                amount: withdrawal.amount,
                type: "CREDIT",
                reference: ref,
                description: `Withdrawal rejected - Refund`
            }
        });
    } else if (status === "COMPLETED" && withdrawal.status === "PENDING") {
        // Record the debit transaction for the payout
        await tx.walletTransaction.create({
            data: {
                userId: withdrawal.userId,
                amount: withdrawal.amount,
                type: "DEBIT",
                reference: ref,
                description: `Withdrawal payout completed`
            }
        });
    }

    await tx.withdrawal.update({
      where: { id },
      data: { status }
    });
  });

  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin/wallet");
  return { success: true };
}

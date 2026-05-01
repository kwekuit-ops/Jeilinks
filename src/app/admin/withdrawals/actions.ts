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

  if (status === "REJECTED" && withdrawal.status === "PENDING") {
    // Return funds to user balance if rejected
    await prisma.user.update({
      where: { id: withdrawal.userId },
      data: { balance: { increment: withdrawal.amount } }
    });
  }

  await prisma.withdrawal.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/admin/withdrawals");
  return { success: true };
}

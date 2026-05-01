"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    await ensureAdmin();
    
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update role" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await ensureAdmin();

    // Check if user has orders - we might want to delete orders or prevent deletion
    // For now, let's just delete the user (Prisma will fail if there are FK constraints unless set to cascade)
    // In schema.prisma, Order has fields [userId] references [id]. Default is restrict.
    
    // Better: just delete the user and let the DB handle it if cascading is on, 
    // or manually delete/disconnect if needed.
    // Let's assume we want to keep orders but remove the user? No, usually delete everything.
    
    await prisma.user.delete({
      where: { id: userId }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return { success: false, error: "Failed to delete user. They might have existing orders." };
  }
}

export async function updateUserBalance(userId: string, amount: number) {
  try {
    await ensureAdmin();

    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to update balance" };
  }
}

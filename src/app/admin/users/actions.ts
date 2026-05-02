"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    await ensureAdmin();
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const data: any = { role: newRole };

    // If becoming an agent and has no slug, generate one
    if (newRole === "AGENT" && !user.storeSlug) {
      const baseName = user.name || "agent";
      data.storeSlug = baseName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);
      
      // Also set a default expiry if not set
      if (!user.agentExpiry) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        data.agentExpiry = expiry;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data
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


export async function createStore(data: { name: string, email: string, phone: string, password?: string }) {
  try {
    await ensureAdmin();

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    const hashedPassword = await bcrypt.hash(data.password || "12345678", 10);
    const storeSlug = data.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);

    // Default expiry: 30 days for admin-created stores
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        password: hashedPassword,
        role: "AGENT",
        storeSlug: storeSlug,
        agentExpiry: expiry,
      }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Create store error:", error);
    return { success: false, error: error.message || "Failed to create store" };
  }
}

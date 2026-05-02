"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function generateAdminStoreSlug() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
    });

    if (!user) return { success: false, error: "User not found" };
    if (user.storeSlug) return { success: true, slug: user.storeSlug };

    const slug = (user.name || "admin").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { storeSlug: slug }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/store");
    return { success: true, slug };
  } catch (error) {
    return { success: false, error: "Failed to generate slug" };
  }
}

export async function deleteAdminStore() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { storeSlug: null }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/store");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete store" };
  }
}

export async function updateStoreSlug(newSlug: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const sanitized = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");
  if (sanitized.length < 3) return { success: false, error: "Slug must be at least 3 characters" };

  try {
    const existing = await prisma.user.findUnique({ where: { storeSlug: sanitized } });
    if (existing && existing.id !== (session.user as any).id) {
      return { success: false, error: "That slug is already taken" };
    }

    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { storeSlug: sanitized }
    });

    revalidatePath("/admin/store");
    revalidatePath("/admin");
    return { success: true, slug: sanitized };
  } catch (error) {
    return { success: false, error: "Failed to update slug" };
  }
}

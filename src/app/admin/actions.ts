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

    const slug = user.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { storeSlug: slug }
    });

    revalidatePath("/admin");
    return { success: true, slug };
  } catch (error) {
    return { success: false, error: "Failed to generate slug" };
  }
}

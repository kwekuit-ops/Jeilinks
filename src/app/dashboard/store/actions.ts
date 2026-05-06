"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { Session } from "next-auth";

interface AuthUser {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AuthSession extends Session {
  user: AuthUser;
}

async function ensureAgent(): Promise<AuthSession> {
  const session = await getServerSession(authOptions) as AuthSession | null;
  if (!session || (session.user.role !== "AGENT" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getAgentCustomPrices() {
  const session = await ensureAgent();
  const userId = session.user.id;

  return await prisma.agentBundlePrice.findMany({
    where: { agentId: userId }
  });
}

export async function updateAgentStorePrice(bundleId: string, customPrice: number) {
  try {
    const session = await ensureAgent();
    const userId = session.user.id;

    // Verify bundle exists
    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId }
    });

    if (!bundle) throw new Error("Bundle not found");

    // Prevent pricing below cost (agentPrice)
    if (customPrice < Number(bundle.agentPrice)) {
      throw new Error(`Price cannot be lower than your wholesale cost (GHS ${bundle.agentPrice})`);
    }

    await prisma.agentBundlePrice.upsert({
      where: {
        agentId_bundleId: {
          agentId: userId,
          bundleId: bundleId
        }
      },
      update: { customPrice },
      create: {
        agentId: userId,
        bundleId,
        customPrice
      }
    });

    // Check if user has a store slug, if not, generate one
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storeSlug: true, name: true }
    });

    let slug = user?.storeSlug;
    if (!slug) {
        const baseName = user?.name || "store";
        const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
        slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + "-" + randomStr;
        
        await prisma.user.update({
            where: { id: userId },
            data: { storeSlug: slug }
        });
    }

    revalidatePath("/dashboard/store");
    if (slug) {
        revalidatePath(`/store/${slug}`);
    }
    return { success: true, slug: slug };
  } catch (error) {
    console.error("Update custom price error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update price" };
  }
}

export async function resetAgentStorePrice(bundleId: string) {
  try {
    const session = await ensureAgent();
    const userId = session.user.id;

    await prisma.agentBundlePrice.delete({
      where: {
        agentId_bundleId: {
          agentId: userId,
          bundleId: bundleId
        }
      }
    });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { storeSlug: true }
    });

    revalidatePath("/dashboard/store");
    if (user?.storeSlug) {
        revalidatePath(`/store/${user.storeSlug}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to reset price" };
  }
}

export async function updateStoreSlug(slug: string) {
    try {
        const session = await ensureAgent();
        const userId = session.user.id;

        // Basic validation
        if (!slug || slug.length < 3) {
            throw new Error("Store name must be at least 3 characters long");
        }

        // Format slug: lowercase, no spaces
        const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        if (!formattedSlug) {
            throw new Error("Invalid store name. Use letters and numbers only.");
        }

        // Check if slug is taken
        const existing = await prisma.user.findFirst({
            where: { 
                storeSlug: formattedSlug,
                id: { not: userId }
            }
        });

        if (existing) {
            throw new Error("This store name is already taken. Please try another.");
        }

        await prisma.user.update({
            where: { id: userId },
            data: { storeSlug: formattedSlug }
        });

        revalidatePath("/dashboard/store");
        return { success: true, slug: formattedSlug };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to update store name" };
    }
}

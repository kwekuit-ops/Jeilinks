"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function ensureAgent() {
  const session = await getServerSession(authOptions);
  if (!session || ((session.user as any).role !== "AGENT" && (session.user as any).role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getAgentCustomPrices() {
  const session = await ensureAgent();
  const userId = (session.user as any).id;

  return await prisma.agentBundlePrice.findMany({
    where: { agentId: userId }
  });
}

export async function updateAgentStorePrice(bundleId: string, customPrice: number) {
  try {
    const session = await ensureAgent();
    const userId = (session.user as any).id;

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

    revalidatePath("/dashboard/store");
    revalidatePath(`/store/${(session.user as any).storeSlug}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update custom price error:", error);
    return { success: false, error: error.message || "Failed to update price" };
  }
}

export async function resetAgentStorePrice(bundleId: string) {
  try {
    const session = await ensureAgent();
    const userId = (session.user as any).id;

    await prisma.agentBundlePrice.delete({
      where: {
        agentId_bundleId: {
          agentId: userId,
          bundleId: bundleId
        }
      }
    });

    revalidatePath("/dashboard/store");
    revalidatePath(`/store/${(session.user as any).storeSlug}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to reset price" };
  }
}

export async function updateStoreSlug(slug: string) {
    try {
        const session = await ensureAgent();
        const userId = (session.user as any).id;

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
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update store name" };
    }
}

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getActiveSupplier } from "@/lib/suppliers";

export async function savePricing(network: string, bundles: any[]) {
  try {
    for (const bundle of bundles) {
      if (bundle.id) {
        // Update existing
        await prisma.bundle.update({
          where: { id: bundle.id },
          data: {
            userPrice: parseFloat(bundle.userPrice),
            agentPrice: parseFloat(bundle.agentPrice),
            supplierProductId: bundle.supplierProductId ? parseInt(bundle.supplierProductId, 10) : null,
            isActive: bundle.isActive,
          },
        });
      } else {
        // Create new
        await prisma.bundle.create({
          data: {
            network,
            size: bundle.size,
            userPrice: parseFloat(bundle.userPrice) || 0,
            agentPrice: parseFloat(bundle.agentPrice) || 0,
            supplierProductId: bundle.supplierProductId ? parseInt(bundle.supplierProductId, 10) : null,
            isActive: bundle.isActive,
          },
        });
      }
    }
    revalidatePath("/admin/pricing");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to save pricing setup." };
  }
}

export async function syncSupplierProducts() {
  try {
    const supplier = await getActiveSupplier();
    const products = await supplier.fetchProducts();
    
    let updatedCount = 0;

    for (const prod of products) {
      // Find matching bundle by network and size OR by supplier ID
      const existing = await prisma.bundle.findFirst({
        where: {
          OR: [
            { supplierProductId: Number(prod.id) },
            { 
              network: prod.network,
              size: prod.size 
            }
          ]
        }
      });

      if (existing) {
        await prisma.bundle.update({
          where: { id: existing.id },
          data: {
            network: prod.network,
            size: prod.size,
            supplierProductId: Number(prod.id),
            // Keep existing prices if they set custom ones, optionally we can auto-update the base prices.
            // But let's just make sure the IDs hit. If it was blank, let's set the supplier's default prices:
            userPrice: existing.userPrice ? existing.userPrice : prod.price,
            agentPrice: existing.agentPrice ? existing.agentPrice : prod.resellerPrice,
            supplierPrice: prod.resellerPrice || prod.price || 0,
            isActive: true,
          }
        });
        updatedCount++;
      } else {
        // Create it completely new if it wasn't a template
        await prisma.bundle.create({
          data: {
             network: prod.network,
             size: prod.size,
             supplierProductId: Number(prod.id),
             userPrice: prod.price || 0,
             agentPrice: prod.resellerPrice || prod.price || 0,
             supplierPrice: prod.resellerPrice || prod.price || 0,
             isActive: true,
          }
        });
        updatedCount++;
      }
    }

    // Cleanup: Delete bundles that don't have a supplier ID (not in FuzeServe list)
    await prisma.bundle.deleteMany({
      where: { supplierProductId: null }
    });

    revalidatePath("/admin/pricing");
    revalidatePath("/");
    return { success: true, count: updatedCount };

  } catch (error) {
    console.error("Sync error:", error);
    return { success: false, error: "Internal error while syncing products." };
  }
}

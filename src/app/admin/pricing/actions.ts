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
            supplierProductId: bundle.supplierProductId ? bundle.supplierProductId.toString() : null,
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
            supplierProductId: bundle.supplierProductId ? bundle.supplierProductId.toString() : null,
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
    const settingsList = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = {};
    settingsList.forEach(s => settings[s.key] = s.value);
    const activeSupplierType = settings["SUPPLIER_TYPE"] || "FUZESERVE";

    const supplier = await getActiveSupplier();
    const products = await supplier.fetchProducts();
    
    let updatedCount = 0;

    for (const prod of products) {
      // Normalize supplier data
      const normalizedNetwork = prod.network.trim().toUpperCase();
      const normalizedSize = prod.size.trim().toUpperCase();

      // Find matching bundle by network and size (case-insensitive and trimmed)
      const existing = await prisma.bundle.findFirst({
        where: {
            network: { equals: normalizedNetwork, mode: 'insensitive' },
            size: { equals: normalizedSize, mode: 'insensitive' }
        }
      });

      if (existing) {
        // Update Bundle (Cache current active supplier)
        await prisma.bundle.update({
          where: { id: existing.id },
          data: {
            network: normalizedNetwork, // Force normalized format
            size: normalizedSize,
            supplierProductId: prod.id.toString(),
            userPrice: (existing.userPrice && Number(existing.userPrice) > 0) ? existing.userPrice : prod.price,
            agentPrice: (existing.agentPrice && Number(existing.agentPrice) > 0) ? existing.agentPrice : prod.resellerPrice,
            supplierPrice: prod.resellerPrice || prod.price || 0,
            isActive: true,
          }
        });

        // Update Mapping
        await prisma.supplierMapping.upsert({
            where: {
                bundleId_supplierType: {
                    bundleId: existing.id,
                    supplierType: activeSupplierType
                }
            },
            update: {
                supplierProductId: prod.id.toString(),
                supplierPrice: prod.resellerPrice || prod.price || 0,
            },
            create: {
                bundleId: existing.id,
                supplierType: activeSupplierType,
                supplierProductId: prod.id.toString(),
                supplierPrice: prod.resellerPrice || prod.price || 0,
            }
        });
        updatedCount++;

        // --- NEW: DUPLICATE CLEANUP ---
        // Delete any other bundles with the same network and size (orphans)
        await prisma.bundle.deleteMany({
          where: {
            id: { not: existing.id },
            network: { equals: normalizedNetwork, mode: 'insensitive' },
            size: { equals: normalizedSize, mode: 'insensitive' }
          }
        });
      } else {
        // Create new bundle
        const newBundle = await prisma.bundle.create({
          data: {
             network: normalizedNetwork,
             size: normalizedSize,
             supplierProductId: prod.id.toString(),
             userPrice: prod.price || 0,
             agentPrice: prod.resellerPrice || prod.price || 0,
             supplierPrice: prod.resellerPrice || prod.price || 0,
             isActive: true,
          }
        });

        // Create Mapping
        await prisma.supplierMapping.create({
            data: {
                bundleId: newBundle.id,
                supplierType: activeSupplierType,
                supplierProductId: prod.id.toString(),
                supplierPrice: prod.resellerPrice || prod.price || 0,
            }
        });
        updatedCount++;
      }
    }

    revalidatePath("/admin/pricing");
    revalidatePath("/");
    return { success: true, count: updatedCount };

  } catch (error) {
    console.error("Sync error:", error);
    return { success: false, error: "Internal error while syncing products." };
  }
}

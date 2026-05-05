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

    // 1. Process all products from supplier
    for (const prod of products) {
      const normalizedNetwork = prod.network.trim().toUpperCase();
      const normalizedSize = prod.size.trim().toUpperCase();

      const existing = await prisma.bundle.findFirst({
        where: {
            network: { equals: normalizedNetwork, mode: 'insensitive' },
            size: { equals: normalizedSize, mode: 'insensitive' }
        }
      });

      if (existing) {
        // Update existing bundle
        await prisma.bundle.update({
          where: { id: existing.id },
          data: {
            network: normalizedNetwork,
            size: normalizedSize,
            supplierProductId: prod.id.toString(),
            userPrice: (existing.userPrice && Number(existing.userPrice) > 0) ? existing.userPrice : prod.price,
            agentPrice: (existing.agentPrice && Number(existing.agentPrice) > 0) ? existing.agentPrice : prod.resellerPrice,
            supplierPrice: prod.resellerPrice || prod.price || 0,
            isActive: true,
          }
        });

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

        await prisma.supplierMapping.create({
            data: {
                bundleId: newBundle.id,
                supplierType: activeSupplierType,
                supplierProductId: prod.id.toString(),
                supplierPrice: prod.resellerPrice || prod.price || 0,
            }
        });
      }
      updatedCount++;
    }

    // 2. Run Global Cleanup once after sync
    const allBundles = await prisma.bundle.findMany({
      select: { id: true, network: true, size: true, supplierProductId: true }
    });

    const seen = new Set<string>();
    const potentialDuplicates: { network: string, size: string }[] = [];

    for (const b of allBundles) {
      const key = `${b.network.trim().toUpperCase()}_${b.size.trim().toUpperCase()}`;
      if (seen.has(key)) {
        potentialDuplicates.push({ network: b.network, size: b.size });
      }
      seen.add(key);
    }

    for (const dup of potentialDuplicates) {
      const normalizedNetwork = dup.network.trim().toUpperCase();
      const normalizedSize = dup.size.trim().toUpperCase();

      const mainBundle = await prisma.bundle.findFirst({
        where: {
          network: { equals: normalizedNetwork, mode: 'insensitive' },
          size: { equals: normalizedSize, mode: 'insensitive' },
          supplierProductId: { not: null }
        }
      });

      if (mainBundle) {
        const orphans = await prisma.bundle.findMany({
          where: {
            id: { not: mainBundle.id },
            network: { equals: normalizedNetwork, mode: 'insensitive' },
            size: { equals: normalizedSize, mode: 'insensitive' }
          },
          select: { id: true }
        });

        if (orphans.length > 0) {
          const orphanIds = orphans.map(o => o.id);
          await prisma.order.updateMany({
            where: { bundleId: { in: orphanIds } },
            data: { bundleId: mainBundle.id }
          });
          
          await prisma.bundle.deleteMany({
            where: { id: { in: orphanIds } }
          });
        }
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

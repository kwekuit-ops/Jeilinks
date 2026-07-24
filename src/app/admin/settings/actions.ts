"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSystemSettings(settings: Record<string, string>) {
  try {
    // Run all upserts in parallel instead of one-by-one
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );

    // Trigger Switch: If supplier type was changed, update all bundle caches
    if (settings["SUPPLIER_TYPE"]) {
      const newType = settings["SUPPLIER_TYPE"];
      
      const mappings = await prisma.supplierMapping.findMany({
        where: { supplierType: newType }
      });

      // Clear old supplier IDs, then apply new mappings in parallel
      await prisma.bundle.updateMany({ data: { supplierProductId: null } });

      await Promise.all(
        mappings.map(mapping =>
          prisma.bundle.update({
            where: { id: mapping.bundleId },
            data: {
              supplierProductId: mapping.supplierProductId,
              supplierPrice: mapping.supplierPrice
            }
          })
        )
      );
    }
    
    // Only revalidate the pages that actually use these settings
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Save settings error:", error);
    return { success: false, error: "Failed to save system settings." };
  }
}


export async function getSystemSettings() {
  const { unstable_noStore } = await import("next/cache");
  unstable_noStore();
  try {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {};
    settings.forEach(s => map[s.key] = s.value);
    return map;
  } catch (error) {
    console.error("Database connection error in getSystemSettings:", error);
    return {};
  }
}

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSystemSettings(settings: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }

    // Trigger Switch: If supplier type was changed, update all bundle caches
    if (settings["SUPPLIER_TYPE"]) {
      const newType = settings["SUPPLIER_TYPE"];
      
      // Get all mappings for the new supplier
      const mappings = await prisma.supplierMapping.findMany({
        where: { supplierType: newType }
      });

      // Update bundle table cache
      // First clear old supplier IDs to prevent mismatched orders
      await prisma.bundle.updateMany({
        data: { supplierProductId: null }
      });

      // Apply new mappings
      for (const mapping of mappings) {
        await prisma.bundle.update({
          where: { id: mapping.bundleId },
          data: {
            supplierProductId: mapping.supplierProductId,
            supplierPrice: mapping.supplierPrice
          }
        });
      }
    }
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Save settings error:", error);
    return { success: false, error: "Failed to save system settings." };
  }
}

export async function getSystemSettings() {
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

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_cache } from "next/cache";

export async function saveSystemSettings(settings: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Save settings error:", error);
    return { success: false, error: "Failed to save system settings." };
  }
}

export const getSystemSettings = unstable_cache(
  async () => {
    try {
      const settings = await prisma.systemSetting.findMany();
      const map: Record<string, string> = {};
      settings.forEach(s => map[s.key] = s.value);
      return map;
    } catch (error) {
      console.error("Database connection error in getSystemSettings:", error);
      return {};
    }
  },
  ["system-settings"],
  { revalidate: 3600, tags: ["system-settings"] }
);

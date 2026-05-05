import { FuzeServeProvider } from "./fuzeserve";
import { MySocialBoosterProvider } from "./mysocialbooster";
import { SupplierProvider } from "./types";
import prisma from "@/lib/prisma";

export async function getActiveSupplier(): Promise<SupplierProvider> {
  // Fetch all system settings from DB
  const settingsList = await prisma.systemSetting.findMany();
  const settings: Record<string, string> = {};
  settingsList.forEach(s => settings[s.key] = s.value);

  const type = (settings["SUPPLIER_TYPE"] || process.env.SUPPLIER_TYPE || "FUZESERVE").toUpperCase();
  
  // Try to get supplier-specific keys first, fallback to generic
  const apiKey = settings[`${type}_API_KEY`] || settings["SUPPLIER_API_KEY"] || process.env.SUPPLIER_API_KEY;
  const apiBase = settings[`${type}_API_BASE`] || settings["SUPPLIER_API_BASE"] || process.env.SUPPLIER_API_BASE;

  switch (type) {
    case "FUZESERVE":
      return new FuzeServeProvider(apiKey || "", apiBase || "");
    
    case "MYSOCIALBOOSTER":
      return new MySocialBoosterProvider(apiKey || "", apiBase || "");
      
    default:
      return new FuzeServeProvider(apiKey || "", apiBase || "");
  }
}

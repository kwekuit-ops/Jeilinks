import { FuzeServeProvider } from "./fuzeserve";
import { SupplierProvider } from "./types";
import prisma from "@/lib/prisma";

export async function getActiveSupplier(): Promise<SupplierProvider> {
  // Fetch all system settings from DB
  const settingsList = await prisma.systemSetting.findMany();
  const settings: Record<string, string> = {};
  settingsList.forEach(s => settings[s.key] = s.value);

  const type = settings["SUPPLIER_TYPE"] || process.env.SUPPLIER_TYPE || "FUZESERVE";
  const apiKey = settings["SUPPLIER_API_KEY"] || process.env.SUPPLIER_API_KEY;
  const apiBase = settings["SUPPLIER_API_BASE"] || process.env.SUPPLIER_API_BASE;

  switch (type.toUpperCase()) {
    case "FUZESERVE":
      return new FuzeServeProvider(apiKey, apiBase);
    
    // Future providers
    // case "OTHER":
    //   return new OtherProvider(apiKey, apiBase);
      
    default:
      return new FuzeServeProvider(apiKey, apiBase);
  }
}

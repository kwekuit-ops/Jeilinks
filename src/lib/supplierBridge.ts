import { FuzeServeProvider } from "./suppliers/fuzeserve";
import { MySocialBoosterProvider } from "./suppliers/mysocialbooster";
import { SupplierProvider } from "./suppliers/types";
import prisma from "@/lib/prisma";

/**
 * Returns the correct supplier instance for a given bundle.
 * Looks up the SupplierMapping table first. If no mapping exists,
 * falls back to the legacy supplierProductId + active SUPPLIER_TYPE setting.
 */
export async function getSupplierForBundle(bundleId: string): Promise<{
  supplier: SupplierProvider;
  supplierProductId: string;
  supplierType: string;
}> {
  // Fetch system settings from DB first so they are available for both mappings and fallbacks
  const settingsList = await prisma.systemSetting.findMany({
    where: { key: { in: ["SUPPLIER_TYPE", "SUPPLIER_API_KEY", "SUPPLIER_API_BASE",
                          "FUZESERVE_API_KEY", "FUZESERVE_API_BASE",
                          "MYSOCIALBOOSTER_API_KEY", "MYSOCIALBOOSTER_API_BASE"] } }
  });
  const settings: Record<string, string> = {};
  settingsList.forEach(s => settings[s.key] = s.value);

  const activeSupplierType = (settings["SUPPLIER_TYPE"] || process.env.SUPPLIER_TYPE || "FUZESERVE").toUpperCase();

  // 1. Check SupplierMapping table for an explicit per-bundle routing matching the active supplier type
  let mapping = await prisma.supplierMapping.findFirst({
    where: { 
      bundleId,
      supplierType: activeSupplierType
    },
  });

  if (!mapping) {
    mapping = await prisma.supplierMapping.findFirst({
      where: { bundleId },
    });
  }

  if (mapping) {
    const supplier = buildSupplier(mapping.supplierType, settings);
    return {
      supplier,
      supplierProductId: mapping.supplierProductId,
      supplierType: mapping.supplierType,
    };
  }

  // 2. Fallback: use the bundle's own supplierProductId + the global active supplier
  const bundle = await prisma.bundle.findUnique({
    where: { id: bundleId },
    select: { supplierProductId: true },
  });

  const type = (settings["SUPPLIER_TYPE"] || process.env.SUPPLIER_TYPE || "FUZESERVE").toUpperCase();

  return {
    supplier: buildSupplier(type, settings),
    supplierProductId: bundle?.supplierProductId || "",
    supplierType: type,
  };
}

/**
 * Instantiates a supplier provider by type name.
 * Reads API credentials from settings (DB-first, then env fallback).
 */
export function buildSupplier(type: string, settings: Record<string, string> = {}): SupplierProvider {
  const apiKey = settings[`${type}_API_KEY`] || settings["SUPPLIER_API_KEY"] || process.env.SUPPLIER_API_KEY || "";
  const apiBase = settings[`${type}_API_BASE`] || settings["SUPPLIER_API_BASE"] || process.env.SUPPLIER_API_BASE || "";

  switch (type.toUpperCase()) {
    case "FUZESERVE":
      return new FuzeServeProvider(apiKey, apiBase);
    case "MYSOCIALBOOSTER":
      return new MySocialBoosterProvider(apiKey, apiBase);
    default:
      return new FuzeServeProvider(apiKey, apiBase);
  }
}

/**
 * Place an order on the correct supplier for a given bundle.
 * This is the main entry point used by the orders route.
 */
export async function placeOrderOnSupplier(order: {
  bundleId: string;
  supplierProductId?: number | string;
  phone: string;
  reference: string;
}) {
  try {
    const { supplier, supplierProductId } = await getSupplierForBundle(order.bundleId);

    const productId = order.supplierProductId || supplierProductId;
    if (!productId) {
      return { success: false, error: "No supplier product ID configured for this bundle" };
    }

    const result = await supplier.placeOrder(productId, order.phone, order.reference);
    return result;
  } catch (err: any) {
    console.error("placeOrderOnSupplier error:", err);
    return { success: false, error: err.message || "Unknown supplier error" };
  }
}

/**
 * Track an order on the correct supplier.
 * Uses the supplierType stored on the order to pick the right provider.
 */
export async function trackOrderOnSupplier(
  supplierOrderId: string,
  supplierType: string
): Promise<any> {
  try {
    const settingsList = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = {};
    settingsList.forEach(s => settings[s.key] = s.value);

    const supplier = buildSupplier(supplierType, settings);
    return await supplier.trackOrder(supplierOrderId);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

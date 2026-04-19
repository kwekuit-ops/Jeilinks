import { getActiveSupplier } from "./suppliers";

export async function placeOrderOnSupplier(order: {
  supplierProductId: number | string;
  phone: string;
  reference: string;
}) {
  const supplier = await getActiveSupplier();
  
  try {
    const result = await supplier.placeOrder(
      order.supplierProductId, 
      order.phone, 
      order.reference
    );
    
    return result;
  } catch (err: any) {
    console.error(`Error with ${supplier.name}:`, err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

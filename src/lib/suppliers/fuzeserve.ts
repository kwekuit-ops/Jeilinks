import { SupplierProvider, StandardProduct, OrderResponse } from "./types";

export class FuzeServeProvider implements SupplierProvider {
  name = "FuzeServe";
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.SUPPLIER_API_KEY || "";
    this.baseUrl = baseUrl || process.env.SUPPLIER_API_BASE || "https://fuzeserve.com/api";
  }

  async fetchProducts(): Promise<StandardProduct[]> {
    if (!this.apiKey) throw new Error("FuzeServe API Key missing");

    const response = await fetch(`${this.baseUrl}/v1/products`, {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) throw new Error("FuzeServe fetch failed");
    
    const data = await response.json();
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      network: p.network,
      size: p.dataAmount,
      price: p.price,
      resellerPrice: p.resellerPrice || p.price
    }));
  }

  async placeOrder(productId: number | string, phone: string, reference: string): Promise<OrderResponse> {
    const response = await fetch(`${this.baseUrl}/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: JSON.stringify({
        productId: Number(productId),
        phone: phone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "FuzeServe order error" };
    }

    return {
      success: true,
      supplierOrderId: data.reference,
      status: data.status
    };
  }

  async trackOrder(supplierOrderId: string): Promise<OrderResponse> {
    const response = await fetch(`${this.baseUrl}/v1/orders/${supplierOrderId}`, {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) return { success: false, error: "Tracking failed" };
    
    const data = await response.json();
    return {
      success: true,
      status: data.status?.toUpperCase()
    };
  }

  async fetchBalance(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/v1/balance`, {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) return 0;
    const data = await response.json();
    return data.balance || 0;
  }
}

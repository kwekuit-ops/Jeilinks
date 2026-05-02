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
    // Ensure phone starts with 0 for this specific supplier
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("233")) {
      formattedPhone = "0" + formattedPhone.substring(3);
    } else if (!formattedPhone.startsWith("0")) {
      formattedPhone = "0" + formattedPhone;
    }

    const url = `${this.baseUrl}/v1/orders`;
    const body = {
      productId: Number(productId),
      phone: formattedPhone,
      externalReference: reference, // Some suppliers use this
    };

    console.log(`FuzeServe Request: POST ${url}`, JSON.stringify(body));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({ error: "Invalid JSON response" }));
      console.log(`FuzeServe Response (${response.status}):`, JSON.stringify(data));

      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || data.error || `HTTP ${response.status}: ${JSON.stringify(data)}`
        };
      }

      return {
        success: true,
        supplierOrderId: data.reference || data.id || data.orderId,
        status: data.status || "PROCESSING"
      };
    } catch (err: any) {
      console.error("FuzeServe fetch error:", err);
      return { success: false, error: `Connection error: ${err.message}` };
    }
  }

  async trackOrder(supplierOrderId: string): Promise<OrderResponse> {
    const response = await fetch(`${this.baseUrl}/v1/orders/${supplierOrderId}`, {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || "Tracking failed" };
    }
    
    const data = await response.json();
    return {
      success: true,
      status: data.status?.toUpperCase(),
      error: data.status?.toUpperCase() === "FAILED" ? (data.message || data.reason) : undefined
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

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

    // M3 FIX: Add timeout to prevent hanging supplier calls from blocking the function.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${this.baseUrl}/v1/products`, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
          "Accept": "application/json"
        },
        signal: controller.signal
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
    } finally {
      clearTimeout(timeout);
    }
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
      externalReference: reference,
    };

    console.log(`FuzeServe Request: POST ${url} phone=${formattedPhone} productId=${productId}`);

    // M3 FIX: 15-second timeout prevents hanging supplier calls from exhausting Vercel function time.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({ error: "Invalid JSON response" }));
      console.log(`FuzeServe Response (${response.status}): status=${data?.status}`);

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
      if (err.name === "AbortError") {
        console.error("FuzeServe request timed out after 15s");
        return { success: false, error: "Supplier request timed out" };
      }
      console.error("FuzeServe fetch error:", err);
      return { success: false, error: `Connection error: ${err.message}` };
    } finally {
      clearTimeout(timeout);
    }
  }

  async trackOrder(supplierOrderId: string): Promise<OrderResponse> {
    // M3 FIX: Timeout prevents slow tracking calls from blocking the cron job.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${this.baseUrl}/v1/orders/${supplierOrderId}`, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
          "Accept": "application/json"
        },
        signal: controller.signal
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
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { success: false, error: "Supplier tracking request timed out" };
      }
      return { success: false, error: err.message || "Tracking failed" };
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchBalance(): Promise<number> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${this.baseUrl}/v1/balance`, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
          "Accept": "application/json"
        },
        signal: controller.signal
      });

      if (!response.ok) return 0;
      const data = await response.json();
      return data.balance || 0;
    } catch {
      return 0;
    } finally {
      clearTimeout(timeout);
    }
  }
}

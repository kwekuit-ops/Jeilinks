import { SupplierProvider, StandardProduct, OrderResponse } from "./types";

export class MySocialBoosterProvider implements SupplierProvider {
  name = "MySocialBooster";
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    // M3 FIX: 15-second timeout prevents hanging supplier API calls.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `MySocialBooster API error: ${response.statusText}`);
      }

      return response.json();
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("MySocialBooster API request timed out");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchProducts(): Promise<StandardProduct[]> {
    const data = await this.request("/products");
    const products = data.response || [];

    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      network: this.inferNetwork(p.name),
      size: this.inferSize(p.name),
      price: Number(p.price),
      resellerPrice: Number(p.price), // Tier pricing already handled by supplier
    }));
  }

  async placeOrder(productId: string | number, phone: string, reference: string): Promise<OrderResponse> {
    try {
      const data = await this.request("/orders", {
        method: "POST",
        body: JSON.stringify({
          productId: productId.toString(),
          recipientNumber: phone,
        }),
      });

      // MySocialBooster might return 200 OK but with a success: false in the body
      if (data.success === false || !data.response) {
        return {
          success: false,
          error: data.message || "Supplier returned an empty or failed response",
        };
      }

      const order = data.response;
      return {
        success: true,
        supplierOrderId: (order.id || order.orderId || order.reference || "N/A").toString(),
        status: order.status || "PROCESSING",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async trackOrder(supplierOrderId: string): Promise<OrderResponse> {
    try {
      const data = await this.request(`/orders/${supplierOrderId}`);
      const order = data.response;
      // M7 FIX: Normalize the status so the cron job can correctly identify
      // 'completed' and 'failed' states from this supplier.
      // Without normalization, non-standard statuses like 'DONE' or 'SUCCESS' would
      // never match the cron's 'completed' check, leaving orders stuck in PROCESSING.
      const rawStatus = (order.status || "").toUpperCase();
      let normalizedStatus: string;
      if (["SUCCESS", "COMPLETED", "DELIVERED", "DONE"].includes(rawStatus)) {
        normalizedStatus = "completed";
      } else if (["FAILED", "REJECTED", "CANCELLED", "DECLINED"].includes(rawStatus)) {
        normalizedStatus = "failed";
      } else if (["PROCESSING", "IN_PROGRESS", "SENT"].includes(rawStatus)) {
        normalizedStatus = "processing";
      } else {
        normalizedStatus = rawStatus.toLowerCase();
      }

      return {
        success: true,
        supplierOrderId: order.id,
        status: normalizedStatus,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async fetchBalance(): Promise<number> {
    try {
      const data = await this.request("/wallet/balance");
      return Number(data.response.balance);
    } catch (error) {
      console.error("MySocialBooster fetchBalance error:", error);
      return 0;
    }
  }

  private inferNetwork(name: string): string {
    const n = name.toUpperCase();
    if (n.includes("SPECIAL OFFER")) return "Special Offers";
    if (n.includes("MTN")) return "MTN";
    if (n.includes("VODA") || n.includes("TELECEL")) return "Telecel";
    // "NX AT 2GB", "AIRTELTIGO", "AIRTEL", "TIGO" all map to AirtelTigo
    // Use word-boundary check so standalone "AT" is matched correctly
    if (n.includes("AIRTEL") || n.includes("TIGO") || /\bAT\b/.test(n)) return "AirtelTigo";
    if (n.includes("GLO")) return "Glo";
    return "OTHER";
  }

  private inferSize(name: string): string {
    // Also handle cases like "890. MB" by allowing optional dot before spaces
    const match = name.match(/(\d+(\.\d*)?\s*(GB|MB))/i);
    return match ? match[0].replace('. ', '') : name;
  }
}

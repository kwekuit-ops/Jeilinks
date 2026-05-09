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
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `MySocialBooster API error: ${response.statusText}`);
    }

    return response.json();
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

      const order = data.response;
      return {
        success: true,
        supplierOrderId: order.id || order.orderId,
        status: order.status,
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
      return {
        success: true,
        supplierOrderId: order.id,
        status: order.status,
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
    if (n.includes("MTN")) return "MTN";
    if (n.includes("VODA") || n.includes("TELECEL")) return "Telecel";
    if (n.includes("AIRTEL") || n.includes("TIGO") || n.includes("AT")) return "AirtelTigo";
    if (n.includes("GLO")) return "Glo";
    return "OTHER";
  }

  private inferSize(name: string): string {
    const match = name.match(/(\d+(\.\d+)?\s*(GB|MB))/i);
    return match ? match[0] : name;
  }
}

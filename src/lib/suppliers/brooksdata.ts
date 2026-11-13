import { SupplierProvider, StandardProduct, OrderResponse } from "./types";

export class BrooksDataProvider implements SupplierProvider {
  name = "BrooksData";
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    const resolved = baseUrl || "https://myspaceserver.com/api";
    this.baseUrl = resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const err = new Error(data.error || data.message || `BrooksData API error: ${response.status}`) as any;
        throw err;
      }

      return data;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("BrooksData API request timed out");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchProducts(): Promise<StandardProduct[]> {
    const data = await this.request("/external/packages");
    const rawPackages = data.packages || [];

    // Filter to Master Beneficiary (default branch) so each bundle size has unique ID
    const packages = rawPackages.filter((p: any) => !p.branch_name || p.branch_name === "Master Beneficiary");

    return packages.map((p: any) => ({
      id: p.id,
      name: p.name,
      network: this.normalizeNetwork(p.network || ""),
      size: p.size ? `${p.size}GB` : p.name,
      price: Number(p.cost_price),
      resellerPrice: Number(p.cost_price),
    }));
  }

  async placeOrder(productId: number | string, phone: string, _reference: string): Promise<OrderResponse> {
    // Ensure phone is in local Ghana format (0XXXXXXXXX)
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("233")) {
      formattedPhone = "0" + formattedPhone.substring(3);
    } else if (!formattedPhone.startsWith("0")) {
      formattedPhone = "0" + formattedPhone;
    }

    console.log(`BrooksData Request: POST /external/orders phone=${formattedPhone} package_id=${productId}`);

    try {
      const data = await this.request("/external/orders", {
        method: "POST",
        body: JSON.stringify({
          package_id: Number(productId),
          customer_phone: formattedPhone,
        }),
      });

      if (!data.success || !data.order) {
        return {
          success: false,
          error: data.error || data.message || "BrooksData returned an empty or failed response",
        };
      }

      const order = data.order;
      console.log(`BrooksData Response: order_number=${order.order_number} status=${order.status}`);

      return {
        success: true,
        // Store order_number as the supplier order ID for tracking
        supplierOrderId: (order.order_number || order.id || "").toString(),
        status: this.normalizeStatus(order.status || "pending"),
      };
    } catch (error: any) {
      console.error("BrooksData placeOrder error:", error);
      return {
        success: false,
        error: error.message || "Order placement failed",
      };
    }
  }

  async trackOrder(supplierOrderId: string): Promise<OrderResponse> {
    try {
      const data = await this.request(
        `/external/orders/status?order_number=${encodeURIComponent(supplierOrderId)}`
      );

      if (!data.success || !data.order) {
        return {
          success: false,
          error: data.error || "Order not found",
        };
      }

      const order = data.order;
      const normalizedStatus = this.normalizeStatus(order.status || "");

      return {
        success: true,
        supplierOrderId: (order.order_number || supplierOrderId).toString(),
        status: normalizedStatus,
        error: normalizedStatus === "failed" ? (data.error || "Order failed") : undefined,
      };
    } catch (error: any) {
      console.error("BrooksData trackOrder error:", error);
      return {
        success: false,
        error: error.message || "Order tracking failed",
      };
    }
  }

  async fetchBalance(): Promise<number> {
    try {
      const data = await this.request("/external/balance");
      return Number(data.balance_ghs || 0);
    } catch (error) {
      console.error("BrooksData fetchBalance error:", error);
      return 0;
    }
  }

  /**
   * Normalize BrooksData order statuses to the standard set used by the cron job:
   * "completed", "failed", "processing"
   */
  private normalizeStatus(raw: string): string {
    const s = raw.toLowerCase();
    if (["completed"].includes(s)) return "completed";
    if (["failed", "cancelled"].includes(s)) return "failed";
    if (["pending", "processing"].includes(s)) return "processing";
    return s;
  }

  private normalizeNetwork(network: string): string {
    const n = network.toUpperCase();
    if (n.includes("MTN")) return "MTN";
    if (n.includes("VODA") || n.includes("TELECEL")) return "Telecel";
    if (n.includes("AIRTEL") || n.includes("TIGO") || /\bAT\b/.test(n)) return "AirtelTigo";
    return network || "OTHER";
  }
}

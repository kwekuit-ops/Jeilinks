import { SupplierProvider, StandardProduct, OrderResponse } from "./types";

export class MySocialBoosterProvider implements SupplierProvider {
  name = "MySocialBooster";
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    // Default to the v1.2.0 Agent API base URL if no override is configured.
    const resolved = baseUrl || "https://mysocialbooster.online/api/v1/agent";
    this.baseUrl = resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
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
          // Attach errorCode to the Error so callers (e.g. verifyRecipient) can map it
          // to a user-friendly message. Without this, errorCode is silently dropped.
          const err = new Error(errorData.message || `MySocialBooster API error: ${response.statusText}`) as any;
          err.errorCode = errorData.errorCode || null;
          throw err;
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

  /**
   * Verifies a recipient number is eligible to receive an order before placing it.
   * Uses the preferred body (productId + recipientNumber) so we also catch ORDER_UNAVAILABLE.
   * Wallet is never charged when these error codes are returned.
   */
  private async verifyRecipient(
    productId: string | number,
    recipientNumber: string
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      await this.request("/recipients/verify", {
        method: "POST",
        body: JSON.stringify({
          productId: productId.toString(),
          recipientNumber,
        }),
      });
      return { ok: true };
    } catch (err: any) {
      const errorCode: string = err.errorCode || "";
      const messageMap: Record<string, string> = {
        NUMBER_NOT_VERIFIED:
          "This number is not yet verified on the network. Please try again later.",
        NUMBER_VERIFICATION_PENDING:
          "Number verification is still pending. Please wait a moment and try again.",
        NUMBER_VERIFY_RETRY:
          "Could not verify this number right now. Please try again shortly.",
        ORDER_UNAVAILABLE:
          "This bundle is currently unavailable for this number.",
      };
      const message =
        messageMap[errorCode] ||
        err.message ||
        "Recipient verification failed. Please try again.";
      return { ok: false, message };
    }
  }

  async placeOrder(productId: string | number, phone: string, _reference: string): Promise<OrderResponse> {
    // Verify the recipient before placing the order to avoid failed orders.
    // If verification fails, reject immediately — wallet is not charged.
    const verification = await this.verifyRecipient(productId, phone);
    if (!verification.ok) {
      return { success: false, error: verification.message };
    }

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
      } else if (["FAILED", "REJECTED", "CANCELLED", "DECLINED", "PARTIAL"].includes(rawStatus)) {
        // PARTIAL = some sub-orders failed; treat as failed to trigger a refund.
        normalizedStatus = "failed";
      } else if (["PROCESSING", "IN_PROGRESS", "SENT", "PENDING"].includes(rawStatus)) {
        // PENDING is now an official status in v1.2.0 — keep polling.
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

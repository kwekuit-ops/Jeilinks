export interface StandardProduct {
  id: number | string;
  name: string;
  network: string;
  size: string;
  price: number;
  resellerPrice: number;
}

export interface OrderResponse {
  success: boolean;
  supplierOrderId?: string;
  error?: string;
  status?: string;
}

export interface SupplierProvider {
  name: string;
  fetchProducts(): Promise<StandardProduct[]>;
  placeOrder(productId: number | string, phone: string, reference: string): Promise<OrderResponse>;
  trackOrder(supplierOrderId: string): Promise<OrderResponse>;
  fetchBalance(): Promise<number>;
}

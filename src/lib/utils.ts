import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(Number(amount))
}

export function normalizeOrderStatus(status: string): string {
  const s = (status || "").toUpperCase();
  if (["SUCCESS", "COMPLETED", "DELIVERED", "DONE"].includes(s)) return "COMPLETED";
  if (["FAILED", "REJECTED", "CANCELLED", "DECLINED"].includes(s)) return "FAILED";
  if (["PROCESSING", "IN_PROGRESS", "SENT"].includes(s)) return "PROCESSING";
  if (["PENDING", "AWAITING"].includes(s)) return "PENDING";
  return s;
}

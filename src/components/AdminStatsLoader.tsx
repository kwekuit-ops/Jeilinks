"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export function AdminSupplierBalance() {
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch("/api/admin/supplier-balance");
        const data = await res.json();
        if (data.success) {
          setBalance(data.balance.toString());
        }
      } catch (err) {
        console.error("Failed to fetch supplier balance", err);
      }
    }
    fetchBalance();
  }, []);

  if (balance === null) {
      return <div className="h-8 w-24 bg-white/10 animate-pulse rounded" />;
  }

  return <span>{formatCurrency(balance)}</span>;
}

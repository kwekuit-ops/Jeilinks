"use client";

import { useEffect, useState, useMemo } from "react";

interface PaystackButtonInnerProps {
  email: string;
  amount: number;
  onSuccess: (ref: any) => void;
  onClose: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
  metadata?: any;
}

export default function PaystackButtonInner({
  email,
  amount,
  onSuccess,
  onClose,
  label,
  className,
  disabled,
  metadata
}: PaystackButtonInnerProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const reference = useMemo(() => {
    return `JL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // When user returns to the tab after redirect, check if payment was successful
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const trxref = params.get("trxref") || params.get("reference");

    if (trxref) {
      // Remove params from URL cleanly
      const url = new URL(window.location.href);
      url.searchParams.delete("trxref");
      url.searchParams.delete("reference");
      window.history.replaceState({}, "", url.toString());

      // Fire success callback so the parent can handle it
      onSuccess({ reference: trxref });
    }
  }, []);

  const handlePayment = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          email,
          externalRef: reference,
          currency: "GHS",
          metadata,
          redirectUrl: window.location.href,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.paymentUrl) {
        const errMsg = data?.error || "Could not create payment link. Please try again.";
        console.error("[Paystack] Server error:", data);
        alert(`Payment Error: ${errMsg}`);
        setIsLoading(false);
        return;
      }

      console.log("[Paystack] Redirecting to:", data.paymentUrl);
      // Redirect to Paystack's hosted checkout page
      window.location.href = data.paymentUrl;

    } catch (error: any) {
      console.error("[Paystack] Unexpected error:", error);
      alert(`Payment error: ${error?.message || error}`);
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || isLoading}
      onClick={handlePayment}
    >
      {isLoading ? "Connecting..." : label}
    </button>
  );
}

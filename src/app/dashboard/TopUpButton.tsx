"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { topUpWallet } from "./topup-action";

import PaystackButton from "@/components/PaystackButton";

export function TopUpButton({ email }: { email: string }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState("10"); // Default 10 GHS
  const [showInput, setShowInput] = useState(false);

  const handleSuccess = async (reference: any) => {
    setIsProcessing(true);
    const result = await topUpWallet(reference.reference);
    if (result.success) {
      toast.success(`Wallet topped up by GHS ${result.amount}!`);
      setShowInput(false);
    } else {
      toast.error(result.error || "Failed to top up wallet");
    }
    setIsProcessing(false);
  };

  if (!showInput) {
    return (
      <button 
        onClick={() => setShowInput(true)}
        className="mt-6 w-full py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:brightness-110 active:scale-95 transition-all"
      >
        Top Up Wallet
      </button>
    );
  }

  return (
    <div className="mt-6 space-y-3 animate-in fade-in zoom-in duration-200">
      <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Amount (GHS)</span>
          <button onClick={() => setShowInput(false)} className="text-[10px] underline ml-auto">Cancel</button>
      </div>
      <input 
        type="number" 
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full bg-background border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
        placeholder="Enter amount"
      />
      <PaystackButton
        email={email}
        amount={parseFloat(amount)}
        publicKey=""
        label={isProcessing ? "Processing..." : `Pay GHS ${amount}`}
        className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
        onSuccess={handleSuccess}
        onClose={() => toast.error("Payment cancelled")}
      />
    </div>
  );
}

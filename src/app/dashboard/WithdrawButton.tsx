"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { requestWithdrawal } from "./withdraw-action";

export function WithdrawButton({ variant = "WALLET" }: { variant?: "WALLET" | "COMMISSION", balance?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  
  const isFriday = new Date().getDay() === 5;
  const isCommission = variant === "COMMISSION";
  const canWithdraw = !isCommission || isFriday;

  const title = isCommission ? "Withdraw Earnings" : "Withdraw Profit";
  const label = isCommission ? "Claim Earnings" : "Withdraw Profit";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedPhone = phone.replace(/\s/g, "");
    const ghPhoneRegex = /^(02|05)\d{8}$/;

    if (!amount || Number(amount) < 10) {
        toast.error("Minimum withdrawal is GHS 10");
        return;
    }
    if (!ghPhoneRegex.test(sanitizedPhone)) {
        toast.error("Please enter a valid Ghanaian MoMo number (e.g. 054...)");
        return;
    }

    setLoading(true);
    try {
      const res = await requestWithdrawal(Number(amount), sanitizedPhone, variant);
      if (res.success) {
        toast.success("Withdrawal request sent!");
        setIsOpen(false);
        setAmount("");
        setPhone("");
      } else {
        toast.error(res.error || "Failed to request withdrawal");
      }
    } catch (_error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 bg-secondary text-foreground py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-secondary/80 transition-all border border-border"
      >
        <ArrowUpRight className="h-4 w-4" />
        <span>{label}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border animate-in zoom-in duration-300 relative">
            <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-muted rounded-xl transition-colors"
            >
                <X className="h-5 w-5 text-muted-foreground" />
            </button>

            <h2 className="text-2xl font-black font-outfit mb-2">{title}</h2>
            <p className="text-muted-foreground text-sm mb-6 pr-8">Enter the amount and MoMo number to receive your funds.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block px-1">Amount (GHS)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">GHS</span>
                    <input
                        type="number"
                        placeholder="Min 10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 bg-muted/50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                        required
                    />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block px-1">MoMo Number</label>
                <input
                  type="text"
                  placeholder="e.g. 054XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-4 bg-muted/50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1 px-1 italic">Funds will be sent to this number upon approval.</p>
              </div>

              {!canWithdraw ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 mt-6">
                      <ArrowUpRight className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 rotate-45" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                          <strong>Withdrawal Locked:</strong> Store earnings can only be withdrawn on <strong>Fridays</strong>. Please check back then!
                      </p>
                  </div>
              ) : (
                  <div className="flex space-x-3 pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Request Payout</span>}
                    </button>
                  </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}


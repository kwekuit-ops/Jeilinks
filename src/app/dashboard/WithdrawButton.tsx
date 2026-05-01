"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { requestWithdrawal } from "./withdraw-action";

export function WithdrawButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) < 10) {
        toast.error("Minimum withdrawal is GHS 10");
        return;
    }
    if (!phone) {
        toast.error("Please enter a phone number");
        return;
    }

    setLoading(true);
    try {
      const res = await requestWithdrawal(Number(amount), phone);
      if (res.success) {
        toast.success("Withdrawal request sent!");
        setIsOpen(false);
        setAmount("");
      } else {
        toast.error(res.error || "Failed to request withdrawal");
      }
    } catch (error) {
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
        <span>Withdraw Profit</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black font-outfit mb-2">Withdraw Profit</h2>
            <p className="text-muted-foreground text-sm mb-6">Enter the amount and MoMo number to receive your funds.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block">Amount (GHS)</label>
                <input
                  type="number"
                  placeholder="Min GHS 10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block">MoMo Number</label>
                <input
                  type="text"
                  placeholder="e.g. 054XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 font-bold text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Request Payout</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

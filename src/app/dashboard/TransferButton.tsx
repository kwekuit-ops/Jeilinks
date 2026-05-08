"use client";

import { useState } from "react";
import { RefreshCw, Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { transferEarningsToWallet } from "./transfer-action";

export function TransferButton({ balance }: { balance: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
    }
    if (Number(amount) > Number(balance)) {
        toast.error("Insufficient earnings balance");
        return;
    }

    setLoading(true);
    try {
      const res = await transferEarningsToWallet(Number(amount));
      if (res.success) {
        toast.success("Transfer successful!");
        setIsOpen(false);
        setAmount("");
      } else {
        toast.error(res.error || "Transfer failed");
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
        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
      >
        <RefreshCw className="h-4 w-4" />
        <span>Move to Wallet</span>
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

            <h2 className="text-2xl font-black font-outfit mb-2">Move to Wallet</h2>
            <p className="text-muted-foreground text-sm mb-6 pr-8">Transfer your earnings to your main wallet to buy data bundles.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block px-1">Amount to Transfer (GHS)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">GHS</span>
                    <input
                        type="number"
                        placeholder={`Max ${balance}`}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 bg-muted/50 border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold"
                        required
                    />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 px-1">Available: <b>GHS {balance}</b></p>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-200 hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Confirm Transfer</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

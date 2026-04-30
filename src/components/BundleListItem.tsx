"use client";

import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { Smartphone, Zap, ArrowRight, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PaystackButton from "./PaystackButton";
import { getSystemSettings } from "@/app/admin/settings/actions";

interface BundleListItemProps {
  bundle: {
    id: string;
    network: string;
    size: string;
    userPrice: number;
    agentPrice: number;
  };
  agentId?: string;
}

export function BundleListItem({ bundle, agentId }: BundleListItemProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      const settings = await getSystemSettings();
      setPaystackKey(settings["NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"] || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "");
      
      if (session) {
          try {
            const res = await fetch('/api/user/balance');
            const data = await res.json();
            if (res.ok) setUserBalance(data.balance);
          } catch (e) {
            console.error("Balance fetch error:", e);
          }
      }
    }
    loadData();
  }, [session]);

  const role = (session?.user as any)?.role || "USER";
  const price = role === "AGENT" ? bundle.agentPrice : bundle.userPrice;

  const handleWalletPay = async () => {
    if (!phoneNumber || !/^(02|05)\d{8}$/.test(phoneNumber.replace(/\s/g, ""))) {
      toast.error("Please enter a valid Ghanaian phone number");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle.id,
          phone: phoneNumber,
          amount: price,
          agentId: agentId || null,
          paymentMethod: "WALLET"
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Order placed successfully via Wallet!");
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Wallet payment failed");
      }
    } catch (error) {
      toast.error("An error occurred during wallet payment");
    } finally {
      setIsLoading(false);
    }
  };

  const networkColors: Record<string, string> = {
    MTN: "text-mtn",
    Telecel: "text-telecel",
    AirtelTigo: "text-airteltigo",
  };

  const handleSuccess = async (reference: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle.id,
          phone: phoneNumber,
          paystackRef: reference.reference,
          amount: price,
          agentId: agentId || null,
        }),
      });

      if (res.ok) {
        toast.success("Order placed successfully!");
        router.push("/dashboard");
      } else {
        toast.error("Failed to create order.");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyClick = () => {
    if (!session) {
      toast.error("Please login to purchase");
      router.push("/login?callbackUrl=/");
      return;
    }
    setIsExpanding(!isExpanding);
  };

  return (
    <div className={`group relative transition-all duration-300 bg-card border border-border/50 rounded-xl overflow-hidden ${isExpanding ? 'ring-2 ring-primary shadow-2xl' : 'hover:shadow-lg hover:border-primary/30'}`}>
      <div className="p-3.5 md:p-6 flex items-center justify-between gap-1.5 md:gap-4">
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/50 ${networkColors[bundle.network]}`}>
            <Smartphone className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-bold font-outfit leading-tight">{bundle.size}</h3>
            <p className="text-[8px] md:text-xs text-muted-foreground uppercase font-black tracking-widest">{bundle.network}</p>
          </div>
        </div>
 
        <div className="flex items-center space-x-2 md:space-x-6">
          <div className="text-right">
            <p className="text-[8px] md:text-xs text-muted-foreground font-medium uppercase leading-none mb-0.5">Price</p>
            <p className="text-[15px] md:text-xl font-bold text-primary font-outfit leading-none">{formatCurrency(price)}</p>
          </div>
          
          <button
            onClick={handleBuyClick}
            className={`flex items-center space-x-1 md:space-x-2 px-3 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold transition-all ${
              isExpanding 
                ? 'bg-secondary text-foreground' 
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95'
            }`}
          >
            {isExpanding ? <X className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Zap className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            <span className="text-[10px] md:text-sm">{isExpanding ? "Cancel" : "Buy"}</span>
          </button>
        </div>
      </div>

      {isExpanding && (
        <div className="p-6 bg-muted/20 border-t border-dashed animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Recipient Number:</span>
                <span className="text-sm font-bold text-primary">{bundle.network} Network</span>
            </div>
            
            <div className="relative">
                <input
                  type="tel"
                  placeholder="054XXXXXXX"
                  value={phoneNumber}
                  autoFocus
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-4 text-lg font-bold outline-none focus:ring-2 focus:ring-primary shadow-inner"
                />
            </div>

            <div className="space-y-4">
                {(userBalance !== null && userBalance >= price) ? (
                    <div className="space-y-3">
                        <button
                            onClick={handleWalletPay}
                            disabled={!/^(02|05)\d{8}$/.test(phoneNumber.replace(/\s/g, "")) || isLoading}
                            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isLoading ? "Processing..." : "Confirm & Pay with Wallet"}
                        </button>
                        <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                            Payment will be deducted from your JEILINKS balance
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-center space-y-2">
                            <p className="text-xs text-red-600 font-black uppercase tracking-widest">Insufficient Wallet Balance</p>
                            <p className="text-xl font-black font-outfit">{formatCurrency(userBalance || 0)}</p>
                            <p className="text-[10px] text-red-500 font-bold">You need {formatCurrency(price)} to buy this bundle.</p>
                        </div>
                        
                        <Link 
                            href="/dashboard"
                            className="block w-full bg-primary text-primary-foreground text-center py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                        >
                            Top Up Wallet First
                        </Link>
                        
                        <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                            Add funds to your wallet to complete this purchase
                        </p>
                    </div>
                )}
            </div>
            
            {role === "AGENT" && (
              <p className="text-center text-[10px] text-green-600 font-bold uppercase mt-4">
                ★ Wholesale Agent Pricing Applied
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

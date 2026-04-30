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
  const [paystackKey, setPaystackKey] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const settings = await getSystemSettings();
      setPaystackKey(settings["NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"] || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "");
    }
    loadSettings();
  }, []);

  const role = (session?.user as any)?.role || "USER";
  const price = role === "AGENT" ? bundle.agentPrice : bundle.userPrice;

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
    <div className={`group relative transition-all duration-300 bg-card border border-border/50 rounded-2xl overflow-hidden ${isExpanding ? 'ring-2 ring-primary shadow-2xl' : 'hover:shadow-lg hover:border-primary/30'}`}>
      <div className="p-4 md:p-6 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl bg-muted/50 ${networkColors[bundle.network]}`}>
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-outfit">{bundle.size}</h3>
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{bundle.network}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground font-medium">Price</p>
            <p className="text-xl font-bold text-primary font-outfit">{formatCurrency(price)}</p>
          </div>
          
          <button
            onClick={handleBuyClick}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${
              isExpanding 
                ? 'bg-secondary text-foreground' 
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95'
            }`}
          >
            {isExpanding ? <X className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            <span className="hidden sm:inline">{isExpanding ? "Cancel" : "Buy Now"}</span>
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
                <p className="mt-2 text-[10px] text-muted-foreground text-center font-bold uppercase tracking-wider">
                    Enter the number to receive this {bundle.size} bundle
                </p>
            </div>

            <PaystackButton
              email={session?.user?.email || ""}
              amount={price}
              publicKey={paystackKey}
              label={isLoading ? "Processing..." : "Confirm & Pay Now"}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 mt-4"
              disabled={!/^(02|05)\d{8}$/.test(phoneNumber.replace(/\s/g, "")) || isLoading}
              onSuccess={handleSuccess}
              onClose={() => setIsExpanding(false)}
            />
            
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

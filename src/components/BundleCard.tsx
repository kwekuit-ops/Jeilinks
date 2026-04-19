"use client";

import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { Smartphone, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PaystackButton from "./PaystackButton";

interface BundleCardProps {
  bundle: {
    id: string;
    network: string;
    size: string;
    userPrice: number;
    agentPrice: number;
  };
  agentId?: string;
}

export function BundleCard({ bundle, agentId }: BundleCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const role = (session?.user as any)?.role || "USER";
  const price = role === "AGENT" ? bundle.agentPrice : bundle.userPrice;

  const networkColors: Record<string, string> = {
    MTN: "bg-mtn text-black",
    Telecel: "bg-telecel text-white",
    AirtelTigo: "bg-airteltigo text-white",
  };

  const handleSuccess = (reference: any) => {
    handleOrderCreation(reference.reference);
  };

  const handleOrderCreation = async (paystackRef: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle.id,
          phone: phoneNumber,
          paystackRef,
          amount: price,
          agentId: agentId || null,
        }),
      });

      if (res.ok) {
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 2000)),
          {
            loading: 'Confirming payment...',
            success: 'Order placed successfully!',
            error: 'Failed to place order',
          }
        );
        router.push("/dashboard");
      } else {
        toast.error("Failed to create order. Please contact support.");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = () => {
    if (!session) {
      toast.error("Please login to purchase");
      router.push("/login?callbackUrl=/");
      return;
    }

    if (!showPrompt) {
        setShowPrompt(true);
        return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    initializePayment({ onSuccess, onClose });
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-md transition-all hover:shadow-xl hover:-translate-y-1 border border-border/50">
      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wider ${networkColors[bundle.network] || 'bg-primary text-white'}`}>
        {bundle.network}
      </div>
      
      <div className="flex items-center space-x-4 mb-4">
        <div className={`p-3 rounded-xl ${networkColors[bundle.network] || 'bg-primary text-white'} opacity-90`}>
          <Smartphone className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold font-outfit">{bundle.size}</h3>
          <p className="text-sm text-muted-foreground">Mobile Data Bundle</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price</span>
          <span className="text-2xl font-bold text-primary font-outfit">{formatCurrency(price)}</span>
        </div>

        {showPrompt && (
          <div className="space-y-2 animate-in slide-in-from-top duration-300">
            <label className="text-xs font-medium text-muted-foreground flex justify-between">
                <span>Recipient Number</span>
                <button onClick={() => setShowPrompt(false)} className="text-[10px] underline">Back</button>
            </label>
            <input
              type="tel"
              placeholder="054XXXXXXX"
              value={phoneNumber}
              autoFocus
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary shadow-inner"
            />
          </div>
        )}

        {showPrompt ? (
          <div className="pt-2">
            <PaystackButton
              email={session?.user?.email || "guest@jeilinks.com"}
              amount={price}
              publicKey=""
              label={isLoading ? "Processing..." : "Confirm & Pay"}
              className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold font-outfit shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              disabled={!phoneNumber || isLoading}
              onSuccess={handleSuccess}
              onClose={() => toast.error("Payment cancelled")}
            />
          </div>
        ) : (
          <button
            onClick={handlePay}
            className="w-full flex items-center justify-center space-x-2 rounded-xl py-3 text-sm font-bold transition-all shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:brightness-110 active:scale-95"
          >
            <Zap className="h-4 w-4" />
            <span>Buy Now</span>
          </button>
        )}
      </div>
      
      {role === "AGENT" && (
        <div className="mt-4 pt-4 border-t border-dashed text-center">
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">Agent Wholesale Pricing Applied</p>
        </div>
      )}
    </div>
  );
}

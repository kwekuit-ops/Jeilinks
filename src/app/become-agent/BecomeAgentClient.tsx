"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { upgradeToAgent } from "./actions";
import { ShieldCheck, Zap, TrendingUp, Store } from "lucide-react";
import PaystackButton from "@/components/PaystackButton";
import { getSystemSettings } from "@/app/admin/settings/actions";
import { useEffect } from "react";

export default function BecomeAgentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paystackKey, setPaystackKey] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const settings = await getSystemSettings();
      setPaystackKey(settings["NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"] || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "");
    }
    loadSettings();
  }, []);

  const handleSuccess = async (reference: any) => {
    setIsProcessing(true);
    const result = await upgradeToAgent(reference.reference);
    if (result.success) {
      toast.success("Congratulations! You are now an AGENT.");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Failed to upgrade account");
      setIsProcessing(false);
    }
  };

  if (!session) {
      return (
          <div className="max-w-md mx-auto py-20 text-center space-y-4">
              <h1 className="text-2xl font-bold">Please Login</h1>
              <p>You need to be logged in to apply for an Agent account.</p>
              <button 
                onClick={() => router.push("/login")}
                className="bg-primary text-white px-6 py-2 rounded-xl"
              >
                  Go to Login
              </button>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 animate-in">
      <div className="text-center mb-12">
        <div className="inline-flex p-3 bg-primary/10 rounded-full mb-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black font-outfit tracking-tight mb-4">Become a JEILINKS Agent</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start your own data reselling business today. Get wholesale prices and your own personal branded store.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="glass p-6 rounded-2xl border text-center space-y-3">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl inline-block">
                  <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-bold">Wholesale Prices</h3>
              <p className="text-sm text-muted-foreground text-balance">Get massive discounts on all networks and maximize your profit margins.</p>
          </div>
          <div className="glass p-6 rounded-2xl border text-center space-y-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl inline-block">
                  <Store className="h-6 w-6" />
              </div>
              <h3 className="font-bold">Personal Store</h3>
              <p className="text-sm text-muted-foreground text-balance">Get a unique link (e.g. store/yourname) to share with your customers.</p>
          </div>
          <div className="glass p-6 rounded-2xl border text-center space-y-3">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl inline-block">
                  <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-bold">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground text-balance">Automated fulfillment ensures your customers get their data within 1 to 30 minutes.</p>
          </div>
      </div>

      <div className="max-w-md mx-auto glass p-8 rounded-3xl border-2 border-primary shadow-2xl shadow-primary/10 text-center">
          <div className="space-y-2 mb-8">
              <span className="text-xs font-black uppercase tracking-widest text-primary">Limited Time Offer</span>
              <div className="flex items-center justify-center space-x-2">
                  <span className="text-4xl font-black">GHS 50</span>
                  <span className="text-muted-foreground line-through">GHS 100</span>
              </div>
              <p className="text-sm text-muted-foreground">One-time registration fee</p>
          </div>

          <PaystackButton
            email={session?.user?.email || ""}
            amount={50}
            publicKey={paystackKey}
            onSuccess={handleSuccess}
            onClose={() => toast.error("Payment cancelled")}
            disabled={isProcessing}
            label={isProcessing ? "Upgrading..." : "Pay & Upgrade Now"}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          />
          
          <p className="text-[10px] text-muted-foreground mt-4 uppercase font-bold tracking-tighter">Secure Payment via Paystack</p>
      </div>
    </div>
  );
}

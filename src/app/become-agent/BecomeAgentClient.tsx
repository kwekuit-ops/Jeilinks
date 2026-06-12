"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { upgradeToAgent } from "./actions";
import { ShieldCheck, Zap, TrendingUp, Store, ArrowRight } from "lucide-react";
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

  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = async (reference: any) => {
    setIsProcessing(true);
    const result = await upgradeToAgent(reference.reference);
    if (result.success) {
      setWhatsappUrl(result.whatsappGroupUrl || "");
      setShowSuccess(true);
      toast.success("Congratulations! You are now an AGENT.");
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

  const isAlreadyAgent = session?.user && (session.user as any).role === "AGENT";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 animate-in">
      <div className="text-center mb-12">
        <div className="inline-flex p-3 bg-primary/10 rounded-full mb-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black font-outfit tracking-tight mb-4">
            {isAlreadyAgent ? "Renew Your Agent Status" : "Become a JEILINKS Agent"}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {isAlreadyAgent 
            ? "Your agent account gives you access to exclusive wholesale prices and a branded store. Keep your subscription active to continue selling."
            : "Start your own data reselling business today. Get wholesale prices and your own personal branded store."
          }
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

      {showSuccess ? (
        <div className="max-w-2xl mx-auto glass p-8 md:p-12 rounded-[2.5rem] border-2 border-green-500 shadow-2xl shadow-green-500/10 text-center space-y-8 animate-in zoom-in duration-500">
           <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
               <ShieldCheck className="h-12 w-12" />
           </div>
           <div>
               <h2 className="text-3xl font-black font-outfit text-green-600 mb-2">Upgrade Successful!</h2>
               <p className="text-lg text-muted-foreground">Welcome to the JEILINKS Agent Team. Your wholesale pricing and branded store are now active.</p>
           </div>

           <div className="bg-[#0d1f17] p-6 rounded-3xl border border-[#1a3a25] space-y-4">
              <div className="flex items-center justify-center space-x-2 text-[#25D366]">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-xs">Essential Next Step</span>
              </div>
              <h3 className="text-xl font-bold text-white">Join the Agents WhatsApp Community</h3>
              <p className="text-sm text-gray-400">Get instant updates, network with other agents, and get priority support in our exclusive group.</p>
              
              {whatsappUrl ? (
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-3 w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Join WhatsApp Group</span>
                  <ArrowRight className="h-6 w-6" />
                </a>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
                  <p className="text-sm text-yellow-300 font-medium">Group link will be sent to your email shortly.</p>
                  <p className="text-xs text-gray-500 mt-1">Can't find it? Contact support to get the link.</p>
                </div>
              )}
           </div>

           <div className="flex flex-col space-y-4">
              <button 
                onClick={() => router.push("/dashboard")}
                className="w-full bg-secondary text-foreground py-4 rounded-2xl font-bold hover:bg-secondary/80 transition-all"
              >
                  Go to Agent Dashboard
              </button>
           </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto glass p-8 rounded-3xl border-2 border-primary shadow-2xl shadow-primary/10 text-center">
            <div className="space-y-2 mb-8">
                <span className="text-xs font-black uppercase tracking-widest text-primary">Limited Time Offer</span>
                <div className="flex items-center justify-center space-x-2">
                    <span className="text-4xl font-black">GHS 10</span>
                    <span className="text-muted-foreground line-through text-lg">GHS 50</span>
                </div>
                <p className="text-sm text-muted-foreground">Every 2 weeks (Subscription)</p>
            </div>

            <PaystackButton
              email={session?.user?.email || ""}
              amount={10}

              publicKey={paystackKey}
              onSuccess={handleSuccess}
              onClose={() => toast.error("Payment cancelled")}
              disabled={isProcessing}
              label={isProcessing ? "Processing..." : isAlreadyAgent ? "Pay & Renew Now" : "Pay & Upgrade Now"}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              metadata={{
                type: "UPGRADE",
                userId: (session?.user as any)?.id
              }}
            />
            
            <p className="text-[10px] text-muted-foreground mt-4 uppercase font-bold tracking-tighter">Secure Payment via Paystack</p>
        </div>
      )}
    </div>
  );
}

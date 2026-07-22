"use client";

import { useSession } from "next-auth/react";
import { formatCurrency, cn } from "@/lib/utils";
import { Smartphone, Zap, ArrowRight, X, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import Link from "next/link";
import MoolreButton from "./MoolreButton";
import { getSystemSettings } from "@/app/admin/settings/actions";

interface Bundle {
  id: string;
  network: string;
  size: string;
  userPrice: number | string;
  agentPrice: number | string;
}

interface BundleListItemProps {
  bundle: Bundle;
  agentId?: string;
}

export function BundleListItem({ bundle, agentId }: BundleListItemProps) {
  const { data: session } = useSession();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [userBalance, setUserBalance] = useState<{ wallet: number, commission: number } | null>(null);
  const [moolreSettings, setMoolreSettings] = useState({ username: "", publicKey: "", accountNumber: "" });
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderRef, setOrderRef] = useState("");

  // Determine if we are on another agent's store page
  const isStorePage = !!agentId;

  const fetchBalance = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      if (res.ok) setUserBalance({ wallet: data.balance, commission: data.commissionBalance || 0 });
    } catch (e) {
      console.error("Balance fetch error:", e);
    }
  };

  useEffect(() => {
    async function loadData() {
      const settings = await getSystemSettings();
      setMoolreSettings({
        username: settings["NEXT_PUBLIC_MOOLRE_USERNAME"] || process.env.NEXT_PUBLIC_MOOLRE_USERNAME || "",
        publicKey: settings["NEXT_PUBLIC_MOOLRE_PUBLIC_KEY"] || process.env.NEXT_PUBLIC_MOOLRE_PUBLIC_KEY || "",
        accountNumber: settings["NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER"] || process.env.NEXT_PUBLIC_MOOLRE_ACCOUNT_NUMBER || ""
      });
      fetchBalance();
    }
    loadData();
  }, [session]);

  // Re-fetch balance when the user returns to the tab to prevent stale data
  useEffect(() => {
    const handleFocus = () => fetchBalance();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [session]);

  // Prefill phone and open drawer if matching bundleId in URL search params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const phoneParam = params.get("prefillPhone");
      const bundleParam = params.get("prefillBundleId");
      if (bundleParam === bundle.id && phoneParam) {
        setPhoneNumber(phoneParam);
        setIsExpanding(true);
      }
    }
  }, [bundle.id]);

  const role = (session?.user as { role?: string })?.role || "USER";
  
  // If we are logged in as an agent, we should always get the agent price 
  // unless we are specifically on ANOTHER agent's store page.
  const isMyOwnStore = session?.user && (session.user as any).id === agentId;
  const isAgent = role === "AGENT" || role === "ADMIN";
  
  const price = (isAgent && (!agentId || isMyOwnStore))
    ? Number(bundle.agentPrice) 
    : Number(bundle.userPrice);

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
        setIsSuccess(true);
        setOrderRef(data.id || phoneNumber);
        toast.success("Order placed successfully via Wallet!");
        // Re-fetch balance immediately after successful wallet payment
        fetchBalance();
      } else {
        toast.error(data.message || "Wallet payment failed");
      }
    } catch (error) {
      toast.error("An error occurred during wallet payment");
    } finally {
      setIsLoading(false);
    }
  };

  const networkStyles: Record<string, { text: string; bg: string; border: string; glow: string }> = {
    MTN: { text: "text-mtn", bg: "bg-mtn/10", border: "border-mtn/30", glow: "shadow-mtn/20" },
    Telecel: { text: "text-telecel", bg: "bg-telecel/10", border: "border-telecel/30", glow: "shadow-telecel/20" },
    AirtelTigo: { text: "text-airteltigo", bg: "bg-airteltigo/10", border: "border-airteltigo/30", glow: "shadow-airteltigo/20" },
    Glo: { text: "text-glo", bg: "bg-glo/10", border: "border-glo/30", glow: "shadow-glo/20" },
    OTHER: { text: "text-other", bg: "bg-other/10", border: "border-other/30", glow: "shadow-other/20" },
  };

  const style = networkStyles[bundle.network] || { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30", glow: "shadow-primary/20" };

  const handleSuccess = async (reference: { reference: string }) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle.id,
          phone: phoneNumber,
          paymentRef: reference.reference,
          amount: price,
          agentId: agentId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsSuccess(true);
        setOrderRef(data.id || phoneNumber);
        toast.success("Order placed successfully!");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to create order.");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyClick = () => {
    setIsExpanding(!isExpanding);
  };

  const isValidPhone = /^(02|05)\d{8}$/.test(phoneNumber.replace(/\s/g, ""));

  return (
    <div className={cn(
        "group relative transition-all duration-500 bg-white border rounded-[2rem] md:rounded-[2.5rem] overflow-hidden",
        isExpanding ? "ring-2 ring-primary shadow-2xl scale-[1.01]" : cn("hover:shadow-2xl hover:border-transparent hover:-translate-y-1", 
            bundle.network === "MTN" ? "hover:shadow-mtn/20" : 
            bundle.network === "Telecel" ? "hover:shadow-telecel/20" : 
            "hover:shadow-airteltigo/20"
        ),
        isSuccess && "ring-2 ring-green-500"
    )}>
      {/* Premium Gradient Overlay on Hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none",
        bundle.network === "MTN" ? "bg-mtn" : 
        bundle.network === "Telecel" ? "bg-telecel" : 
        "bg-airteltigo"
      )} />

      <div className="p-4 md:p-8 relative z-10">
        <div className="grid grid-cols-[48px_1fr] md:grid-cols-[80px_1fr_auto] items-center gap-4 md:gap-8">
          {/* Icon Area */}
          <div className={cn(
            "p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-sm", 
            style.bg, style.text
          )}>
            <Smartphone className="h-6 w-6 md:h-8 md:w-8" />
          </div>

          {/* Details & Price Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-8 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base md:text-2xl font-black font-outfit tracking-tight leading-tight truncate">
                    {bundle.size}
                </h3>
                {(role === "AGENT" || role === "ADMIN") && !isStorePage && (
                    <span className="bg-emerald-500 text-white text-[7px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                        AGENT DEAL
                    </span>
                )}
              </div>
              <p className={cn("text-[9px] md:text-xs font-black uppercase tracking-[0.2em] opacity-70", style.text)}>
                {bundle.network}
              </p>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="md:text-right">
                <p className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Price</p>
                <div className="flex items-center space-x-2">
                    {/* Only show "Original Price" crossed out if we are an agent seeing our discount, OR if it's a store page and we want to show a value deal */}
                    {(role === "AGENT" || role === "ADMIN") && !isStorePage && (
                        <span className="text-[10px] md:text-sm text-slate-400 line-through font-bold">
                            {formatCurrency(Number(bundle.userPrice))}
                        </span>
                    )}
                    <p className="text-base md:text-3xl font-black text-slate-900 font-outfit leading-none">
                        {formatCurrency(price)}
                    </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Button Area */}
          <div className="col-span-2 md:col-span-1 pt-1 md:pt-0">
            <button
                onClick={handleBuyClick}
                className={cn(
                    "w-full flex items-center justify-center space-x-2 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-[1.3rem] font-black transition-all active:scale-95 text-xs md:text-base",
                    isExpanding 
                        ? "bg-slate-100 text-slate-600" 
                        : "bg-primary text-white shadow-xl shadow-primary/25 hover:brightness-110"
                )}
            >
                {isExpanding ? <X className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                <span>{isExpanding ? "Close" : "Buy Now"}</span>
            </button>
          </div>
        </div>
      </div>

      {isExpanding && (
        <div className="p-6 md:p-10 bg-slate-50/80 border-t border-dashed border-slate-200 animate-in slide-in-from-top-8 duration-500">
          {isSuccess ? (
             <div className="max-w-md mx-auto text-center space-y-8 py-6 animate-in zoom-in duration-700">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative h-24 w-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-200">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                </div>

                <div>
                    <h3 className="text-3xl font-black font-outfit text-slate-900 leading-tight">Great Choice!</h3>
                    <p className="text-slate-500 mt-2 font-medium">Your {bundle.size} bundle is being delivered to <span className="text-slate-900 font-bold">{orderRef}</span>.</p>
                </div>
                
                <div className="bg-white p-6 rounded-3xl border border-dashed border-green-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Status</p>
                    <div className="flex items-center justify-center space-x-2 text-green-600 font-black">
                        <Zap className="h-4 w-4 animate-pulse" />
                        <span>PROCESSING</span>
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                    <Link 
                      href={`/track?ref=${orderRef}`}
                      className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-2xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                    >
                      <span>TRACK MY ORDER</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <button 
                      onClick={() => {
                        setIsExpanding(false);
                        setIsSuccess(false);
                        setPhoneNumber("");
                      }}
                      className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      Buy another bundle
                    </button>
                </div>
             </div>
          ) : (
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className={cn("h-2 w-2 rounded-full animate-pulse", style.text.replace('text-', 'bg-'))} />
                        <span className="text-sm font-black uppercase tracking-widest text-slate-500">{bundle.network} Network</span>
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
                        <ShieldCheck className="h-3 w-3 mr-1 text-green-500" />
                        SECURE CHECKOUT
                    </div>
                </div>
            
                <div className="relative group/input">
                    <div className={cn("absolute inset-y-0 left-5 flex items-center transition-colors", isValidPhone ? "text-primary" : "text-slate-400")}>
                        <Smartphone className="h-6 w-6" />
                    </div>
                    <input
                        type="tel"
                        placeholder="Recipient Phone Number (e.g. 054...)"
                        value={phoneNumber}
                        autoFocus
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\s/g, ""))}
                        className="w-full rounded-[1.5rem] border-2 border-slate-200 bg-white pl-14 pr-4 py-5 text-xl font-black outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300 placeholder:font-bold"
                    />
                </div>

                <div className="space-y-4 pt-2">
                    {(userBalance !== null && userBalance.wallet >= price) ? (
                        <div className="space-y-4">
                            <button
                                onClick={handleWalletPay}
                                disabled={!isValidPhone || isLoading}
                                className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                {isLoading ? "PROCESSING..." : "PAY WITH WALLET"}
                            </button>
                            <div className="flex flex-col items-center justify-center space-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <div className="flex items-center space-x-2">
                                    <span>Wallet:</span>
                                    <span className="text-slate-900 font-black">{formatCurrency(userBalance.wallet)}</span>
                                </div>
                                {userBalance.commission > 0 && (
                                    <div className="flex items-center space-x-2 opacity-60">
                                        <span>Earnings:</span>
                                        <span className="text-slate-600">{formatCurrency(userBalance.commission)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <MoolreButton
                                email={session?.user?.email || `${phoneNumber}@jeilinks.com`}
                                amount={price}
                                username={moolreSettings.username}
                                publicKey={moolreSettings.publicKey}
                                accountNumber={moolreSettings.accountNumber}
                                onSuccess={handleSuccess}
                                onClose={() => setIsLoading(false)}
                                label={isLoading ? "PREPARING..." : `PAY ${formatCurrency(price)} NOW`}
                                disabled={!isValidPhone || isLoading}
                                className="w-full bg-[#00c3f7] text-white py-5 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-blue-200 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                                metadata={{
                                    type: "BUNDLE_PURCHASE",
                                    bundleId: bundle.id,
                                    phone: phoneNumber,
                                    agentId: agentId || null,
                                    userId: session?.user ? (session.user as any).id : null
                                }}
                            />
                            
                            {session && (
                                <Link 
                                    href="/dashboard"
                                    className="flex items-center justify-center w-full text-slate-500 font-bold text-xs hover:text-primary transition-colors"
                                >
                                    Insufficient Balance? Top up here
                                </Link>
                            )}
                            
                            <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.2em] pt-2">
                                Encrypted & Secure Payment
                            </p>
                        </div>
                    )}
                </div>
                
                {(role === "AGENT" || role === "ADMIN") && (
                <div className="bg-green-50 border border-green-100 p-3 rounded-2xl flex items-center justify-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-[10px] text-green-700 font-black uppercase tracking-wider">
                        Wholesale {role} Pricing Applied
                    </span>
                </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


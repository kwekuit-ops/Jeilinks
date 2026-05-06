"use client";

import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Save, RotateCcw, Store, Info, ExternalLink, ShieldCheck, Copy, Check, Globe } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateAgentStorePrice, resetAgentStorePrice, updateStoreSlug } from "./actions";
import Link from "next/link";

interface Bundle {
  id: string;
  network: string;
  size: string;
  userPrice: any;
  agentPrice: any;
}

interface CustomPrice {
  bundleId: string;
  customPrice: any;
}

export default function StoreManagementClient({ 
  bundles, 
  initialCustomPrices,
  storeSlug: initialStoreSlug
}: { 
  bundles: Bundle[], 
  initialCustomPrices: CustomPrice[],
  storeSlug: string | null
}) {
  const [storeSlug, setStoreSlug] = useState(initialStoreSlug || "");
  const [newSlug, setNewSlug] = useState(initialStoreSlug || "");
  const [isUpdatingSlug, setIsUpdatingSlug] = useState(false);
  const [copied, setCopied] = useState(false);

  const [customPrices, setCustomPrices] = useState<Record<string, string>>(() => {
    const prices: Record<string, string> = {};
    initialCustomPrices.forEach(cp => {
      prices[cp.bundleId] = cp.customPrice.toString();
    });
    return prices;
  });
  
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handlePriceChange = (bundleId: string, value: string) => {
    setCustomPrices(prev => ({ ...prev, [bundleId]: value }));
  };

  const handleSave = async (bundleId: string) => {
    const price = parseFloat(customPrices[bundleId]);
    if (isNaN(price) || price <= 0) return toast.error("Invalid price");

    setIsProcessing(bundleId);
    const res = await updateAgentStorePrice(bundleId, price);
    if (res.success) {
      toast.success("Price updated successfully!");
    } else {
      toast.error(res.error || "Failed to update price");
    }
    setIsProcessing(null);
  };

  const handleReset = async (bundleId: string) => {
    setIsProcessing(bundleId + "-reset");
    const res = await resetAgentStorePrice(bundleId);
    if (res.success) {
      toast.success("Price reset to default!");
      setCustomPrices(prev => {
        const next = { ...prev };
        delete next[bundleId];
        return next;
      });
    } else {
      toast.error(res.error || "Failed to reset price");
    }
    setIsProcessing(null);
  };

  const handleUpdateSlug = async () => {
    setIsUpdatingSlug(true);
    const res = await updateStoreSlug(newSlug);
    if (res.success) {
      toast.success("Store link updated!");
      setStoreSlug(res.slug!);
      setNewSlug(res.slug!);
    } else {
      toast.error(res.error || "Failed to update link");
    }
    setIsUpdatingSlug(false);
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/store/${storeSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Store link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black font-outfit">Store Management</h1>
            <p className="text-muted-foreground">Customize your storefront prices and boost your earnings.</p>
          </div>
          {storeSlug && (
              <Link 
                href={`/store/${storeSlug}`} 
                target="_blank"
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-indigo-200"
              >
                  <ExternalLink className="h-4 w-4" />
                  <span>View My Store</span>
              </Link>
          )}
      </div>

      {/* Store Link Setup */}
      <div className="glass rounded-3xl p-8 border-2 border-indigo-500/20 bg-indigo-50/5 space-y-6">
        <div className="flex items-center space-x-3 text-indigo-600">
            <Globe className="h-6 w-6" />
            <h2 className="text-xl font-bold font-outfit">Store Link Configuration</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Store Name (Custom URL)</label>
                <div className="flex items-center bg-muted/50 rounded-2xl border border-border px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <span className="text-xs font-bold text-muted-foreground shrink-0 border-r border-border pr-3 mr-3">jeilinks.com/store/</span>
                    <input 
                        type="text"
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        placeholder="my-shop"
                        className="bg-transparent border-none outline-none w-full text-sm font-bold"
                    />
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight italic">
                    {storeSlug ? "You can change your store link anytime, but old links will stop working." : "Choose a unique name for your store link."}
                </p>
            </div>
            
            <div className="flex items-center space-x-3">
                <button 
                    onClick={handleUpdateSlug}
                    disabled={isUpdatingSlug || newSlug === storeSlug || !newSlug}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                    {isUpdatingSlug ? "Updating..." : "Update Store Link"}
                </button>
                {storeSlug && (
                    <button 
                        onClick={copyToClipboard}
                        className="p-3.5 bg-white border border-indigo-200 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all shadow-sm"
                        title="Copy Store Link"
                    >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-6 rounded-3xl flex items-start space-x-4">
          <Info className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
          <div className="space-y-2">
              <h3 className="font-bold text-amber-800 dark:text-amber-400">How Pricing Works</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-500/80 leading-relaxed">
                  You buy data at the <strong>Wholesale Price</strong>. Your profit is the difference between what your customer pays and your wholesale cost. 
                  By setting a custom price, you can decide exactly how much you want to earn per sale!
              </p>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
          {bundles.map((bundle) => {
              const currentCustomPrice = customPrices[bundle.id];
              const isDefault = !currentCustomPrice;
              const displayPrice = isDefault ? bundle.userPrice.toString() : currentCustomPrice;
              const profit = parseFloat(displayPrice) - parseFloat(bundle.agentPrice.toString());

              return (
                  <div key={bundle.id} className="glass rounded-3xl p-6 border border-border/50 shadow-sm hover:border-primary/20 transition-all">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                          <div className="md:col-span-3 space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                    bundle.network === "MTN" ? "bg-mtn text-mtn-foreground" :
                                    bundle.network === "Telecel" ? "bg-telecel text-white" : "bg-airteltigo text-white"
                                )}>
                                    {bundle.network}
                                </span>
                                <h3 className="font-black text-xl font-outfit">{bundle.size}</h3>
                              </div>
                              <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Package Size</p>
                          </div>

                          <div className="md:col-span-2 space-y-1">
                              <p className="text-lg font-black">{formatCurrency(bundle.agentPrice.toString())}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Wholesale Cost</p>
                          </div>

                          <div className="md:col-span-3 space-y-2">
                              <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">GHS</span>
                                  <input 
                                    type="text"
                                    inputMode="decimal"
                                    value={displayPrice}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                            handlePriceChange(bundle.id, val);
                                        }
                                    }}
                                    className="w-full pl-12 pr-4 py-3 bg-muted/50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                  />
                              </div>
                              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest px-1">
                                  {isDefault ? "Current: System Default" : "Current: Custom Price"}
                              </p>
                          </div>

                          <div className="md:col-span-2 text-center md:text-left">
                              <div className={cn(
                                  "inline-flex flex-col px-4 py-2 rounded-2xl border",
                                  profit > 0 ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
                              )}>
                                  <span className="text-lg font-black font-outfit">{formatCurrency(profit.toString())}</span>
                                  <span className="text-[9px] uppercase font-bold tracking-widest">Your Profit</span>
                              </div>
                          </div>

                          <div className="md:col-span-2 flex justify-end space-x-2">
                              {!isDefault && (
                                  <button
                                    onClick={() => handleReset(bundle.id)}
                                    disabled={isProcessing === bundle.id + "-reset"}
                                    className="p-3 bg-muted hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                                    title="Reset to Default"
                                  >
                                      <RotateCcw className={cn("h-4 w-4", isProcessing === bundle.id + "-reset" && "animate-spin")} />
                                  </button>
                              )}
                              <button
                                onClick={() => handleSave(bundle.id)}
                                disabled={isProcessing === bundle.id || isDefault && displayPrice === bundle.userPrice.toString() || !currentCustomPrice && isDefault}
                                className={cn(
                                    "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-xs transition-all",
                                    "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50"
                                )}
                              >
                                  {isProcessing === bundle.id ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                                  <span>Save</span>
                              </button>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
}

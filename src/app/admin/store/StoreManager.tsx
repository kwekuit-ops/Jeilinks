"use client";

import { useState } from "react";
import { Store, Copy, ExternalLink, Loader2, Share2, Check, Trash2, Edit3, Save, X, RefreshCw, ShoppingBag } from "lucide-react";
import { toast } from "react-hot-toast";
import { generateAdminStoreSlug, deleteAdminStore, updateStoreSlug } from "../actions";
import { cn } from "@/lib/utils";

interface StoreManagerProps {
  initialSlug: string | null;
  adminName: string;
  bundles: any[];
  storeOrderCount: number;
}

export default function StoreManager({ initialSlug, adminName, bundles, storeOrderCount }: StoreManagerProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState(initialSlug || "");
  const [isSavingSlug, setIsSavingSlug] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const storeUrl = slug ? `${origin}/store/${slug}` : "";

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateAdminStoreSlug();
      if (res.success && res.slug) {
        setSlug(res.slug);
        setSlugInput(res.slug);
        toast.success("✅ Store created successfully!");
      } else {
        toast.error(res.error || "Failed to create store");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure? This will remove your store link. Existing customers will no longer be able to access it.")) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminStore();
      if (res.success) {
        setSlug(null);
        setSlugInput("");
        toast.success("Store link removed");
      } else {
        toast.error(res.error || "Failed to remove store");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveSlug = async () => {
    setIsSavingSlug(true);
    try {
      const res = await updateStoreSlug(slugInput);
      if (res.success && res.slug) {
        setSlug(res.slug);
        setSlugInput(res.slug);
        setIsEditingSlug(false);
        toast.success("Store URL updated!");
      } else {
        toast.error(res.error || "Failed to update URL");
      }
    } finally {
      setIsSavingSlug(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareStore = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${adminName}'s Data Store`, url: storeUrl });
    } else {
      copyToClipboard();
    }
  };

  // No store yet
  if (!slug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in">
        <div className="text-center space-y-4">
          <div className="inline-flex p-6 bg-primary/10 rounded-full">
            <Store className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-3xl font-black font-outfit">Create Your Store</h2>
          <p className="text-muted-foreground max-w-md">
            Get a shareable link where customers can buy data directly from you — no account needed on their end.
          </p>
        </div>
        <button
          disabled={isGenerating}
          onClick={handleGenerate}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg flex items-center space-x-3 hover:brightness-110 transition-all disabled:opacity-70 shadow-lg shadow-primary/20"
        >
          {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Store className="h-5 w-5" />}
          <span>{isGenerating ? "Creating..." : "Create My Store"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit">My Store</h1>
          <p className="text-muted-foreground">Manage your shareable data store and its settings.</p>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href={`/store/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 border rounded-xl font-bold text-sm hover:bg-muted transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Preview Store</span>
          </a>
          <button
            onClick={shareStore}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:brightness-110 transition-all"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-border/50">
          <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Total Bundles</p>
          <p className="text-3xl font-black font-outfit text-primary">{bundles.length}</p>
        </div>
        <div className="glass rounded-2xl p-5 border border-border/50">
          <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Store Orders</p>
          <p className="text-3xl font-black font-outfit">{storeOrderCount}</p>
        </div>
        <div className="glass rounded-2xl p-5 border border-border/50 col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Status</p>
          <span className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block" />
            <span>LIVE</span>
          </span>
        </div>
      </div>

      {/* Store URL Card */}
      <div className="glass rounded-2xl p-6 border border-border/50 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center space-x-2">
            <Store className="h-5 w-5 text-primary" />
            <span>Store Link</span>
          </h3>
          <div className="flex items-center space-x-2">
            {!isEditingSlug && (
              <button
                onClick={() => setIsEditingSlug(true)}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold border rounded-lg hover:bg-muted transition-all"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit URL</span>
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
            >
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              <span>Remove</span>
            </button>
          </div>
        </div>

        {isEditingSlug ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Customize your store URL slug (only lowercase letters, numbers and dashes):</p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap font-mono">{origin}/store/</span>
              <input
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                className="flex-1 border border-primary rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="my-store-name"
              />
              <button
                onClick={handleSaveSlug}
                disabled={isSavingSlug}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-70 flex items-center space-x-1"
              >
                {isSavingSlug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save</span>
              </button>
              <button
                onClick={() => { setIsEditingSlug(false); setSlugInput(slug); }}
                className="p-2 rounded-lg border hover:bg-muted transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-xl border border-border">
            <code className="text-sm font-mono truncate flex-1 text-primary">{storeUrl}</code>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-background rounded-lg transition-all active:scale-95 text-primary flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Share this link with customers. They can browse and buy bundles without creating an account.
        </p>
      </div>

      {/* Bundles Preview */}
      <div className="glass rounded-2xl p-6 border border-border/50 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span>Store Bundles</span>
          </h3>
          <a
            href="/admin/pricing"
            className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
          >
            <Edit3 className="h-3 w-3" />
            <span>Edit Prices</span>
          </a>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Your store displays all active bundles. Manage pricing and availability from the <strong>Pricing</strong> tab.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-[11px] uppercase tracking-wider">Network</th>
                <th className="px-4 py-3 text-left font-bold text-[11px] uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left font-bold text-[11px] uppercase tracking-wider">Customer Price</th>
                <th className="px-4 py-3 text-left font-bold text-[11px] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bundles.slice(0, 10).map((bundle: any) => (
                <tr key={bundle.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-bold text-primary">{bundle.network}</td>
                  <td className="px-4 py-3">{bundle.size}</td>
                  <td className="px-4 py-3 font-bold">GHS {Number(bundle.userPrice).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                      bundle.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    )}>
                      {bundle.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bundles.length > 10 && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              + {bundles.length - 10} more bundles. <a href="/admin/pricing" className="text-primary font-bold hover:underline">Manage all →</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

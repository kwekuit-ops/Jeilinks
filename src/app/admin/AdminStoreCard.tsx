"use client";

import { useState } from "react";
import { Store, Copy, ExternalLink, Loader2, Share2, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { generateAdminStoreSlug } from "./actions";

interface AdminStoreCardProps {
  initialSlug: string | null;
  adminName: string;
}

export default function AdminStoreCard({ initialSlug, adminName }: AdminStoreCardProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const storeUrl = typeof window !== "undefined" ? `${window.location.origin}/store/${slug}` : "";

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateAdminStoreSlug();
      if (res.success && res.slug) {
        setSlug(res.slug);
        toast.success("Store slug generated!");
      } else {
        toast.error(res.error || "Failed to generate slug");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!slug) {
    return (
      <div className="glass rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <Store className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Your Admin Store</h3>
          <p className="text-sm text-muted-foreground">You haven't set up your shareable store link yet.</p>
        </div>
        <button
          disabled={isGenerating}
          onClick={handleGenerate}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold flex items-center space-x-2 hover:brightness-110 transition-all disabled:opacity-70"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
          <span>Generate Store Link</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Share2 className="h-5 w-5" />
          </div>
          <h3 className="font-bold">Your Shareable Store</h3>
        </div>
        <a 
          href={`/store/${slug}`} 
          target="_blank" 
          className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
          title="Preview Store"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Store Link</p>
        <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-xl border border-border">
          <code className="text-xs font-mono truncate flex-1">{storeUrl}</code>
          <button 
            onClick={copyToClipboard}
            className="p-2 hover:bg-background rounded-lg transition-all active:scale-95 text-primary"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Share this link with customers to allow them to buy data directly from you without needing an account.
      </p>
    </div>
  );
}

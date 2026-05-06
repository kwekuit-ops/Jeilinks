"use client";

import { Share2, Link, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

export function StoreActions({ storeName, storeSlug }: { storeName: string; storeSlug: string }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/store/${storeSlug}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${storeName}'s Data Store`,
          text: `Buy cheap data bundles from ${storeName} on JEILINKS!`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Store link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center space-x-3 mt-6">
      <button
        onClick={handleShare}
        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl border border-white/20 transition-all active:scale-95 font-bold text-sm shadow-xl"
      >
        <Share2 className="h-4 w-4" />
        <span>Share Store</span>
      </button>
      
      <button
        onClick={copyToClipboard}
        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl border border-white/20 transition-all active:scale-95 font-bold text-sm shadow-xl"
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Link className="h-4 w-4" />}
        <span>{copied ? "Copied!" : "Copy Link"}</span>
      </button>
    </div>
  );
}

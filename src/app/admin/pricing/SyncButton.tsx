"use client";

import { useState } from "react";
import { syncSupplierProducts } from "./actions";
import { toast } from "react-hot-toast";
import { RefreshCw } from "lucide-react";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.loading("Syncing with provider...");
    
    try {
      const res = await syncSupplierProducts();
      toast.dismiss();
      
      if (res.success) {
        toast.success(`Success! Synced ${res.count} products from provider.`);
      } else {
        toast.error(res.error || "Failed to sync products.");
      }
    } catch (e) {
      toast.dismiss();
      toast.error("Internal error occurred during sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button 
      onClick={handleSync}
      disabled={isSyncing}
      className="mt-4 flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      <span>{isSyncing ? "Syncing..." : "Force Auto-Sync Now"}</span>
    </button>
  );
}

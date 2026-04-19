"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { refreshOrderStatus } from "@/app/dashboard/actions";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export function RefreshOrderButton({ orderId }: { orderId: string }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await refreshOrderStatus(orderId);
    
    if (result.success) {
      if (result.message) {
        toast.success(result.message);
      } else {
        toast.success(`Order status updated to ${result.status}!`);
      }
    } else {
      toast.error(result.error || "Failed to refresh");
    }
    setIsRefreshing(false);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refresh Status"
      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-all active:scale-95 disabled:opacity-50"
    >
      <RotateCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
    </button>
  );
}

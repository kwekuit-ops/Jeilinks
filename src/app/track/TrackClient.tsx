"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, CheckCircle2, Clock, RotateCcw, AlertCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

export default function PublicTrackingPage() {
  const [reference, setReference] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const hasSearched = useRef(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference) return;

    setIsLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track?ref=${reference}`);
      const data = await res.json();

      if (res.ok) {
        setOrder(data);
      } else {
        setError(data.message || "Order not found. Please check your reference.");
      }
    } catch (err) {
      setError("An error occurred while fetching the order status.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef && !hasSearched.current) {
        setReference(urlRef);
        // Trigger search
        hasSearched.current = true;
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        // We can't call handleTrack directly because it depends on the 'reference' state which might not be updated yet
        // So we define a helper or use the urlRef directly
        const autoSearch = async () => {
            setIsLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/orders/track?ref=${urlRef}`);
                const data = await res.json();
                if (res.ok) setOrder(data);
                else setError(data.message || "Order not found.");
            } catch (err) {
                setError("An error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        autoSearch();
    }
  }, [searchParams]);

  const statusIcons: Record<string, any> = {
    PENDING: { color: "text-yellow-600 bg-yellow-100", icon: Clock },
    PROCESSING: { color: "text-blue-600 bg-blue-100", icon: RotateCcw },
    COMPLETED: { color: "text-green-600 bg-green-100", icon: CheckCircle2 },
    FAILED: { color: "text-red-600 bg-red-100", icon: AlertCircle },
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-20 animate-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black font-outfit mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">Enter the receiver's phone number to see the latest delivery status.</p>
      </div>

      <form onSubmit={handleTrack} className="flex space-x-2 mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="e.g. 054XXXXXXXX"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Track"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 animate-in fade-in zoom-in">
          {error}
        </div>
      )}

      {order && (
        <div className="glass p-8 rounded-3xl border border-border/50 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-dashed">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{order.bundle.network}</p>
              <h2 className="text-2xl font-bold font-outfit">{order.bundle.size}</h2>
            </div>
            <div className={cn(
                "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                statusIcons[order.status]?.color || "bg-gray-100 text-gray-500"
              )}>
              {(() => {
                const Icon = statusIcons[order.status]?.icon || Clock;
                return <Icon className="h-4 w-4" />;
              })()}
              <span>{order.status}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient Number:</span>
                <span className="font-bold">{order.phone}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-bold">{formatCurrency(order.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-bold">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t space-y-3">
              <p className="text-[10px] text-center font-bold text-muted-foreground uppercase">Live status tracking</p>
              <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl">
                  <div className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${order.status === 'COMPLETED' ? 'bg-green-500' : 'bg-primary'}`} />
                      <span className="text-xs font-medium">Service Delivery Status</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{order.status === 'COMPLETED' ? 'Fulfilled' : order.status === 'FAILED' ? 'Action Required' : 'In Progress'}</span>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

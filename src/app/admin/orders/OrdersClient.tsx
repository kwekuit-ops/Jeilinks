"use client";

import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Search, RefreshCcw, User, Package, Phone, Hash, ShoppingBag } from "lucide-react";
import { RefreshOrderButton } from "@/components/RefreshOrderButton";
import Link from "next/link";

interface Order {
  id: string;
  userId: string | null;
  bundleId: string;
  phone: string;
  amount: any;
  status: string;
  paystackRef: string | null;
  paymentMethod: string;
  supplierOrderId: string | null;
  supplierStatus: string | null;
  agentId: string | null;
  commissionEarned: any;
  failureReason: string | null;
  createdAt: any;
  user: { name: string | null; email: string | null } | null;
  bundle: { network: string; size: string };
}

export function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const statusIcons: Record<string, any> = {
    PENDING: { color: "text-yellow-600 bg-yellow-100 border-yellow-200", icon: Clock },
    PROCESSING: { color: "text-blue-600 bg-blue-100 border-blue-200", icon: Clock },
    COMPLETED: { color: "text-green-600 bg-green-100 border-green-200", icon: CheckCircle },
    FAILED: { color: "text-red-600 bg-red-100 border-red-200", icon: XCircle },
  };

  const tabs = [
    { label: "All Orders", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Processing", value: "PROCESSING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Failed", value: "FAILED" },
  ];

  const filteredOrders = initialOrders.filter(order => {
    const matchesTab = activeTab === "ALL" || order.status === activeTab;
    const matchesSearch = 
      order.phone.includes(searchTerm) || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.paystackRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-2 rounded-2xl border shadow-sm">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar w-full md:w-auto">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const StatusIcon = statusIcons[order.status]?.icon || Clock;
            const statusColor = statusIcons[order.status]?.color || "bg-gray-100 text-gray-500 border-gray-200";

            return (
              <div 
                key={order.id} 
                className="group bg-card border rounded-2xl p-4 md:p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex flex-col md:grid md:grid-cols-12 gap-6 items-start md:items-center">
                  
                  {/* Info Column */}
                  <div className="col-span-3 space-y-1 w-full">
                    <div className="flex items-center space-x-2">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-black font-mono uppercase text-muted-foreground">#{order.id.substring(0, 8)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-primary" />
                        <p className="font-bold text-sm truncate">{order.user?.name || "Guest Checkout"}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground pl-6 truncate">{order.user?.email || order.paystackRef || "No Email"}</p>
                  </div>

                  {/* Bundle Column */}
                  <div className="col-span-3 space-y-1 w-full">
                    <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-primary" />
                        <p className="font-bold text-sm">
                            <span className="text-primary">{order.bundle.network}</span> {order.bundle.size}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 pl-6">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] font-black font-mono">{order.phone}</p>
                    </div>
                  </div>

                  {/* Amount Column */}
                  <div className="col-span-2 w-full">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Price Paid</p>
                    <p className="text-xl font-black font-outfit text-primary">{formatCurrency(order.amount)}</p>
                  </div>

                  {/* Status Column */}
                  <div className="col-span-2 w-full">
                    <div className={cn(
                        "inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        statusColor
                    )}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{order.supplierStatus || order.status}</span>
                    </div>
                    {order.failureReason && (
                        <p className="text-[9px] text-red-500 mt-2 font-bold leading-tight">Reason: {order.failureReason}</p>
                    )}
                  </div>

                  {/* Action Column */}
                  <div className="col-span-2 w-full flex md:justify-end items-center space-x-3">
                     {(order.status === "PROCESSING" || order.status === "PENDING") && (
                        <div className="relative group">
                             <RefreshOrderButton orderId={order.id} />
                             <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap font-black">TRACK LIVE</span>
                        </div>
                     )}
                     <Link 
                        href={`/admin/orders/${order.id}`}
                        className="p-3 bg-muted hover:bg-primary hover:text-primary-foreground rounded-xl transition-all"
                     >
                        <ArrowRight className="h-4 w-4" />
                     </Link>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-20 text-center glass border-dashed rounded-3xl">
             <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
             <p className="text-muted-foreground font-bold">No {activeTab.toLowerCase()} orders found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    );
}

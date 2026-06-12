"use client";

import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { CheckCircle2, Clock, RotateCcw, AlertCircle, Search, ClipboardList } from "lucide-react";
import { RefreshOrderButton } from "@/components/RefreshOrderButton";
import { AutoRefreshToggle } from "@/components/AutoRefreshToggle";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import Link from "next/link";


export default function UserOrdersClient({ initialOrders, currentUserId, adminWhatsApp }: { initialOrders: any[], currentUserId: string, adminWhatsApp: string }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = initialOrders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.phone.includes(searchQuery) ||
      order.bundle.network.toLowerCase().includes(searchLower) ||
      order.bundle.size.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower)
    );
  });

  const statusIcons: Record<string, any> = {
    PENDING: { color: "text-yellow-600 bg-yellow-100", icon: Clock },
    PROCESSING: { color: "text-blue-600 bg-blue-100", icon: RotateCcw },
    COMPLETED: { color: "text-green-600 bg-green-100", icon: CheckCircle2 },
    FAILED: { color: "text-red-600 bg-red-100", icon: AlertCircle },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit tracking-tight">Order History</h1>
          <p className="text-muted-foreground">Track all your data bundle purchases in one place.</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
            <AutoRefreshToggle />
            <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 flex items-center space-x-4 w-fit">
                <ClipboardList className="h-6 w-6 text-primary" />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">Total Orders</p>
                    <p className="text-xl font-black font-outfit leading-none">{initialOrders.length}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 border flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search by phone, network, or Order ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
            </div>
      </div>

      <div className="md:hidden space-y-4">
        {filteredOrders.map((order) => {
          const StatusIcon = statusIcons[order.status]?.icon || Clock;
          const isStoreSale = order.agentId === currentUserId && order.userId !== currentUserId;
          return (
            <div key={order.id} className="glass rounded-2xl p-5 border border-border/50 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg">{order.bundle.size}</span>
                    {isStoreSale && <span className="bg-indigo-100 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Store Sale</span>}
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-primary">{order.bundle.network}</span>
                </div>
                <span className={cn(
                  "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  statusIcons[order.status]?.color || "bg-gray-100 text-gray-500"
                )}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  <span>{order.supplierStatus || order.status}</span>
                </span>
              </div>

              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Number</p>
                  <p className="font-mono text-sm font-bold">{order.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                    {isStoreSale ? "Commission" : "Price"}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {isStoreSale ? formatCurrency(order.commissionEarned?.toString() || "0") : formatCurrency(order.amount.toString())}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                </span>
                 <div className="flex items-center space-x-2">
                    {(order.status === "PROCESSING" || order.status === "PENDING") && (
                        <div className="flex items-center space-x-1 text-primary text-[10px] font-bold">
                            <RefreshOrderButton orderId={order.id} />
                            <span>Refresh</span>
                        </div>
                    )}
                    {order.status === "FAILED" && (
                        <Link
                          href={`/shop?prefillPhone=${order.phone}&prefillBundleId=${order.bundleId}`}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Replace</span>
                        </Link>
                    )}
                    {adminWhatsApp && (
                      <ReportIssueButton order={order} adminWhatsApp={adminWhatsApp} />
                    )}
                </div>

              </div>
            </div>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <ClipboardList className="h-12 w-12 mx-auto mb-4" />
            <p className="font-bold">No history found</p>
          </div>
        )}
      </div>

      <div className="hidden md:block glass rounded-3xl overflow-hidden border border-border/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/80 border-b backdrop-blur-md">
              <tr>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Type</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Details</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Phone Number</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Amount/Profit</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Current Status</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Timestamp</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.status]?.icon || Clock;
                const isStoreSale = order.agentId === currentUserId && order.userId !== currentUserId;
                return (
                  <tr key={order.id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="px-6 py-5">
                        {isStoreSale ? (
                            <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tight">Sale</span>
                        ) : (
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tight">Self</span>
                        )}
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex flex-col">
                            <span className="font-bold text-base">{order.bundle.size}</span>
                            <span className="text-[10px] uppercase font-black tracking-widest text-primary">{order.bundle.network}</span>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                        <span className="font-mono bg-muted px-2 py-1 rounded text-sm">{order.phone}</span>
                    </td>
                    <td className="px-6 py-5 font-bold text-lg">
                        <div className="flex flex-col">
                            <span>{formatCurrency(order.amount.toString())}</span>
                            {isStoreSale && (
                                <span className="text-[10px] text-green-600 font-bold">+{formatCurrency(order.commissionEarned?.toString() || "0")} Profit</span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider",
                        statusIcons[order.status]?.color || "bg-gray-100 text-gray-500"
                      )}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span>{order.supplierStatus || order.status}</span>
                      </span>
                    </td>

                    <td className="px-6 py-5 text-muted-foreground">
                        <div className="flex flex-col">
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px]">{new Date(order.createdAt).toLocaleTimeString()}</span>
                        </div>
                    </td>
                     <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                            {(order.status === "PROCESSING" || order.status === "PENDING") && (
                                <RefreshOrderButton orderId={order.id} />
                            )}
                            {order.status === "FAILED" && (
                                <Link
                                  href={`/shop?prefillPhone=${order.phone}&prefillBundleId=${order.bundleId}`}
                                  className="flex items-center space-x-1 px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span>Replace Order</span>
                                </Link>
                            )}
                            {adminWhatsApp && (
                              <ReportIssueButton order={order} adminWhatsApp={adminWhatsApp} />
                            )}
                        </div>
                    </td>
                  </tr>
                )
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                        <ClipboardList className="h-16 w-16 mb-4" />
                        <p className="text-xl font-bold">No history found</p>
                        <p className="text-sm">Your data bundle purchases will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

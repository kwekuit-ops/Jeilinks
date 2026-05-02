"use client";

import { useState, useEffect } from "react";
import { getSalesReport } from "./actions";
import { formatCurrency } from "@/lib/utils";
import { 
  Calendar, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  ShoppingCart,
  Download,
  Filter
} from "lucide-react";

export default function SalesClient({ initialData }: { initialData: any }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const result = await getSalesReport(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit">Sales & Profits</h1>
          <p className="text-muted-foreground">Track your business performance and margins.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
           <div className="flex items-center space-x-2 bg-card border rounded-xl px-3 py-2 shadow-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 outline-none"
              />
              <span className="text-muted-foreground">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 outline-none"
              />
           </div>
           <button 
             onClick={handleFilter}
             disabled={loading}
             className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center space-x-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
           >
             <Filter className="h-4 w-4" />
             <span>{loading ? "Filtering..." : "Filter"}</span>
           </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="glass p-6 rounded-3xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <DollarSign className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Revenue</span>
            </div>
            <h3 className="text-2xl font-black font-outfit">{formatCurrency(data.stats.totalRevenue.toString())}</h3>
            <p className="text-xs text-muted-foreground mt-1">Total incoming payments</p>
         </div>

         <div className="glass p-6 rounded-3xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <ArrowDownRight className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded">Cost</span>
            </div>
            <h3 className="text-2xl font-black font-outfit">{formatCurrency(data.stats.totalCost.toString())}</h3>
            <p className="text-xs text-muted-foreground mt-1">Total supplier expenses</p>
         </div>

         <div className="glass p-6 rounded-3xl border border-primary/20 shadow-xl shadow-primary/5 ring-2 ring-primary/5">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded">Net Profit</span>
            </div>
            <h3 className="text-2xl font-black font-outfit text-green-600">{formatCurrency(data.stats.totalProfit.toString())}</h3>
            <p className="text-xs text-muted-foreground mt-1">Your take-home margin</p>
         </div>

         <div className="glass p-6 rounded-3xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                  <ShoppingCart className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Orders</span>
            </div>
            <h3 className="text-2xl font-black font-outfit">{data.stats.orderCount}</h3>
            <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
         </div>
      </div>

      {/* Orders Table */}
      <div className="glass rounded-3xl border border-border/50 overflow-hidden shadow-xl shadow-black/5">
         <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-bold font-outfit">Detailed History</h2>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">User</th>
                     <th className="px-6 py-4">Bundle</th>
                     <th className="px-6 py-4">Revenue</th>
                     <th className="px-6 py-4">Cost</th>
                     <th className="px-6 py-4 text-right">Profit</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                  {data.orders.map((order: any) => {
                     const revenue = Number(order.amount);
                     const cost = Number(order.bundle.supplierPrice || 0);
                     const profit = revenue - cost;
                     
                     return (
                        <tr key={order.id} className="hover:bg-muted/20 transition-colors text-sm">
                           <td className="px-6 py-4 whitespace-nowrap">
                              <p className="font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                           </td>
                           <td className="px-6 py-4">
                              <p className="font-medium">{order.user?.name || "Guest"}</p>
                              <p className="text-[10px] text-muted-foreground">{order.phone}</p>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                 <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase">{order.bundle.network}</span>
                                 <span className="font-medium">{order.bundle.size}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 font-bold">
                              {formatCurrency(revenue.toString())}
                           </td>
                           <td className="px-6 py-4 text-muted-foreground">
                              {formatCurrency(cost.toString())}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <span className={cn(
                                "px-2 py-1 rounded-lg font-bold text-xs",
                                profit > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              )}>
                                {profit > 0 ? "+" : ""}{formatCurrency(profit.toString())}
                              </span>
                           </td>
                        </tr>
                     );
                  })}
                  {data.orders.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                           No orders found for the selected period.
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

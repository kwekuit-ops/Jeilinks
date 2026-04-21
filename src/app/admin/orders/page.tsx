import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, Search, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { RefreshOrderButton } from "@/components/RefreshOrderButton";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      bundle: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const statusIcons: Record<string, any> = {
    PENDING: { color: "text-yellow-500 bg-yellow-100", icon: Clock },
    PROCESSING: { color: "text-blue-500 bg-blue-100", icon: Clock },
    COMPLETED: { color: "text-green-500 bg-green-100", icon: CheckCircle },
    FAILED: { color: "text-red-500 bg-red-100", icon: XCircle },
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Platform Orders</h1>
          <p className="text-muted-foreground">Monitor and manage all transactions</p>
        </div>
        <div className="flex space-x-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input placeholder="Search ref or phone..." className="pl-9 pr-4 py-2 border rounded-xl text-sm bg-card outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <button className="p-2 border rounded-xl bg-card hover:bg-muted transition-all">
                <Filter className="h-5 w-5" />
            </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID / Ref</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Package</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => {
                const StatusIcon = statusIcons[order.status]?.icon || Clock;
                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                        <p className="font-bold font-mono text-xs">{order.id.substring(0, 8)}...</p>
                        <p className="text-[10px] text-muted-foreground">{order.paystackRef}</p>
                    </td>
                    <td className="px-6 py-4">
                        <p className="font-medium">{order.user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{order.user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                        <span className="font-bold text-primary">{order.bundle.network}</span> {order.bundle.size}
                    </td>
                    <td className="px-6 py-4 font-mono">{order.phone}</td>
                    <td className="px-6 py-4 font-bold">{formatCurrency(order.amount.toString())}</td>
                    <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                          statusIcons[order.status]?.color || "bg-gray-100 text-gray-500"
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{order.status}</span>
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex items-center justify-end">
                      {(order.status === "PROCESSING" || order.status === "PENDING") && (
                        <RefreshOrderButton orderId={order.id} />
                      )}
                      <button className="text-xs font-bold text-primary hover:underline">Update</button>
                    </td>
                  </tr>
                )
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No orders recorded yet.
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

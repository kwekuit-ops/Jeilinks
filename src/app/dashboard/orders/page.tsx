import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { formatCurrency, cn } from "@/lib/utils";
import { CheckCircle2, Clock, RotateCcw, AlertCircle, Search, Filter, ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";

export default async function UserOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    include: { bundle: true }
  });

  const statusIcons: Record<string, any> = {
    PENDING: { color: "text-yellow-600 bg-yellow-100", icon: Clock },
    PROCESSING: { color: "text-blue-600 bg-blue-100", icon: RotateCcw },
    COMPLETED: { color: "text-green-600 bg-green-100", icon: CheckCircle2 },
    FAILED: { color: "text-red-600 bg-red-100", icon: AlertCircle },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-black font-outfit tracking-tight">Order History</h1>
        <p className="text-muted-foreground">Track all your data bundle purchases in one place.</p>
      </div>

      <div className="glass rounded-2xl p-4 border flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search by phone or network..." 
                    className="w-full pl-10 pr-4 py-2 bg-background border rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
            <div className="flex space-x-2">
                <button className="flex items-center space-x-2 px-4 py-2 border rounded-xl text-sm font-medium hover:bg-secondary transition-all">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                </button>
            </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-border/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/80 border-b backdrop-blur-md">
              <tr>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Details</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Phone Number</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Price</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Current Status</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Timestamp</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => {
                const StatusIcon = statusIcons[order.status]?.icon || Clock;
                return (
                  <tr key={order.id} className="hover:bg-primary/[0.02] transition-colors">
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
                        {formatCurrency(order.amount.toString())}
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider",
                        statusIcons[order.status]?.color || "bg-gray-100 text-gray-500"
                      )}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span>{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">
                        <div className="flex flex-col">
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px]">{new Date(order.createdAt).toLocaleTimeString()}</span>
                        </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                        <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                            View
                        </button>
                    </td>
                  </tr>
                )
              })}
              {orders.length === 0 && (
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

import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { formatCurrency } from "@/lib/utils";
import { Users, ShoppingBag, DollarSign, Zap, Wallet } from "lucide-react";
import { getActiveSupplier } from "@/lib/suppliers";

export default async function AdminDashboard() {
  const [userCount, orderCount, totalRevenue, bundlesCount] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" }
    }),
    prisma.bundle.count()
  ]);

  const supplier = await getActiveSupplier();
  const supplierBalance = await supplier.fetchBalance();

  const stats = [
    { name: "Total Users", value: userCount, icon: Users, color: "text-blue-500 bg-blue-100" },
    { name: "Total Orders", value: orderCount, icon: ShoppingBag, color: "text-purple-500 bg-purple-100" },
    { name: "Total Revenue", value: formatCurrency((totalRevenue._sum.amount || 0).toString()), icon: DollarSign, color: "text-green-500 bg-green-100" },
    { name: "Supplier Balance", value: formatCurrency(supplierBalance.toString()), icon: Wallet, color: "text-orange-500 bg-orange-100" },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold font-outfit">Dashboard Overview</h1>
        <p className="text-muted-foreground">Quick summary of platform performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="glass rounded-2xl p-6 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
            <h3 className="text-2xl font-black font-outfit mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6 border border-border/50 shadow-sm">
          <h2 className="font-bold mb-4">Recent System Activity</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground italic">Activity feed coming soon...</p>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-border/50 shadow-sm">
          <h2 className="font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 rounded-xl bg-secondary hover:bg-muted transition-all text-center">
                <p className="text-xs font-bold uppercase">Manual Credit</p>
            </button>
            <button className="p-4 rounded-xl bg-secondary hover:bg-muted transition-all text-center">
                <p className="text-xs font-bold uppercase">Force Sync</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

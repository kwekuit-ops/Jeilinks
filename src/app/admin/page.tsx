import prisma from "@/lib/prisma";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

import { formatCurrency } from "@/lib/utils";
import { Users, ShoppingBag, DollarSign, Zap, Wallet, Settings } from "lucide-react";
import Link from "next/link";
import { getActiveSupplier } from "@/lib/suppliers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminStoreCard from "./AdminStoreCard";
import DateFilter from "./DateFilter";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: dateParam } = await searchParams;
  const session = await getServerSession(authOptions);
  
  // Handle Date Filtering
  const dateStr = dateParam || new Date().toISOString().split('T')[0];
  const selectedDate = new Date(dateStr);
  
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const [userCount, orderCount, totalRevenue, pendingPayouts, pendingOrders, adminUser] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    }),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { 
        status: "COMPLETED",
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.findUnique({ where: { id: (session?.user as any)?.id } })
  ]);

  const supplier = await getActiveSupplier();
  const supplierBalance = await supplier.fetchBalance();

  const stats = [
    { name: "Total Users", value: userCount, icon: Users, color: "text-blue-500 bg-blue-100", href: "/admin/users" },
    { name: "Supplier Wallet", value: formatCurrency(supplierBalance.toString()), icon: Zap, color: "text-purple-500 bg-purple-100", href: "/admin/settings" },
    { name: "Pending Payouts", value: pendingPayouts, icon: Wallet, color: "text-red-500 bg-red-100", href: "/admin/withdrawals" },
    { name: "Orders (Selected Day)", value: orderCount, icon: ShoppingBag, color: "text-orange-500 bg-orange-100", href: "/admin/orders" },
    { name: "Revenue (Selected Day)", value: formatCurrency((totalRevenue._sum.amount || 0).toString()), icon: DollarSign, color: "text-green-500 bg-green-100", href: "/admin/sales" },
  ];


  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Dashboard Overview</h1>
          <p className="text-muted-foreground">Stats for {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Suspense fallback={<div className="h-10 w-32 bg-muted animate-pulse rounded-2xl" />}>
          <DateFilter />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <Link 
            key={stat.name} 
            href={stat.href}
            className="glass rounded-2xl p-6 border border-border/50 shadow-sm hover:scale-105 hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
            <h3 className="text-2xl font-black font-outfit mt-1">{stat.value}</h3>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AdminStoreCard initialSlug={adminUser?.storeSlug || null} adminName={adminUser?.name || "Admin"} />
        
        <div className="glass rounded-2xl p-6 border border-border/50 shadow-sm">
          <h2 className="font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/pricing" className="p-4 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-center flex flex-col items-center justify-center space-y-2">
                <DollarSign className="h-5 w-5" />
                <p className="text-[10px] font-black uppercase tracking-widest">Set Prices</p>
            </Link>
            <Link href="/admin/users" className="p-4 rounded-xl bg-secondary hover:bg-muted transition-all text-center flex flex-col items-center justify-center space-y-2">
                <Users className="h-5 w-5" />
                <p className="text-[10px] font-black uppercase tracking-widest">Manage Users</p>
            </Link>
            <Link href="/admin/withdrawals" className="p-4 rounded-xl bg-secondary hover:bg-muted transition-all text-center flex flex-col items-center justify-center space-y-2">
                <Wallet className="h-5 w-5" />
                <p className="text-[10px] font-black uppercase tracking-widest">Payouts</p>
            </Link>
            <Link href="/admin/settings" className="p-4 rounded-xl bg-secondary hover:bg-muted transition-all text-center flex flex-col items-center justify-center space-y-2">
                <Settings className="h-5 w-5" />
                <p className="text-[10px] font-black uppercase tracking-widest">API Keys</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

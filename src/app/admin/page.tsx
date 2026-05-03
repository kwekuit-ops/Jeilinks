import prisma from "@/lib/prisma";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

import { formatCurrency } from "@/lib/utils";
import { Users, ShoppingBag, DollarSign, Zap, Wallet, Settings, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getActiveSupplier } from "@/lib/suppliers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminStoreCard from "./AdminStoreCard";
import DateFilter from "./DateFilter";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ date?: string, endDate?: string }> }) {
  const { date: startDateParam, endDate: endDateParam } = await searchParams;
  const session = await getServerSession(authOptions);
  
  // Handle Date Range Filtering
  const today = new Date().toISOString().split('T')[0];
  const startDateStr = startDateParam || today;
  const endDateStr = endDateParam || startDateStr; // Default to single day if endDate is missing
  
  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(endDateStr);
  endDate.setHours(23, 59, 59, 999);

  const [
    userCount, 
    orderCount, 
    totalRevenue, 
    pendingPayouts, 
    allOrdersCount,
    completedOrders,
    failedOrders,
    allPendingOrders,
    totalUserBalance,
    adminUser,
    totalProfitData
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { 
        status: "COMPLETED",
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { status: "FAILED" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.aggregate({ _sum: { balance: true } }),
    prisma.user.findUnique({ where: { id: (session?.user as any)?.id } }),
    // To calculate profit accurately, we'd need to sum (amount - commission - supplierPrice)
    // For now, we'll estimate it as (Total Completed Amount - Total Commission - Sum of Supplier Prices for those bundles)
    prisma.order.aggregate({
        _sum: { 
            amount: true,
            commissionEarned: true
        },
        where: { status: "COMPLETED" }
    })
  ]);

  const supplier = await getActiveSupplier();
  const supplierBalance = await supplier.fetchBalance();

  // For total profit, we also need to sum up the supplier prices for completed orders
  // Since we can't easily do (amount - supplierPrice) in a single prisma aggregate without a raw query or stored cost,
  // we'll do a slightly more complex query if we want perfect accuracy, or just use a placeholder for now.
  // Let's try to get a rough profit: Revenue - Commissions - (Orders * Avg Supplier Price)
  // Or better: fetch all completed orders with bundle info (might be slow if many, but fine for now)
  const completedOrdersWithBundles = await prisma.order.findMany({
      where: { status: "COMPLETED" },
      include: { bundle: true }
  });
  
  const totalProfit = completedOrdersWithBundles.reduce((acc, order) => {
      const amount = Number(order.amount);
      const commission = Number(order.commissionEarned);
      const cost = Number(order.bundle.supplierPrice || 0);
      return acc + (amount - commission - cost);
  }, 0);

  const stats = [
    { name: "Total Users", value: userCount, icon: Users, color: "text-blue-500 bg-blue-100", href: "/admin/users" },
    { name: "Users Balance", value: formatCurrency((totalUserBalance._sum.balance || 0).toString()), icon: Wallet, color: "text-indigo-500 bg-indigo-100", href: "/admin/users" },
    { name: "My Balance", value: formatCurrency((adminUser?.balance || 0).toString()), icon: DollarSign, color: "text-emerald-500 bg-emerald-100", href: "/dashboard" },
    { name: "Supplier Wallet", value: formatCurrency(supplierBalance.toString()), icon: Zap, color: "text-purple-500 bg-purple-100", href: "/admin/settings" },
    { name: "Total Orders", value: allOrdersCount, icon: ShoppingBag, color: "text-slate-500 bg-slate-100", href: "/admin/orders" },
    { name: "Completed", value: completedOrders, icon: ShoppingBag, color: "text-green-500 bg-green-100", href: "/admin/orders?status=COMPLETED" },
    { name: "Pending", value: allPendingOrders, icon: ShoppingBag, color: "text-orange-500 bg-orange-100", href: "/admin/orders?status=PENDING" },
    { name: "Failed", value: failedOrders, icon: ShoppingBag, color: "text-red-500 bg-red-100", href: "/admin/orders?status=FAILED" },
    { name: "Total Profit", value: formatCurrency(totalProfit.toString()), icon: DollarSign, color: "text-emerald-600 bg-emerald-50", href: "/admin/sales" },
    { name: "Orders (Range)", value: orderCount, icon: ShoppingBag, color: "text-orange-400 bg-orange-50", href: "/admin/orders" },
    { name: "Revenue (Range)", value: formatCurrency((totalRevenue._sum.amount || 0).toString()), icon: DollarSign, color: "text-green-400 bg-green-50", href: "/admin/sales" },
  ];

  // Fetch Weekly Ranking (Top 5 users by completed order volume in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const rankingData = await prisma.order.groupBy({
    by: ['userId'],
    _sum: { amount: true },
    where: {
      status: "COMPLETED",
      createdAt: { gte: sevenDaysAgo }
    },
    orderBy: {
      _sum: { amount: 'desc' }
    },
    take: 5
  });

  const weeklyRanking = await Promise.all(
    rankingData.map(async (item) => {
      const user = await prisma.user.findUnique({
        where: { id: item.userId || "" },
        select: { name: true, image: true, email: true }
      });
      return {
        ...item,
        user
      };
    })
  );


  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            {startDateStr === endDateStr 
              ? `Stats for ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : `Range: ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
            }
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-32 bg-muted animate-pulse rounded-2xl" />}>
          <DateFilter />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <AdminStoreCard initialSlug={adminUser?.storeSlug || null} adminName={adminUser?.name || "Admin"} />
        </div>
        
        <div className="lg:col-span-1 glass rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold mb-4 flex items-center space-x-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Quick Links</span>
            </h2>
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

        <div className="lg:col-span-1 glass rounded-2xl p-6 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>Weekly Ranking</span>
                </h2>
                <TrendingUp className="h-4 w-4 text-green-500" />
            </div>

            <div className="space-y-4">
                {weeklyRanking.length > 0 ? weeklyRanking.map((rank, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/10">
                        <div className="flex items-center space-x-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-black ${
                                index === 0 ? "bg-yellow-100 text-yellow-700" : 
                                index === 1 ? "bg-slate-100 text-slate-700" :
                                index === 2 ? "bg-orange-100 text-orange-700" :
                                "bg-muted text-muted-foreground"
                            }`}>
                                {index + 1}
                            </div>
                            <div>
                                <p className="text-sm font-bold truncate max-w-[120px]">{rank.user?.name || "Unknown Agent"}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Top Performer</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-primary">{formatCurrency((rank._sum.amount || 0).toString())}</p>
                            <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${(Number(rank._sum.amount) / Number(weeklyRanking[0]._sum.amount)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm italic">No sales in the last 7 days</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

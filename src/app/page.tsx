import prisma from "@/lib/prisma";
import type { Bundle } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { Zap, ShieldCheck, Clock, Wallet, ArrowRight, History, CheckCircle2, RotateCcw, AlertCircle, Users, Package } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency, cn } from "@/lib/utils";
import { TopUpButton } from "./dashboard/TopUpButton";
import { RefreshOrderButton } from "@/components/RefreshOrderButton";
import { getActiveSupplier } from "@/lib/suppliers";
import { AdminSupplierBalance } from "@/components/AdminStatsLoader";
import { DollarSign } from "lucide-react";


export const metadata: Metadata = {
  title: "JEILINKS - Ghana's Fastest Data Top-up Platform",
  description: "Buy MTN, Telecel, and AirtelTigo data bundles instantly at wholesale prices. Become an agent and start earning today.",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // LOGGED IN VIEW
  if (session) {
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 3,
            include: { bundle: true }
          }
        }
      });
    } catch (err) {
      console.error("Home page user fetch error:", err);
    }

    if (!user) return null;
    
    // Calculate Admin Stats if needed
    let todayOrdersCount = 0;
    let todayProfit = 0;
    if (user.role === "ADMIN") {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [ordersCount, todayOrders] = await Promise.all([
            prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma.order.findMany({
                where: { 
                    createdAt: { gte: startOfToday },
                    status: "COMPLETED"
                },
                include: { bundle: true }
            })
        ]);
        todayOrdersCount = ordersCount;
        todayProfit = todayOrders.reduce((acc, curr) => acc + (Number(curr.amount) - Number(curr.bundle.supplierPrice || 0)), 0);
    }

    const statusIcons: Record<string, any> = {
        PENDING: { color: "text-yellow-500 bg-yellow-100", icon: Clock },
        PROCESSING: { color: "text-blue-500 bg-blue-100", icon: RotateCcw },
        COMPLETED: { color: "text-green-500 bg-green-100", icon: CheckCircle2 },
        FAILED: { color: "text-red-500 bg-red-100", icon: AlertCircle },
    };

    return (
      <div className="flex flex-col min-h-screen animate-in fade-in duration-700">
        <section className="relative py-12 md:py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
            
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black font-outfit">Hi, {(user.name || "User").split(' ')[0]} 👋</h1>
                        <p className="text-muted-foreground">What would you like to do today?</p>
                    </div>
                    <div className="hidden sm:block">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
                            {user.role} Account
                        </span>
                    </div>
                </div>

                {/* ADMIN STATS BAR */}
                {user.role === "ADMIN" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 pb-4">
                        {/* Today's Orders */}
                        <Link href="/admin/orders" className="glass p-4 md:p-5 rounded-2xl md:rounded-3xl border border-border shadow-lg flex items-center justify-between group hover:border-primary/30 transition-all">
                            <div className="flex items-center space-x-3 md:space-x-4">
                                <div className="p-2 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                    <Package className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">Orders Today</p>
                                    <h3 className="text-lg md:text-xl font-black font-outfit tracking-tighter truncate">
                                        {todayOrdersCount.toLocaleString()}
                                    </h3>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:translate-x-1 transition-all" />
                        </Link>

                        {/* Today's Profit */}
                        <div className="glass p-4 md:p-5 rounded-2xl md:rounded-3xl border border-emerald-500/20 bg-emerald-50/5 shadow-lg flex items-center justify-between group hover:border-emerald-500/40 transition-all">
                            <div className="flex items-center space-x-3 md:space-x-4">
                                <div className="p-2 md:p-3 bg-emerald-500/10 rounded-xl md:rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-[10px] font-black uppercase tracking-widest text-emerald-600/70 truncate">Profit Today</p>
                                    <h3 className="text-lg md:text-xl font-black font-outfit tracking-tighter text-emerald-600 truncate">
                                        {formatCurrency(todayProfit.toString())}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Balance */}
                        <Link href="/admin/wallet" className="glass p-4 md:p-5 rounded-2xl md:rounded-3xl border border-orange-500/20 bg-orange-50/5 shadow-lg flex items-center justify-between group hover:border-orange-500/40 transition-all">
                            <div className="flex items-center space-x-3 md:space-x-4">
                                <div className="p-2 md:p-3 bg-orange-500/10 rounded-xl md:rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
                                    <Zap className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-[10px] font-black uppercase tracking-widest text-orange-600/70 truncate">Supplier Wallet</p>
                                    <h3 className="text-lg md:text-xl font-black font-outfit tracking-tighter text-orange-600 truncate">
                                        <AdminSupplierBalance />
                                    </h3>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:translate-x-1 transition-all" />
                        </Link>

                        {/* My Wallet */}
                        <div className="glass p-4 md:p-5 rounded-2xl md:rounded-3xl border border-primary/20 bg-primary/5 shadow-lg flex items-center justify-between group hover:border-primary/40 transition-all">
                            <div className="flex items-center space-x-3 md:space-x-4">
                                <div className="p-2 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                    <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-[10px] font-black uppercase tracking-widest text-primary/70 truncate">My Wallet</p>
                                    <h3 className="text-lg md:text-xl font-black font-outfit tracking-tighter text-primary truncate">{formatCurrency(user.balance?.toString() || "0")}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Balance Card */}
                    <div className="glass rounded-3xl p-8 border border-primary/20 shadow-xl shadow-primary/5 flex flex-col justify-between group hover:border-primary/40 transition-all">
                        <div>
                            <div className="flex items-center space-x-3 mb-2 text-primary">
                                <Wallet className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Available Balance</span>
                            </div>
                            <h2 className="text-4xl font-black font-outfit tracking-tighter">
                                {formatCurrency(user.balance?.toString() || "0")}
                            </h2>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <Link href="/shop" className="flex-1 bg-primary text-primary-foreground text-center py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                                Buy Data
                            </Link>
                            <div className="flex-1">
                                <TopUpButton email={user.email || ""} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats / Recent Activity */}
                    <div className="glass rounded-3xl p-8 border border-border/50 shadow-lg flex flex-col justify-between">
                        <div>
                            <div className="flex items-center space-x-3 mb-4 text-muted-foreground">
                                <History className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Recent Activity</span>
                            </div>
                            <div className="space-y-4">
                                {user.orders.map((order) => {
                                    const StatusIcon = statusIcons[order.status]?.icon || Clock;
                                    return (
                                        <div key={order.id} className="flex items-center justify-between text-sm">
                                            <div className="flex flex-col">
                                                 <span className="font-bold">{order.bundle?.size || "Custom Bundle"}</span>
                                                 <span className="text-xs uppercase text-muted-foreground font-medium">{order.bundle?.network || "Data"}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {(order.status === "PROCESSING" || order.status === "PENDING") && (
                                                    <RefreshOrderButton orderId={order.id} />
                                                )}
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1",
                                                    statusIcons[order.status]?.color || "bg-gray-100 text-gray-500"
                                                )}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    <span>{order.status}</span>
                                                </span>
                                                {order.supplierStatus && order.supplierStatus !== order.status && (
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium italic text-right">
                                                        {order.supplierStatus}
                                                    </p>
                                                )}
                                            </div>


                                        </div>
                                    );
                                })}
                                {user.orders.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No recent orders found.</p>
                                )}
                            </div>
                        </div>
                        <Link href="/dashboard/orders" className="mt-6 text-xs font-bold text-primary flex items-center space-x-1 hover:underline">
                            <span>View all orders</span>
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                {/* Promotional Card */}
                {user.role === "USER" && (
                    <Link href="/become-agent" className="block p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform">
                            <Zap className="h-32 w-32" />
                        </div>
                        <h3 className="text-xl font-bold font-outfit mb-2">Upgrade to Agent Account</h3>
                        <p className="text-sm opacity-80 max-w-sm">Earn commissions and enjoy wholesale prices on every data bundle you buy!</p>
                    </Link>
                )}
            </div>
        </section>
      </div>
    );
  }

  let bundles: Bundle[] = [];
  let totalOrdersCount = 0;
  let adminBalance = 0;
  let dailyStats = { ordersCount: 0, dailyProfit: 0 };

  const isAdmin = false; // Logged out view

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [bundleData, ordersCount] = await Promise.all([
      prisma.bundle.findMany({
        where: { isActive: true },
        select: {
          id: true,
          network: true,
          size: true,
          userPrice: true,
          agentPrice: true,
          isActive: true
        },
        orderBy: [{ network: 'asc' }, { userPrice: 'asc' }]
      }),
      prisma.order.count()
    ]);

    bundles = bundleData as any[];
    totalOrdersCount = ordersCount;
    

  } catch (error) {
    console.error("Home page data fetch error:", error);
  }


  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-mtn/10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-border/50 animate-in fade-in zoom-in duration-1000">
            <Image 
              src="/banner.png" 
              alt="The Smartest Way to Buy Data in Ghana" 
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Link href="#bundles" className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all w-full sm:w-auto text-center">
                  Buy Data
              </Link>
              <Link href="/become-agent" className="bg-secondary text-foreground px-10 py-4 rounded-2xl font-bold text-lg hover:bg-secondary/80 transition-all border border-border w-full sm:w-auto text-center">
                  Become an Agent
              </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Stats Bar - ONLY FOR ADMIN */}
      {isAdmin && (
        <section className="py-8 px-4 -mt-10 relative z-10">
            <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Today's Orders */}
                <Link href="/admin/orders" className="glass p-5 rounded-3xl border border-border shadow-xl flex items-center space-x-4 group hover:border-primary/30 transition-all">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                        <Package className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Today's Orders</p>
                        <h3 className="text-xl font-black font-outfit tracking-tighter">{dailyStats.ordersCount.toLocaleString()}</h3>
                    </div>
                </Link>

                {/* Today's Profit */}
                <div className="glass p-5 rounded-3xl border border-emerald-500/20 bg-emerald-50/5 shadow-xl flex items-center space-x-4 group hover:border-emerald-500/40 transition-all">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Today's Profit</p>
                        <h3 className="text-xl font-black font-outfit tracking-tighter text-emerald-600">{formatCurrency(dailyStats.dailyProfit.toString())}</h3>
                    </div>
                </div>

                {/* Supplier Balance */}
                <Link href="/admin/wallet" className="glass p-5 rounded-3xl border border-orange-500/20 bg-orange-50/5 shadow-xl flex items-center space-x-4 group hover:border-orange-500/40 transition-all">
                    <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
                        <Zap className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600/70">Supplier Balance</p>
                        <h3 className="text-xl font-black font-outfit tracking-tighter text-orange-600">
                            <AdminSupplierBalance />
                        </h3>
                    </div>
                </Link>

                {/* Admin Wallet */}
                <Link href="/admin/wallet" className="glass p-5 rounded-3xl border border-primary/20 bg-primary/5 shadow-xl flex items-center space-x-4 group hover:border-primary/40 transition-all">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">My Balance</p>
                        <h3 className="text-xl font-black font-outfit tracking-tighter text-primary">{formatCurrency(adminBalance.toString())}</h3>
                    </div>
                </Link>
            </div>
        </section>
      )}


      {/* Bundles Section */}
      <section id="bundles" className="py-20 px-4 bg-muted/30 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold font-outfit">Available Bundles</h2>
              <p className="text-muted-foreground">Select a package to get started</p>
            </div>
          </div>

          {bundles.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl">
              <p className="text-lg text-muted-foreground">No bundles available at the moment. Please check back later.</p>
            </div>
          ) : (
            <BundleTabs bundles={JSON.parse(JSON.stringify(bundles))} />
          )}
        </div>
      </section>
    </div>
  );
}

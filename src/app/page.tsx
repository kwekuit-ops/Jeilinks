import prisma from "@/lib/prisma";
import type { Bundle } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { Zap, ShieldCheck, Clock, Wallet, ArrowRight, History, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency, cn } from "@/lib/utils";
import { TopUpButton } from "./dashboard/TopUpButton";
import { RefreshOrderButton } from "@/components/RefreshOrderButton";


export const metadata: Metadata = {
  title: "JEILINKS - Ghana's Fastest Data Top-up Platform",
  description: "Buy MTN, Telecel, and AirtelTigo data bundles instantly at wholesale prices. Become an agent and start earning today.",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // LOGGED IN VIEW
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { bundle: true }
        }
      }
    });

    if (!user) return null;

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
                        <h1 className="text-3xl font-black font-outfit">Hi, {user.name.split(' ')[0]} 👋</h1>
                        <p className="text-muted-foreground">What would you like to do today?</p>
                    </div>
                    <div className="hidden sm:block">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            {user.role} Account
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Balance Card */}
                    <div className="glass rounded-3xl p-8 border border-primary/20 shadow-xl shadow-primary/5 flex flex-col justify-between group hover:border-primary/40 transition-all">
                        <div>
                            <div className="flex items-center space-x-3 mb-2 text-primary">
                                <Wallet className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Available Balance</span>
                            </div>
                            <h2 className="text-4xl font-black font-outfit tracking-tighter">
                                {formatCurrency(user.balance.toString())}
                            </h2>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <Link href="/shop" className="flex-1 bg-primary text-primary-foreground text-center py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                                Buy Data
                            </Link>
                            <div className="flex-1">
                                <TopUpButton email={user.email} />
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
                                                <span className="font-bold">{order.bundle.size}</span>
                                                <span className="text-[10px] uppercase text-muted-foreground font-medium">{order.bundle.network}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {(order.status === "PROCESSING" || order.status === "PENDING") && (
                                                    <RefreshOrderButton orderId={order.id} />
                                                )}
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1",
                                                    statusIcons[order.status]?.color || "bg-gray-100 text-gray-500"
                                                )}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    <span>{order.status}</span>
                                                </span>
                                                {order.supplierStatus && order.supplierStatus !== order.status && (
                                                    <p className="text-[8px] text-muted-foreground mt-0.5 font-medium italic text-right">
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

  // PUBLIC GUEST VIEW
  let bundles: Bundle[] = [];
  try {
    bundles = await prisma.bundle.findMany({
      where: { isActive: true },
      orderBy: [
        { network: 'asc' },
        { userPrice: 'asc' }
      ]
    });
  } catch (error) {
    console.error("Home page bundle fetch error:", error);
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
              <Link href="/register" className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all w-full sm:w-auto text-center">
                  Get Started
              </Link>
              <Link href="/become-agent" className="bg-secondary text-foreground px-10 py-4 rounded-2xl font-bold text-lg hover:bg-secondary/80 transition-all border border-border w-full sm:w-auto text-center">
                  Earn as an Agent
              </Link>
          </div>
        </div>

      </section>

      {/* Trust & Features Section */}
      <section className="py-20 border-y bg-background overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Zap className="h-6 w-6" />
                  </div>
                  <div>
                      <h4 className="font-bold text-lg mb-2 font-outfit">Fast Delivery</h4>
                      <p className="text-sm text-muted-foreground">Most orders are processed within 1 to 30 minutes of payment.</p>
                  </div>
              </div>
              <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                      <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                      <h4 className="font-bold text-lg mb-2 font-outfit">Secure Payment</h4>
                      <p className="text-sm text-muted-foreground">Encrypted transactions powered by Paystack. Your data is always safe.</p>
                  </div>
              </div>
              <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                      <Clock className="h-6 w-6" />
                  </div>
                  <div>
                      <h4 className="font-bold text-lg mb-2 font-outfit">24/7 Support</h4>
                      <p className="text-sm text-muted-foreground">Our automated tracking and WhatsApp support are always available.</p>
                  </div>
              </div>
          </div>
      </section>

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

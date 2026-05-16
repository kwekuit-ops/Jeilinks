import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { formatCurrency, cn } from "@/lib/utils";
import { Wallet, History, MessageCircle, ArrowRight, CheckCircle2, Clock, RotateCcw, AlertCircle, Zap, Store, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopUpButton } from "./TopUpButton";
import { WithdrawButton } from "./WithdrawButton";
import { TransferButton } from "./TransferButton";
import { getActiveSupplier } from "@/lib/suppliers";
import { RefreshOrderButton } from "@/components/RefreshOrderButton";
import { getSystemSettings } from "../admin/settings/actions";
import { SecuritySettings } from "./SecuritySettings";
import { AdminSupplierBalance } from "@/components/AdminStatsLoader";
import { AutoRefreshToggle } from "@/components/AutoRefreshToggle";
import { Suspense } from "react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [user, completedCount, pendingWithdrawals, earningsData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        commissionBalance: true,
        agentExpiry: true,
        storeSlug: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            status: true,
            phone: true,
            amount: true,
            createdAt: true,
            supplierStatus: true,
            bundle: {
                select: {
                    network: true,
                    size: true
                }
            }
          }
        }
      }
    }),

    prisma.order.count({
      where: {
        OR: [
          { userId: (session.user as any).id },
          { agentId: (session.user as any).id }
        ],
        status: "COMPLETED"
      }
    }),
    prisma.withdrawal.aggregate({
      where: { userId: (session.user as any).id, status: "PENDING" },
      _sum: { amount: true }
    }),
    prisma.order.aggregate({
        where: { agentId: (session.user as any).id, status: "COMPLETED" },
        _sum: { commissionEarned: true }
    })
  ]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayCompletedCount, rankingsToday] = await Promise.all([
    prisma.order.count({
      where: {
        OR: [
          { userId: (session.user as any).id },
          { agentId: (session.user as any).id }
        ],
        createdAt: { gte: startOfToday },
        status: "COMPLETED"
      }
    }),
    prisma.order.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startOfToday },
        status: "COMPLETED"
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })
  ]);

  const dailyRank = rankingsToday.findIndex(r => r.userId === (session.user as any).id) + 1;
  const totalPerformers = rankingsToday.length;

  const pendingWithdrawalSum = Number(pendingWithdrawals._sum.amount || 0);
  const totalEarnings = Number(earningsData._sum.commissionEarned || 0);

  if (!user) return null;

  // AUTO-CLEANUP: Check if Agent subscription has expired
  if (user.role === "AGENT" && user.agentExpiry && new Date() > new Date(user.agentExpiry)) {
      await prisma.user.update({
          where: { id: user.id },
          data: { role: "USER" }
      });
      // Update local object so UI reflects it immediately
      user.role = "USER";
  }

  const getRank = (count: number) => {
    if (count > 200) return { name: "Platinum", color: "bg-indigo-500", icon: "💎" };
    if (count > 50) return { name: "Gold", color: "bg-yellow-500", icon: "🥇" };
    if (count > 10) return { name: "Silver", color: "bg-slate-400", icon: "🥈" };
    return { name: "Bronze", color: "bg-orange-600", icon: "🥉" };
  };

  const rank = getRank(completedCount);

  const settings = await getSystemSettings();
  const channelUrl = settings["WHATSAPP_CHANNEL_URL"] || "#";
  const publicChannelUrl = settings["PUBLIC_WHATSAPP_URL"] || "#";

  const statusIcons: Record<string, any> = {
    PENDING: { color: "text-yellow-500 bg-yellow-100", icon: Clock },
    PROCESSING: { color: "text-blue-500 bg-blue-100", icon: RotateCcw },
    COMPLETED: { color: "text-green-500 bg-green-100", icon: CheckCircle2 },
    FAILED: { color: "text-red-500 bg-red-100", icon: AlertCircle },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Hi, {user.name || "User"} 👋</h1>
          <div className="flex items-center space-x-2 mt-1">
             <p className="text-muted-foreground capitalize text-sm">{user.role}</p>
              {user.role === 'AGENT' && (
                <div className="flex items-center space-x-2">
                   <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase text-white flex items-center space-x-1", rank.color)}>
                     <span>{rank.icon}</span>
                     <span>{rank.name} Rank</span>
                   </span>
                   {(user as any).agentExpiry && (
                     <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-bold">
                       Expiry: {new Date((user as any).agentExpiry).toLocaleDateString()}
                     </span>
                   )}
                </div>
              )}

          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Suspense fallback={null}>
            <AutoRefreshToggle />
          </Suspense>
          {(user.role === "USER" || user.role === "AGENT") && (
            <Link
              href="/become-agent"
              className={cn(
                  "inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold transition-all border",
                  user.role === "AGENT" ? "bg-secondary text-foreground hover:bg-secondary/80 border-border" : "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
              )}
            >
              <span>{user.role === "AGENT" ? "Renew Subscription" : "Upgrade to AGENT"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <div className="glass rounded-2xl p-6 shadow-sm border border-border/50">
          <div className="flex items-center space-x-3 mb-4 text-primary">
            <Wallet className="h-6 w-6" />
            <h2 className="font-bold font-outfit">Wallet Balance</h2>
          </div>
          <p className="text-4xl font-black font-outfit tracking-tight">{formatCurrency(user.balance.toString())}</p>
          
          {pendingWithdrawalSum > 0 && (
            <div className="mt-2 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded-lg w-fit">
               <Clock className="h-3 w-3" />
               <span>Pending Payout: {formatCurrency(pendingWithdrawalSum.toString())}</span>
            </div>
          )}

          <TopUpButton email={user.email || ""} />
        </div>

        {/* Store Earnings Card (AGENT ONLY) */}
        {user.role === "AGENT" && (
            <div className="glass rounded-2xl p-6 shadow-sm border border-emerald-500/20 bg-emerald-50/5">
                <div className="flex items-center space-x-3 mb-4 text-emerald-600">
                    <History className="h-6 w-6" />
                    <h2 className="font-bold font-outfit">Store Earnings</h2>
                </div>
                <p className="text-4xl font-black font-outfit tracking-tight text-emerald-600">
                    {formatCurrency((user as any).commissionBalance.toString())}
                </p>
                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-emerald-600/60">
                        <span>Available to claim</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[9px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Clock className="h-2.5 w-2.5" />
                        <span>Payouts on Fridays</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <TransferButton balance={(user as any).commissionBalance.toString()} />
                    <WithdrawButton variant="COMMISSION" balance={(user as any).commissionBalance.toString()} />
                </div>
            </div>
        )}

        {user.role === "ADMIN" && (
            <div className="glass rounded-2xl p-6 shadow-md border border-orange-500/20 bg-orange-50/10">
                <div className="flex items-center space-x-3 mb-4 text-orange-600">
                    <Zap className="h-6 w-6" />
                    <h2 className="font-bold font-outfit">Supplier Account</h2>
                </div>
                <p className="text-4xl font-black font-outfit tracking-tight text-orange-600">
                    <AdminSupplierBalance />
                </p>
                <div className="mt-6 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-orange-600/60">Live FuzeServe Balance</span>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </div>
        )}

        {/* WhatsApp Card (PUBLIC - FOR EVERYONE) */}
        <div className="rounded-2xl p-6 shadow-md border bg-whatsapp/10 text-whatsapp relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
            <MessageCircle className="h-32 w-32" />
          </div>
          <div className="flex items-center space-x-3 mb-4">
            <MessageCircle className="h-6 w-6" />
            <h2 className="font-bold font-outfit">Public Channel</h2>
          </div>
          <p className="text-sm opacity-90 mb-6">Follow our public channel for general updates and special offers!</p>
          <a
            href={publicChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-whatsapp text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
          >
            Join Channel
          </a>
        </div>

        {/* WhatsApp Card (AGENT ONLY) */}
        {(user.role === 'AGENT' || user.role === 'ADMIN') && (
          <div className="rounded-2xl p-6 shadow-md border bg-whatsapp text-white relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <MessageCircle className="h-32 w-32" />
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <MessageCircle className="h-6 w-6" />
              <h2 className="font-bold font-outfit">Agent Community</h2>
            </div>
            <p className="text-sm opacity-90 mb-6">Join our exclusive community for agent support and instant updates!</p>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white text-whatsapp px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all"
            >
              Join Agent Group
            </a>
          </div>
        )}

        {/* Agent Store Card */}
        {user.role === 'AGENT' && (
          <div className="glass rounded-2xl p-6 shadow-sm border border-indigo-500/20 bg-indigo-50/5 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                  <Store className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                  <h2 className="font-bold text-lg">My Data Store</h2>
                  {(user as any).storeSlug ? (
                    <p className="text-[10px] font-mono text-indigo-600 truncate max-w-[150px]">
                        jeilinks.com/store/{(user as any).storeSlug}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 font-bold italic">Link not setup!</p>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                  <Link 
                    href="/dashboard/store"
                    className="py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-indigo-200"
                  >
                      Settings
                  </Link>
                  {(user as any).storeSlug ? (
                    <Link 
                        href={`/store/${(user as any).storeSlug}`}
                        target="_blank"
                        className="py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-[10px] font-bold hover:bg-indigo-50 active:scale-95 transition-all shadow-sm"
                    >
                        Preview
                    </Link>
                  ) : (
                    <Link 
                        href="/dashboard/store"
                        className="py-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-200"
                    >
                        Setup
                    </Link>
                  )}
              </div>
          </div>
        )}

        {/* Rank / Stats Card */}
        <div className="glass rounded-2xl p-6 shadow-sm border border-border/50 text-center flex flex-col items-center justify-center relative overflow-hidden group">
            {dailyRank > 0 && dailyRank <= 3 && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] font-black px-4 py-1.5 rotate-45 shadow-sm">TOP PERFORMER</div>
            )}
            
            {user.role === 'AGENT' ? (
                <>
                    <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner", dailyRank === 1 ? "bg-yellow-100 text-yellow-600" : rank.color.replace('bg-', 'bg-opacity-20 text-'))}>
                        {dailyRank === 1 ? "🏆" : dailyRank === 2 ? "🥈" : dailyRank === 3 ? "🥉" : rank.icon}
                    </div>
                    <h2 className="font-bold text-lg">
                        {dailyRank > 0 ? `Daily Rank: #${dailyRank}` : `${rank.name} Agent`}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        {todayCompletedCount} Orders Today
                    </p>
                    
                    <div className="mt-2 pt-2 border-t border-border/50 w-full">
                        <div className="flex items-center justify-between text-[9px] uppercase font-black tracking-widest text-muted-foreground">
                            <span>Lifetime Orders</span>
                            <span className="text-slate-900">{completedCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] uppercase font-black tracking-widest text-muted-foreground mt-1">
                            <span>Lifetime Profit</span>
                            <span className="text-green-600">{formatCurrency(totalEarnings.toString())}</span>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="p-3 bg-secondary rounded-full mb-3">
                        <Trophy className={cn("h-6 w-6", dailyRank > 0 ? "text-yellow-500" : "text-muted-foreground")} />
                    </div>
                    <h2 className="font-bold">{dailyRank > 0 ? `Position: #${dailyRank}` : `${user.orders.length} Orders`}</h2>
                    <p className="text-sm text-muted-foreground">
                        {dailyRank > 0 ? `Out of ${totalPerformers} active users today` : "Total orders placed so far"}
                    </p>
                </>
            )}
        </div>
      </div>

      {/* Orders History */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-outfit">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-primary font-medium hover:underline">View All</Link>
        </div>

        <div className="glass rounded-2xl overflow-hidden border border-border/50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">Network</th>
                  <th className="px-6 py-4 font-semibold">Size</th>
                  <th className="px-6 py-4 font-semibold">Phone</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {user.orders.map((order) => {
                  const StatusIcon = statusIcons[order.status]?.icon || Clock;
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium uppercase">{order.bundle.network}</td>
                      <td className="px-6 py-4">{order.bundle.size}</td>
                      <td className="px-6 py-4 font-mono">{order.phone}</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(order.amount.toString())}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold",
                          statusIcons[order.status]?.color || "bg-gray-100 text-gray-500"
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{order.status}</span>
                        </span>
                        {order.supplierStatus && order.supplierStatus !== order.status && (
                          <p className="text-[9px] text-muted-foreground mt-0.5 font-medium italic">
                            Supplier: {order.supplierStatus}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(order.status === "PROCESSING" || order.status === "PENDING") && (
                          <RefreshOrderButton orderId={order.id} />
                        )}
                      </td>
                    </tr>
                  )
                })}
                {user.orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                      No orders found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section>
          <SecuritySettings />
      </section>
    </div>
  );
}

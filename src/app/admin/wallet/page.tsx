import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getActiveSupplier } from "@/lib/suppliers";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Zap, Users, Search, DollarSign } from "lucide-react";
import WalletManagementClient from "./WalletManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminWalletPage() {
  const session = await getServerSession(authOptions);
  const supplier = await getActiveSupplier();
  
  const [supplierBalance, adminUser, totalUserBalance, users] = await Promise.all([
    supplier.fetchBalance().catch(() => 0),
    prisma.user.findUnique({ where: { id: (session?.user as any)?.id } }),
    prisma.user.aggregate({ _sum: { balance: true } }),
    prisma.user.findMany({
      orderBy: { balance: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        role: true,
        image: true
      }
    })
  ]);

  const stats = [
    { 
      name: "Supplier Wallet", 
      value: formatCurrency(supplierBalance.toString()), 
      icon: Zap, 
      color: "text-purple-500 bg-purple-100",
      description: "Balance available for automated orders"
    },
    { 
      name: "Admin Wallet", 
      value: formatCurrency((adminUser?.balance || 0).toString()), 
      icon: DollarSign, 
      color: "text-emerald-500 bg-emerald-100",
      description: "Your current personal balance"
    },
    { 
      name: "Total Users Wallet", 
      value: formatCurrency((totalUserBalance._sum.balance || 0).toString()), 
      icon: Users, 
      color: "text-blue-500 bg-blue-100",
      description: "Sum of all user balances combined"
    }
  ];

  return (
    <div className="space-y-8 animate-in pb-20">
      <div>
        <h1 className="text-3xl font-bold font-outfit">Wallet Management</h1>
        <p className="text-muted-foreground">Monitor platform liquidity and manage user balances</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="glass rounded-2xl p-6 border border-border/50 shadow-sm">
            <div className={`p-2 w-fit rounded-lg ${stat.color} mb-4`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
            <h3 className="text-2xl font-black font-outfit mt-1">{stat.value}</h3>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-2 font-bold">{stat.description}</p>
          </div>
        ))}
      </div>

      <WalletManagementClient initialUsers={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}

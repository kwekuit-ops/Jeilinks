import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, LayoutDashboard, DollarSign, Settings, ShoppingBag, TrendingUp, Wallet } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  const sidebarItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Sales & Profits", href: "/admin/sales", icon: TrendingUp },
    { name: "Payouts", href: "/admin/withdrawals", icon: Wallet },
    { name: "Pricing", href: "/admin/pricing", icon: DollarSign },


    { name: "API Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r hidden md:block">
        <div className="p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Admin Panel</h2>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-foreground/70 hover:bg-secondary hover:text-primary transition-all"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {/* Mobile Admin Nav */}
        <div className="md:hidden flex space-x-2 overflow-x-auto no-scrollbar pb-4 mb-4 border-b">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-2 px-4 py-2 bg-card border rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap active:scale-95 transition-all shadow-sm"
            >
              <item.icon className="h-3 w-3" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

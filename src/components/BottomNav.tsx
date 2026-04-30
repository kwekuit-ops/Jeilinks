"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, ShoppingBag, ClipboardList, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Buy Data",
      href: "/#bundles",
      icon: ShoppingBag,
    },
    {
      name: "Orders",
      href: session ? "/dashboard/orders" : "/track",
      icon: ClipboardList,
    },
    {
      name: "Wallet",
      href: "/dashboard",
      icon: Wallet,
      auth: true,
    },
    {
      name: isAdmin ? "Admin" : "Profile",
      href: isAdmin ? "/admin/settings" : "/dashboard",
      icon: Settings,
      auth: true,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="mx-auto max-w-lg bg-background/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-primary/20 p-2 flex items-center justify-around pointer-events-auto ring-1 ring-black/5">
        {navItems.map((item) => {
          if (item.auth && !session) return null;
          
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[64px] py-1 rounded-xl transition-all duration-300 gap-1",
                isActive 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive ? "bg-primary/10" : "bg-transparent"
              )}>
                <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tight",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

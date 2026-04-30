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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="w-full bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 pt-2 pb-safe flex items-center justify-around pointer-events-auto">
        {navItems.map((item) => {
          if (item.auth && !session) return null;
          
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 gap-1",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <div className={cn(
                "transition-transform duration-300",
                isActive ? "scale-110" : "scale-100"
              )}>
                <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-tight",
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

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
      name: "Shop",
      href: "/shop",
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
      <div className="w-full bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-2 pt-2 pb-safe flex items-center justify-around pointer-events-auto">
        {navItems.map((item) => {
          if (item.auth && !session) return null;
          
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 relative",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive ? "bg-primary/10 scale-110 shadow-sm" : "bg-transparent scale-100 opacity-80"
              )}>
                <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest mt-1 transition-all duration-300",
                isActive ? "opacity-100 translate-y-0" : "opacity-70 translate-y-0.5"
              )}>
                {item.name}
              </span>
              
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full animate-in fade-in slide-in-from-top-1" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

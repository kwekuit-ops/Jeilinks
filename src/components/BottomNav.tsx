"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { cn } from "@/lib/utils";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";

export function BottomNav() {
  const pathname = usePathname();
  const isKeyboardVisible = useKeyboardVisible();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role: string })?.role === "ADMIN";
  const isAgent = (session?.user as { role: string })?.role === "AGENT";

  if (isKeyboardVisible) return null;

  const navItems = [];
  navItems.push({ name: "Home", href: "/", emoji: "🏠" });

  if (isAdmin) {
    navItems.push({ name: "Shop", href: "/shop", emoji: "🛍️" });
    navItems.push({ name: "Orders", href: "/admin/orders", emoji: "📦" });
    navItems.push({ name: "Pricing", href: "/admin/pricing", emoji: "💰" });
    navItems.push({ name: "Admin", href: "/admin", emoji: "⚙️" });
  } else if (session) {
    navItems.push({ name: "Shop", href: "/shop", emoji: "🛍️" });
    navItems.push({ name: "Orders", href: "/dashboard/orders", emoji: "📦" });
    if (isAgent) {
      navItems.push({ name: "Store", href: "/dashboard/store", emoji: "🏪" });
    }
    navItems.push({ name: "Dashboard", href: "/dashboard", emoji: "👤" });
  } else {
    navItems.push({ name: "Shop", href: "/shop", emoji: "🛍️" });
    navItems.push({ name: "Track", href: "/track", emoji: "📦" });
    navItems.push({ name: "Login", href: "/login", emoji: "🔑" });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] bg-white dark:bg-slate-950 border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="w-full px-2 pt-3 pb-safe flex items-center justify-around overflow-hidden">
        {navItems.map((item) => {
          // Fix: Ensure /dashboard only highlights for the exact path, 
          // while allowing sub-routes for other items like /admin/orders
          const isActive = item.href === "/" || item.href === "/dashboard"
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-3 px-1 rounded-[20px] transition-all duration-300 relative group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              <span className={cn(
                "text-2xl mb-1 transition-all duration-300",
                isActive ? "scale-110 drop-shadow-md" : "grayscale-[0.3] opacity-70 group-hover:scale-110 group-hover:grayscale-0"
              )}>
                {item.emoji}
              </span>
              <span className={cn(
                "text-xs font-bold font-outfit transition-all duration-300",
                isActive ? "opacity-100" : "opacity-60"
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

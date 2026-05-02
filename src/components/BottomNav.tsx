"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, ShoppingBag, ClipboardList, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";

export function BottomNav() {
  const pathname = usePathname();
  const isKeyboardVisible = useKeyboardVisible();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  if (isKeyboardVisible) return null;

  const navItems = [
    {
      name: "Home",
      href: "/",
      emoji: "🏠",
    },
    {
      name: "Shop",
      href: "/shop",
      emoji: "🛍️",
    },
    {
      name: "Orders",
      href: session ? "/dashboard/orders" : "/track",
      emoji: "📦",
    },
    {
      name: "Wallet",
      href: "/dashboard",
      emoji: "💳",
      auth: true,
    },
    {
      name: isAdmin ? "Admin" : "Profile",
      href: isAdmin ? "/admin" : "/dashboard",
      emoji: "⚙️",
      auth: true,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] bg-white dark:bg-slate-950 border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="w-full px-2 pt-3 pb-safe flex items-center justify-around overflow-hidden">
        {navItems.map((item) => {
          if (item.auth && !session) return null;

          const isActive = item.href === "/"
            ? pathname === "/"
            : item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

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
                "text-[10px] font-bold font-outfit transition-all duration-300",
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

"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.OneSignal = window.OneSignal || [];
      
      const checkSubscription = async () => {
        const state = await window.OneSignal.getNotificationPermission();
        setIsSubscribed(state === "granted");
        setIsSupported(window.OneSignal.isPushNotificationsSupported());
      };

      window.OneSignal.push(() => {
        checkSubscription();
        window.OneSignal.on('notificationPermissionChange', (permissionChange: any) => {
          setIsSubscribed(permissionChange.to === "granted");
        });
      });
    }
  }, []);

  const handleToggle = () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported on this browser.");
      return;
    }

    if (isSubscribed) {
      toast.success("You are already subscribed to notifications!");
    } else {
      window.OneSignal.push(() => {
        window.OneSignal.showNativePrompt();
      });
    }
  };

  // Always render the bell for a 'fixed' look, but handle unsupported state
  const isAvailable = isSupported && typeof window !== "undefined" && window.OneSignal;

  return (
    <button
      onClick={handleToggle}
      disabled={!isAvailable}
      className={cn(
        "relative p-2 rounded-full transition-all active:scale-95",
        !isAvailable ? "opacity-40 grayscale cursor-not-allowed" : "hover:scale-110",
        isAvailable && isSubscribed 
          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
          : isAvailable ? "bg-primary/10 text-primary animate-pulse" : "bg-muted text-muted-foreground"
      )}
      title={!isAvailable ? "Notifications not supported" : isSubscribed ? "Notifications Active" : "Enable Notifications"}
    >
      {isSubscribed && isAvailable ? (
        <Bell className="h-5 w-5" />
      ) : (
        <BellOff className="h-5 w-5" />
      )}
      {isAvailable && !isSubscribed && (
        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
      )}
    </button>
  );
}

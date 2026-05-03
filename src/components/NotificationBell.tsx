"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import toast from "react-hot-toast";

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

  if (!isSupported) return null;

  return (
    <button
      onClick={handleToggle}
      className={`relative p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${
        isSubscribed 
          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
          : "bg-primary/10 text-primary animate-pulse"
      }`}
      title={isSubscribed ? "Notifications Active" : "Enable Notifications"}
    >
      {isSubscribed ? (
        <Bell className="h-5 w-5" />
      ) : (
        <BellOff className="h-5 w-5" />
      )}
      {!isSubscribed && (
        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
      )}
    </button>
  );
}

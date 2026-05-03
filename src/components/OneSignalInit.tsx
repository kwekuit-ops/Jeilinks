"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function OneSignalInit({ appId }: { appId: string }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== "undefined" && appId) {
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(function() {
        window.OneSignal.init({
          appId: appId,
          safari_web_id: undefined, // Optional: only if you have Safari Web ID
          notifyButton: {
            enable: true,
          },
          allowLocalhostAsSecureOrigin: true,
        });

        // Set external ID if user is logged in
        if (session?.user?.id) {
          window.OneSignal.setExternalUserId(session.user.id);
          
          // Get player ID and register it
          window.OneSignal.getUserId().then((playerId: string) => {
            if (playerId) {
              fetch("/api/notifications/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerId }),
              });
            }
          });
        }
      });

      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
      script.async = true;
      document.head.appendChild(script);

      return () => {
        // Optional: cleanup if needed
      };
    }
  }, [appId, session]);

  return null;
}

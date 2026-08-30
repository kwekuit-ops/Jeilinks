"use client";

import { useSyncExternalStore } from "react";
import { AlertTriangle, X } from "lucide-react";

interface AnnouncementPopupProps {
  enabled: string;
  title: string;
  message: string;
}

const emptySubscribe = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

export function AnnouncementPopup({ enabled, title, message }: AnnouncementPopupProps) {
  const isVisible = useSyncExternalStore(
    emptySubscribe,
    () => enabled === "true" && !sessionStorage.getItem("announcement_dismissed"),
    () => false
  );

  const handleDismiss = () => {
    sessionStorage.setItem("announcement_dismissed", "true");
    window.dispatchEvent(new Event("storage"));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-amber-100 text-amber-600 rounded-full">
            <AlertTriangle className="h-8 w-8" />
          </div>
          
          <h2 className="text-xl font-bold font-outfit text-slate-900">{title || "Important Announcement"}</h2>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
          
          <button 
            onClick={handleDismiss}
            className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

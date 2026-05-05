"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

export default function PWAInit() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('SW Registered', reg);
      });
    }

    // 2. Handle the Before Install Prompt
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-28 left-4 right-4 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Add JEILINKS to Home Screen</h3>
            <p className="text-[10px] text-slate-400 font-medium">Enjoy a faster experience and instant access!</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={handleInstall}
                className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center space-x-2"
            >
                <Download className="h-3 w-3" />
                <span>Install</span>
            </button>
            <button 
                onClick={() => setShowBanner(false)}
                className="p-2 text-slate-400 hover:text-white"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
      </div>
    </div>
  );
}

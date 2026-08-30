"use client";

import { useEffect, useState, startTransition } from "react";
import { X, Download, Smartphone, Share, PlusSquare } from "lucide-react";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";

export default function PWAInit() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
  });
  const [isIOS] = useState(() => {
    if (typeof window === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  });
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    const standalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios && !standalone) {
      return !localStorage.getItem('pwa-banner-dismissed');
    }
    return false;
  });
  const isKeyboardVisible = useKeyboardVisible();

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('SW Registered', reg);
      });
    }

    // 2. Handle the Before Install Prompt (Android/Chrome)
    const handler = (e: any) => {
      e.preventDefault();
      startTransition(() => {
        setDeferredPrompt(e);
        if (!isStandalone) {
          setShowBanner(true);
        }
      });
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, we just show instructions (the banner itself changes state or we can use an alert)
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const dismissBanner = () => {
    setShowBanner(false);
    if (isIOS) {
      localStorage.setItem('pwa-banner-dismissed', 'true');
    }
  };

  if (!showBanner || isStandalone || isKeyboardVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className="relative overflow-hidden bg-slate-900/90 text-white p-5 rounded-[2rem] shadow-2xl border border-white/20 backdrop-blur-2xl">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-primary to-blue-600 p-3 rounded-2xl shadow-lg shadow-primary/20">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-tight">Install JEILINKS App</h3>
                <p className="text-xs text-slate-400 font-medium">Fast access & better experience</p>
              </div>
            </div>
            <button 
              onClick={dismissBanner}
              className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isIOS ? (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
              <p className="text-[11px] text-slate-300 leading-relaxed">
                To install, tap the <span className="inline-flex items-center px-1.5 py-0.5 bg-white/10 rounded-md mx-0.5"><Share className="h-3 w-3 inline" /></span> icon in Safari and select <span className="font-bold text-white uppercase tracking-wider mx-1 text-[10px]">&quot;Add to Home Screen&quot;</span>
              </p>
              <div className="flex justify-center pt-1">
                <div className="animate-bounce">
                    <PlusSquare className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end pt-1">
              <button 
                onClick={handleInstall}
                className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-2xl text-sm font-black transition-all active:scale-[0.98] shadow-xl shadow-primary/30 flex items-center justify-center space-x-2 group"
              >
                <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                <span>INSTALL NOW</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


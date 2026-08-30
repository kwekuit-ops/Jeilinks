"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";

export function FloatingWhatsApp({ number, channelUrl: _channelUrl }: { number: string; channelUrl?: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isKeyboardVisible = useKeyboardVisible();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const message = "Hi Jeilinks, I need help with my data bundle.";
  let cleanNumber = number.replace(/\D/g, ''); // Remove any non-digits
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '233' + cleanNumber.substring(1);
  }

  const finalUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
  const label = "Chat Support";

  if (isKeyboardVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 flex items-center justify-center">
      {/* Tooltip Nudge */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
          <div className="bg-white text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center space-x-3 whitespace-nowrap relative">
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-tight">Online Support</span>
                <span className="text-sm font-bold">How can we help you?</span>
            </div>
            <button 
                onClick={() => setShowTooltip(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <X className="h-3 w-3 text-slate-400" />
            </button>
            {/* Arrow */}
            <div className="absolute top-full right-6 w-3 h-3 bg-white border-r border-b border-slate-100 rotate-45 -translate-y-1.5" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-whatsapp rounded-full animate-ping opacity-20 scale-125" />
      <a
        href={finalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center h-14 w-14 bg-whatsapp text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all shadow-whatsapp/50 group"
        title={label}
      >
        <svg 
            viewBox="0 0 24 24" 
            className="h-8 w-8 fill-current" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}

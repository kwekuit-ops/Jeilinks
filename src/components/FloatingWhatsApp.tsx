"use client";

import { MessageCircle } from "lucide-react";

export function FloatingWhatsApp({ number }: { number: string }) {
  const message = "Hi Jeilinks, I need help with my data bundle.";
  const cleanNumber = number.replace(/\D/g, ''); // Remove any non-digits
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 flex items-center justify-center h-14 w-14 bg-whatsapp text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all shadow-whatsapp/30 group"
      title="Chat with Support"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute right-full mr-4 bg-black/80 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-widest pointer-events-none">
        Chat Support
      </span>
    </a>
  );
}

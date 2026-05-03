"use client";

import { Construction, Hammer, Wrench, Clock, MessageCircle } from "lucide-react";
import Link from "next/link";

export function Maintenance({ supportNumber }: { supportNumber?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative bg-background border border-border/50 p-8 rounded-full shadow-2xl">
          <Construction className="h-16 w-16 text-primary animate-pulse" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-black font-outfit mb-4 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
        Under Maintenance
      </h1>
      
      <p className="text-muted-foreground max-w-md mb-8 text-lg leading-relaxed">
        We're currently performing some scheduled maintenance to improve our services. 
        We'll be back online shortly. Thank you for your patience!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-12">
        <div className="glass p-6 rounded-2xl border border-border/50 flex flex-col items-center space-y-3">
          <Hammer className="h-6 w-6 text-primary" />
          <h3 className="font-bold">Upgrading</h3>
          <p className="text-xs text-muted-foreground text-center">Adding new features and improving performance.</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-border/50 flex flex-col items-center space-y-3">
          <Wrench className="h-6 w-6 text-primary" />
          <h3 className="font-bold">Fixing</h3>
          <p className="text-xs text-muted-foreground text-center">Squashing bugs and optimizing the experience.</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-border/50 flex flex-col items-center space-y-3">
          <Clock className="h-6 w-6 text-primary" />
          <h3 className="font-bold">Estimated Time</h3>
          <p className="text-xs text-muted-foreground text-center">Back in a few minutes.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
        {supportNumber && (
          <a 
            href={`https://wa.me/${supportNumber}`}
            className="flex items-center space-x-2 bg-whatsapp text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-whatsapp/20"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Contact Support</span>
          </a>
        )}
        <Link 
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Admin Login
        </Link>
      </div>

      <p className="mt-12 text-xs text-muted-foreground font-medium uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Jeilinks. All rights reserved.
      </p>
    </div>
  );
}

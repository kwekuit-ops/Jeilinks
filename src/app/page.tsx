import prisma from "@/lib/prisma";
import type { Bundle } from "@prisma/client";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { Zap, ShieldCheck, Clock } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "JEILINKS - Ghana's Fastest Data Top-up Platform",
  description: "Buy MTN, Telecel, and AirtelTigo data bundles instantly at wholesale prices. Become an agent and start earning today.",
};

export default async function Home() {
  let bundles: Bundle[] = [];
  try {
    bundles = await prisma.bundle.findMany({
      where: { isActive: true },
      orderBy: [
        { network: 'asc' },
        { userPrice: 'asc' }
      ]
    });
  } catch (error) {
    console.error("Home page bundle fetch error:", error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-mtn/10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <Zap className="h-4 w-4" />
              <span>Reliable delivery in 1 to 30 minutes</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black font-outfit tracking-tight leading-tight">
            The Smartest Way to <br />
            <span className="text-primary italic">Buy Data in Ghana.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Save up to 30% on MTN, Telecel, and AirtelTigo bundles. 
              Delivered within 1 to 30 minutes, guaranteed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="#bundles" className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  Buy Data Now
              </a>
              <Link href="/become-agent" className="bg-secondary text-foreground px-10 py-4 rounded-2xl font-bold text-lg hover:bg-secondary/80 transition-all border border-border">
                  Earn as an Agent
              </Link>
          </div>

          <div className="pt-16 space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Trusted for networks across Ghana</p>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  <div className="flex flex-col items-center">
                      <div className="h-10 w-10 bg-mtn rounded-full flex items-center justify-center font-black text-xs">MTN</div>
                      <span className="text-[10px] mt-2 font-bold">MTN Ghana</span>
                  </div>
                  <div className="flex flex-col items-center">
                      <div className="h-10 w-10 bg-telecel rounded-full flex items-center justify-center font-black text-xs text-white">T</div>
                      <span className="text-[10px] mt-2 font-bold">Telecel</span>
                  </div>
                  <div className="flex flex-col items-center">
                      <div className="h-10 w-10 bg-airteltigo rounded-full flex items-center justify-center font-black text-xs text-white">AT</div>
                      <span className="text-[10px] mt-2 font-bold">AirtelTigo</span>
                  </div>
              </div>
          </div>
        </div>
      </section>

      {/* Trust & Features Section */}
      <section className="py-20 border-y bg-background overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Zap className="h-6 w-6" />
                  </div>
                  <div>
                      <h4 className="font-bold text-lg mb-2 font-outfit">Fast Delivery</h4>
                      <p className="text-sm text-muted-foreground">Most orders are processed within 1 to 30 minutes of payment.</p>
                  </div>
              </div>
              <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                      <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                      <h4 className="font-bold text-lg mb-2 font-outfit">Secure Payment</h4>
                      <p className="text-sm text-muted-foreground">Encrypted transactions powered by Paystack. Your data is always safe.</p>
                  </div>
              </div>
              <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                      <Clock className="h-6 w-6" />
                  </div>
                  <div>
                      <h4 className="font-bold text-lg mb-2 font-outfit">24/7 Support</h4>
                      <p className="text-sm text-muted-foreground">Our automated tracking and WhatsApp support are always available.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Bundles Section */}
      <section id="bundles" className="py-20 px-4 bg-muted/30 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold font-outfit">Available Bundles</h2>
              <p className="text-muted-foreground">Select a package to get started</p>
            </div>
          </div>

          {bundles.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl">
              <p className="text-lg text-muted-foreground">No bundles available at the moment. Please check back later.</p>
            </div>
          ) : (
            <BundleTabs bundles={JSON.parse(JSON.stringify(bundles))} />
          )}
        </div>
      </section>
      
    </div>
  );
}

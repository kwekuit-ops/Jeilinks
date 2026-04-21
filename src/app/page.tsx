import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { Zap, ShieldCheck, Clock } from "lucide-react";

export default async function Home() {
  let bundles = [];
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
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-mtn/10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black font-outfit tracking-tight mb-6 animate-in">
            Fastest Data Top-up <br />
            <span className="text-primary italic">In Ghana.</span>
          </h1>
        </div>
      </section>

      {/* Bundles Section */}
      <section className="py-20 px-4 bg-muted/30">
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
      
      {/* Footer Branding */}
      <footer className="py-10 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            © 2026 JEILINKS. All rights reserved. Built for Ghana.
          </p>
        </div>
      </footer>
    </div>
  );
}

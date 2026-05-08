import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { Metadata } from "next";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop Data Bundles - JEILINKS",
  description: "Select your preferred data bundle and top up instantly.",
};

export default async function ShopPage() {
  const session = await getServerSession(authOptions);
  
  let bundles: any[] = [];
  try {
    const rawBundles = await prisma.bundle.findMany({
      where: { 
        isActive: true,
        supplierProductId: { not: null }
      },
      orderBy: [
        { network: 'asc' },
      ]
    });

    const [customPrices] = await Promise.all([
      session?.user ? prisma.agentBundlePrice.findMany({
        where: { agentId: (session.user as { id: string }).id }
      }) : Promise.resolve([])
    ]);

    // Helper to sort by data size numerically
    const parseSize = (size: string) => {
      const num = parseFloat(size);
      if (size.toUpperCase().includes("GB")) return num * 1024;
      if (size.toUpperCase().includes("TB")) return num * 1024 * 1024;
      return num;
    };

    bundles = rawBundles.sort((a, b) => {
      if (a.network !== b.network) return 0;
      return parseSize(a.size) - parseSize(b.size);
    }).map(bundle => {
      // Add hidden 0.1 service fee to base prices
      const baseUserPrice = Number(bundle.userPrice) + 0.1;
      const baseAgentPrice = Number(bundle.agentPrice) + 0.1;

      const custom = customPrices.find(cp => cp.bundleId === bundle.id);
      if (custom) {
        return {
          ...bundle,
          userPrice: Number(custom.customPrice) + 0.1,
          agentPrice: baseAgentPrice
        };
      }
      return {
        ...bundle,
        userPrice: baseUserPrice,
        agentPrice: baseAgentPrice
      };
    });

  } catch (error) {
    console.error("Shop page bundle fetch error:", error);
  }

    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Shop Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-36 px-4 overflow-hidden bg-slate-900">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[80%] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center z-10">
          <span className="inline-flex items-center space-x-2 bg-primary/20 text-primary-foreground px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-6 border border-primary/20">
            <Zap className="h-3 w-3" />
            <span>Instant Top-up Service</span>
          </span>
          <h1 className="text-4xl md:text-7xl font-black font-outfit text-white tracking-tight mb-4">
            Get Connected <span className="text-primary">Instantly</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-xl max-w-2xl mx-auto font-medium">
            Select your preferred network and package below to experience the fastest data delivery in Ghana.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-12 md:-mt-20 relative z-20 pb-20 w-full">
        <div className="bg-white/80 backdrop-blur-xl p-4 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white shadow-2xl shadow-slate-200/50">
        {bundles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No bundles available at the moment.</p>
          </div>
        ) : (
          <BundleTabs bundles={JSON.parse(JSON.stringify(bundles))} />
        )}
      </div>

      <div className="mt-16 text-center">
          <p className="text-xs text-slate-400 uppercase font-black tracking-[0.2em]">Fast & Reliable Service</p>
      </div>

      <footer className="py-12 border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">
            Powered by <span className="text-slate-900">JEILINKS Technology</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

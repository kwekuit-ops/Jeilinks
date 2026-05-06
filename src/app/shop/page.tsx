import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { Metadata } from "next";

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
      const custom = customPrices.find(cp => cp.bundleId === bundle.id);
      if (custom) {
        return {
          ...bundle,
          userPrice: custom.customPrice
        };
      }
      return bundle;
    });

  } catch (error) {
    console.error("Shop page bundle fetch error:", error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black font-outfit mb-2">Buy Data Bundles</h1>
        <p className="text-muted-foreground">Choose a network and package to top up instantly.</p>
      </div>

      <div className="bg-muted/30 p-6 md:p-10 rounded-[2.5rem] border border-border/50">
        {bundles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No bundles available at the moment.</p>
          </div>
        ) : (
          <BundleTabs bundles={JSON.parse(JSON.stringify(bundles))} />
        )}
      </div>

      <div className="mt-16 text-center">
          <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.2em]">Fast & Reliable Service</p>
      </div>
    </div>
  );
}

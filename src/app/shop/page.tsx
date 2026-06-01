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
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 w-full pb-28">
        {bundles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No bundles available at the moment.</p>
          </div>
        ) : (
          <BundleTabs bundles={JSON.parse(JSON.stringify(bundles))} />
        )}
      </div>
    </div>
  );
}

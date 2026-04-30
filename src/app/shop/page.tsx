import prisma from "@/lib/prisma";
import type { Bundle } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Data Bundles - JEILINKS",
  description: "Select your preferred data bundle and top up instantly.",
};

export default async function ShopPage() {
  const session = await getServerSession(authOptions);
  
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

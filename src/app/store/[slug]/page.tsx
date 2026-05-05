import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { notFound } from "next/navigation";
import { User, Store, ShieldCheck, MessageCircle } from "lucide-react";

export default async function AgentStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const agent = await prisma.user.findUnique({
    where: { storeSlug: slug },
    include: {
      orders: true // Just to see if they are active etc
    }
  });

  if (!agent || (agent.role !== "AGENT" && agent.role !== "ADMIN")) {
    notFound();
  }

  const [rawBundles, customPrices] = await Promise.all([
    prisma.bundle.findMany({
      where: { 
        isActive: true,
        supplierProductId: { not: null }
      },
      orderBy: [
        { network: 'asc' }
      ]
    }),
    prisma.agentBundlePrice.findMany({
      where: { agentId: agent.id }
    })
  ]);

  const parseSize = (size: string) => {
    const num = parseFloat(size);
    if (size.toUpperCase().includes("GB")) return num * 1024;
    if (size.toUpperCase().includes("TB")) return num * 1024 * 1024;
    return num;
  };

  const bundles = rawBundles.sort((a, b) => {
    if (a.network !== b.network) return 0;
    return parseSize(a.size) - parseSize(b.size);
  });

  // Apply custom prices
  const customizedBundles = bundles.map(bundle => {
      const custom = customPrices.find(cp => cp.bundleId === bundle.id);
      if (custom) {
          return {
              ...bundle,
              userPrice: custom.customPrice
          };
      }
      return bundle;
  });

  return (
    <div className="flex flex-col min-h-screen animate-in">
      {/* Agent Header */}
      <section className="py-8 md:py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex p-3 md:p-4 bg-white/10 rounded-full mb-3 md:mb-6">
                <Store className="h-6 w-6 md:h-10 md:w-10" />
            </div>
          <h1 className="text-2xl md:text-4xl font-black font-outfit tracking-tight mb-2">
            {agent.name || "Agent"}'s Data Store
          </h1>
          <p className="opacity-80 text-sm md:text-lg flex items-center justify-center space-x-2 mb-4 md:mb-6">
            <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
            <span>Verified JEILINKS Partner</span>
          </p>

          {agent.phone && (
            <a
              href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white text-primary px-4 md:px-6 py-2 md:py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all text-xs md:text-base"
            >
              <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
              <span>Contact {(agent.name || "Agent").split(' ')[0]} on WhatsApp</span>
            </a>
          )}
        </div>
      </section>

      {/* Bundles Section */}
      <section className="py-8 md:py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold font-outfit">Available Packages</h2>
            <p className="text-xs md:text-base text-muted-foreground">Select a bundle to purchase directly</p>
          </div>

          {bundles.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl">
              <p className="text-lg text-muted-foreground">No bundles available at the moment.</p>
            </div>
          ) : (
            <BundleTabs bundles={JSON.parse(JSON.stringify(customizedBundles))} agentId={agent.id} />
          )}
        </div>
      </section>
      
      <footer className="py-10 border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Powered by JEILINKS Technology
          </p>
        </div>
      </footer>
    </div>
  );
}

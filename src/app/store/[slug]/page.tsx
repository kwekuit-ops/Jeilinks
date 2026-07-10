import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { notFound } from "next/navigation";
import { ShieldCheck, MessageCircle, Zap, Lock, Headphones } from "lucide-react";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { StoreActions } from "@/components/StoreActions";
import { getNetworkSettings, filterBundlesByNetwork } from "@/lib/networkSettings";

export default async function AgentStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const agent = await prisma.user.findUnique({
    where: { storeSlug: slug },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      storeSlug: true
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
    }),
    getNetworkSettings()
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

  const filteredBundles = filterBundlesByNetwork(bundles, networkSettings);

  // Apply custom prices and hidden fee, and sanitize for client component
  const customizedBundles = filteredBundles.map(bundle => {
      // Add hidden 0.1 service fee to base prices
      const baseUserPrice = Number(bundle.userPrice) + 0.1;
      const baseAgentPrice = Number(bundle.agentPrice) + 0.1;

      const custom = customPrices.find(cp => cp.bundleId === bundle.id);
      
      return {
          id: bundle.id,
          network: bundle.network,
          size: bundle.size,
          isActive: bundle.isActive,
          userPrice: custom ? Number(custom.customPrice) + 0.1 : baseUserPrice,
          agentPrice: baseAgentPrice
      };
  });

  return (
    <div className="flex flex-col min-h-screen animate-in bg-slate-50/50">
      {/* Agent Header - Premium Mesh Gradient */}
      <section className="relative py-16 md:py-32 px-4 overflow-hidden bg-slate-900">
        {/* Animated background elements - Mesh Gradient */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[80%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[80%] bg-indigo-600/20 rounded-full blur-[120px] animation-delay-2000" />
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-blue-400/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center z-10">
            <div className="inline-flex p-2 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] mb-6 md:mb-10 border border-white/10 shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]">
                <div className="bg-white p-3 rounded-[2.2rem] shadow-2xl">
                    <img src="/logo.png" alt="JEILINKS" className="h-16 w-16 md:h-24 md:w-24 object-contain" />
                </div>
            </div>
          
          <h1 className="text-4xl md:text-7xl font-black font-outfit tracking-tight mb-4 text-white">
            {(agent.name || "Agent").split(' ')[0]}<span className="text-primary-foreground/60">&apos;s</span> Store
          </h1>
          
          <div className="flex flex-col items-center space-y-6">
            <div className="flex flex-wrap justify-center gap-3">
                <p className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-white text-xs md:text-sm font-black border border-white/10">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="uppercase tracking-widest">Verified Partner</span>
                </p>
                <div className="inline-flex items-center space-x-2 bg-emerald-500/10 backdrop-blur-md px-5 py-2 rounded-full text-emerald-400 text-xs md:text-sm font-black border border-emerald-500/20">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="uppercase tracking-widest">Active Now</span>
                </div>
            </div>

            <StoreActions storeName={agent.name || "Agent"} storeSlug={slug} />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="relative -mt-8 px-4 z-20">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-2 md:gap-6">
            {[
                { icon: Zap, label: "Instant Delivery", color: "text-amber-500", bg: "bg-amber-50" },
                { icon: Lock, label: "Secure Payment", color: "text-emerald-500", bg: "bg-emerald-50" },
                { icon: Headphones, label: "24/7 Support", color: "text-primary", bg: "bg-blue-50" }
            ].map((item, i) => (
                <div key={i} className="bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center space-y-1 md:space-y-3">
                    <div className={`${item.bg} p-2 md:p-4 rounded-xl md:rounded-2xl`}>
                        <item.icon className={`h-5 w-5 md:h-7 md:w-7 ${item.color}`} />
                    </div>
                    <span className="text-[10px] md:text-sm font-black text-slate-800 uppercase tracking-wider">{item.label}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Bundles Section */}
      <section className="py-12 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10 md:mb-16">
            <span className="text-primary font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-3">Premium Data Packages</span>
            <h2 className="text-2xl md:text-4xl font-black font-outfit text-slate-900">Available Bundles</h2>
            <div className="h-1.5 w-12 bg-primary rounded-full mt-4" />
          </div>

          {bundles.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <p className="text-lg text-slate-400 font-medium">No bundles available at the moment.</p>
            </div>
          ) : (
            <BundleTabs bundles={customizedBundles} agentId={agent.id} />
          )}
        </div>
      </section>
      
      {/* Contact Section */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 text-center md:text-left">
                <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 font-outfit">Need help?</h3>
                    <p className="text-slate-400 text-sm md:text-base">Contact {(agent.name || "Agent").split(' ')[0]} directly on WhatsApp for any assistance.</p>
                </div>
                
                {agent.phone && (
                    <a
                    href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-3 bg-whatsapp text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-whatsapp/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <MessageCircle className="h-6 w-6" />
                        <span>Chat on WhatsApp</span>
                    </a>
                )}
            </div>
        </div>
      </section>

      <footer className="py-12 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">
            Powered by <span className="text-slate-900">JEILINKS Technology</span>
          </p>
        </div>
      </footer>
      <FloatingWhatsApp number={agent.phone || ""} />
    </div>
  );
}


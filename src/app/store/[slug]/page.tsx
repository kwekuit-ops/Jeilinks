import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { BundleTabs } from "@/components/BundleTabs";
import { notFound } from "next/navigation";
import { ShieldCheck, MessageCircle, Zap, Lock, Headphones } from "lucide-react";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { StoreActions } from "@/components/StoreActions";

export default async function AgentStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const agent = await prisma.user.findUnique({
    where: { storeSlug: slug },
    include: {
      orders: true 
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
    <div className="flex flex-col min-h-screen animate-in bg-slate-50/50">
      {/* Agent Header - Premium Mesh Gradient */}
      <section className="relative py-12 md:py-24 px-4 overflow-hidden bg-primary">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-400/30 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center z-10">
            <div className="inline-flex p-1.5 bg-white/10 backdrop-blur-xl rounded-[2rem] mb-4 md:mb-8 border border-white/20 shadow-2xl">
                <div className="bg-white p-2 rounded-[1.8rem]">
                    <img src="/logo.png" alt="JEILINKS" className="h-14 w-14 md:h-20 md:w-20 object-contain" />
                </div>
            </div>
          
          <h1 className="text-3xl md:text-6xl font-black font-outfit tracking-tighter mb-3 text-white">
            {(agent.name || "Agent").split(' ')[0]}&apos;s Store
          </h1>
          
          <div className="flex flex-col items-center space-y-4">
            <p className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs md:text-sm font-bold border border-white/20">
                <ShieldCheck className="h-4 w-4 text-blue-300" />
                <span>Verified JEILINKS Partner</span>
            </p>

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
            <BundleTabs bundles={JSON.parse(JSON.stringify(customizedBundles))} agentId={agent.id} />
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


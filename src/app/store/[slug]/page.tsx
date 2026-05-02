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

  const bundles = await prisma.bundle.findMany({
    where: { isActive: true },
    orderBy: [
      { network: 'asc' },
      { userPrice: 'asc' }
    ]
  });

  return (
    <div className="flex flex-col min-h-screen animate-in">
      {/* Agent Header */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex p-4 bg-white/10 rounded-full mb-6">
                <Store className="h-10 w-10" />
            </div>
          <h1 className="text-4xl font-black font-outfit tracking-tight mb-2">
            {agent.name || "Agent"}'s Data Store
          </h1>
          <p className="opacity-80 text-lg flex items-center justify-center space-x-2 mb-6">
            <ShieldCheck className="h-5 w-5" />
            <span>Verified JEILINKS Partner</span>
          </p>

          {agent.phone && (
            <a
              href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white text-primary px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Contact {(agent.name || "Agent").split(' ')[0]} on WhatsApp</span>
            </a>
          )}
        </div>
      </section>

      {/* Bundles Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold font-outfit">Available Packages</h2>
            <p className="text-muted-foreground">Select a bundle to purchase directly from this agent</p>
          </div>

          {bundles.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl">
              <p className="text-lg text-muted-foreground">No bundles available at the moment.</p>
            </div>
          ) : (
            <BundleTabs bundles={JSON.parse(JSON.stringify(bundles))} agentId={agent.id} />
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

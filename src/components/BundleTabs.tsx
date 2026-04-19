"use client";

import { useState } from "react";
import { BundleCard } from "./BundleCard";
import { cn } from "@/lib/utils";

interface Bundle {
  id: string;
  network: string;
  size: string;
  userPrice: number;
  agentPrice: number;
  isActive: boolean;
}

export function BundleTabs({ bundles, agentId }: { bundles: Bundle[], agentId?: string }) {
  const networks = ["MTN", "AirtelTigo", "Telecel"];
  const [activeTab, setActiveTab] = useState(networks[0]);

  const filteredBundles = bundles.filter((b) => b.network.toLowerCase() === activeTab.toLowerCase());

  return (
    <div>
      <div className="flex justify-center space-x-2 md:space-x-4 overflow-x-auto pb-4 mb-8 scrollbar-hide">
        {networks.map((network) => (
          <button
            key={network}
            onClick={() => setActiveTab(network)}
            className={cn(
              "px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all whitespace-nowrap border",
              activeTab === network
                ? network === "MTN" ? "bg-mtn text-black border-mtn shadow-lg shadow-mtn/30"
                  : network === "AirtelTigo" ? "bg-airteltigo text-white border-airteltigo shadow-lg shadow-airteltigo/30"
                  : "bg-telecel text-white border-telecel shadow-lg shadow-telecel/30"
                : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {network}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {filteredBundles.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} agentId={agentId} />
        ))}
        {filteredBundles.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground glass rounded-3xl border border-dashed">
            <p>No bundles available for {activeTab} at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { BundleListItem } from "./BundleListItem";
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
  const networkOrder = ["MTN", "AirtelTigo", "Telecel", "Glo"];
  const networks = Array.from(new Set(bundles.map(b => b.network)))
    .filter(n => n !== "OTHER" && n !== "Glo")
    .sort((a, b) => {
        const aIdx = networkOrder.indexOf(a) === -1 ? 999 : networkOrder.indexOf(a);
        const bIdx = networkOrder.indexOf(b) === -1 ? 999 : networkOrder.indexOf(b);
        return aIdx - bIdx;
    });
  const defaultTab = networks.includes("MTN") ? "MTN" : networks[0];
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prefillBundleId = params.get("prefillBundleId");
      if (prefillBundleId) {
        const matchingBundle = bundles.find(b => b.id === prefillBundleId);
        if (matchingBundle) {
          const matchingNetwork = networks.find(n => n.toLowerCase() === matchingBundle.network.toLowerCase());
          if (matchingNetwork) {
            setActiveTab(matchingNetwork);
          }
        }
      }
    }
  }, [bundles, networks]);

  const filteredBundles = bundles.filter((b) => b.network.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-center space-x-2 md:space-x-4 overflow-x-auto pb-2 md:pb-4 mb-2 md:mb-8 scrollbar-hide">
        {networks.map((network) => (
          <button
            key={network}
            onClick={() => setActiveTab(network)}
            className={cn(
              "px-3 md:px-6 py-2 md:py-3 rounded-full font-bold text-xs md:text-base transition-all whitespace-nowrap border",
              activeTab === network
                ? network === "MTN" ? "bg-mtn text-black border-mtn shadow-lg shadow-mtn/30"
                : network === "AirtelTigo" ? "bg-airteltigo text-white border-airteltigo shadow-lg shadow-airteltigo/30"
                : network === "Glo" ? "bg-glo text-white border-glo shadow-lg shadow-glo/30"
                : "bg-telecel text-white border-telecel shadow-lg shadow-telecel/30"
              : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {network}
          </button>
        ))}
      </div>

      <div className="flex flex-col space-y-2 md:space-y-3 px-2 md:px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {filteredBundles
          .sort((a, b) => {
            const parse = (s: string) => {
              const num = parseFloat(s);
              if (s.toUpperCase().includes('GB')) return num * 1024;
              if (s.toUpperCase().includes('TB')) return num * 1024 * 1024;
              if (s.toUpperCase().includes('MB')) return num;
              return num;
            };
            return parse(a.size) - parse(b.size);
          })
          .map((bundle) => (
            <BundleListItem key={bundle.id} bundle={bundle} agentId={agentId} />
          ))}
        {filteredBundles.length === 0 && (
          <div className="py-16 text-center text-muted-foreground glass rounded-3xl border border-dashed">
            <p>No bundles available for {activeTab} at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

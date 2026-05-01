"use client";

import { useEffect, useState } from "react";
import { savePricing } from "./actions";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Save, AlertCircle } from "lucide-react";

interface Bundle {
  id?: string;
  network: string;
  size: string;
  userPrice: any;
  agentPrice: any;
  supplierProductId: any;
  supplierPrice: any;
  isActive: boolean;
}

const TEMPLATE_SIZES = ["1GB", "2GB", "5GB", "10GB", "15GB", "20GB", "30GB", "50GB"];
const NETWORKS = ["MTN", "AirtelTigo", "Telecel"];

export function PricingEditor({ initialBundles }: { initialBundles: Bundle[] }) {
  const [activeTab, setActiveTab] = useState(NETWORKS[0]);
  const [isSaving, setIsSaving] = useState(false);

  // Function to prepare data from props dynamically
  const prepareFormData = (bundles: Bundle[]) => {
    const state: Record<string, Record<string, any>> = {};
    
    NETWORKS.forEach(network => {
      state[network] = {};
      
      // Filter bundles for this network
      const networkBundles = bundles.filter(b => b.network.toLowerCase() === network.toLowerCase());
      
      // Map them into our state
      networkBundles.forEach(b => {
        state[network][b.size] = {
          id: b.id || "",
          size: b.size,
          userPrice: b.userPrice?.toString() || "",
          agentPrice: b.agentPrice?.toString() || "",
          supplierProductId: b.supplierProductId?.toString() || "",
          supplierPrice: b.supplierPrice?.toString() || "0",
          isActive: b.isActive
        };
      });
    });
    return state;
  };

  const [formData, setFormData] = useState<Record<string, Record<string, any>>>(() => prepareFormData(initialBundles));

  // Sync internal state if initialBundles changes (e.g. after a sync)
  useEffect(() => {
    setFormData(prepareFormData(initialBundles));
  }, [initialBundles]);

  const handleInputChange = (network: string, size: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [network]: {
        ...prev[network],
        [size]: {
          ...prev[network][size],
          [field]: value
        }
      }
    }));
  };

  const handleSaveNetwork = async () => {
    setIsSaving(true);
    const networkData = formData[activeTab];
    
    // Only save bundles that have prices set
    const bundlesToSave = Object.values(networkData).filter(
      b => b.userPrice !== "" && b.agentPrice !== "" && b.supplierProductId !== ""
    );

    const result = await savePricing(activeTab, bundlesToSave);
    
    if (result.success) {
      toast.success(`${activeTab} pricing updated!`);
    } else {
      toast.error(result.error || "Failed to update pricing");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Network Tabs */}
      <div className="flex space-x-2 border-b overflow-x-auto no-scrollbar scroll-smooth">
        {NETWORKS.map(network => (
          <button
            key={network}
            onClick={() => setActiveTab(network)}
            className={cn(
              "px-6 py-3 font-bold border-b-2 transition-all whitespace-nowrap",
              activeTab === network 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:border-muted-foreground"
            )}
          >
            {network}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold font-outfit">{activeTab} Packages Editor</h2>
          <button 
            onClick={handleSaveNetwork}
            disabled={isSaving}
            className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground px-6 py-3 md:py-2 rounded-xl text-sm font-bold disabled:opacity-50 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : `Save ${activeTab} Changes`}</span>
          </button>
        </div>

        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-6 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-primary/80">You MUST enter the Supplier ID for a package to be saved and active.</p>
        </div>

        <div className="space-y-6 md:space-y-4">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 pb-2 text-[10px] font-black uppercase text-muted-foreground border-b">
            <div className="col-span-2">Bundle & Base Cost</div>
            <div className="col-span-3">Retail (GHS)</div>
            <div className="col-span-3">Agent (GHS)</div>
            <div className="col-span-3">Supplier PID</div>
            <div className="col-span-1 text-center">Active</div>
          </div>

          {Object.keys(formData[activeTab]).length === 0 && (
              <div className="py-12 text-center text-muted-foreground border border-dashed rounded-3xl">
                  <p>No bundles found for {activeTab}. Please click "Sync" below.</p>
              </div>
          )}

          {Object.keys(formData[activeTab])
            .sort((a, b) => {
                const parse = (s: string) => {
                    const num = parseFloat(s);
                    if (s.includes('GB')) return num * 1024;
                    if (s.includes('MB')) return num;
                    return num;
                };
                return parse(a) - parse(b);
            })
            .map((size) => {
             const row = formData[activeTab][size];
             
             return (
              <div key={size} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-3 md:items-center bg-muted/20 md:bg-transparent p-4 md:p-2 rounded-2xl md:rounded-xl border border-border md:border-transparent hover:border-primary/20 transition-all">
                <div className="md:col-span-2 md:px-2 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start border-b md:border-none pb-2 md:pb-0">
                   <div className="font-bold font-outfit text-xl md:text-lg leading-tight">{size}</div>
                   {row.supplierPrice !== "0" && (
                     <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted px-2 py-1 rounded">
                        Cost: {row.supplierPrice}
                     </div>
                   )}
                </div>
                
                <div className="md:col-span-3 space-y-1">
                  <label className="md:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground">Retail Price (GHS)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Retail Price"
                    value={row.userPrice}
                    onChange={(e) => handleInputChange(activeTab, size, 'userPrice', e.target.value)}
                    className="w-full bg-background border rounded-xl px-4 py-3 md:py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                
                <div className="md:col-span-3 space-y-1">
                  <label className="md:hidden text-[9px] font-black uppercase tracking-widest text-green-600">Agent Price (GHS)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Agent Price"
                    value={row.agentPrice}
                    onChange={(e) => handleInputChange(activeTab, size, 'agentPrice', e.target.value)}
                    className="w-full bg-background border border-green-500/30 rounded-xl px-4 py-3 md:py-2 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-green-700 dark:text-green-400 font-bold"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="md:hidden text-[9px] font-black uppercase tracking-widest text-purple-600">Supplier Product ID</label>
                  <input 
                    type="number" 
                    placeholder="Supplier ID"
                    value={row.supplierProductId}
                    onChange={(e) => handleInputChange(activeTab, size, 'supplierProductId', e.target.value)}
                    className="w-full bg-background border border-purple-500/30 rounded-xl px-4 py-3 md:py-2 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-1 flex items-center justify-between md:justify-center p-2 bg-background/50 md:bg-transparent rounded-xl">
                  <label className="md:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground">Active Status</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={row.isActive}
                      onChange={(e) => handleInputChange(activeTab, size, 'isActive', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
             )
          })}
        </div>
      </div>
    </div>
  );
}

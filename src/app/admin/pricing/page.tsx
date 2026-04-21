import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { Globe } from "lucide-react";
import { PricingEditor } from "./PricingEditor";
import { SyncButton } from "./SyncButton";

export default async function AdminPricingPage() {
  const bundles = await prisma.bundle.findMany({
    orderBy: [
      { network: "asc" },
      { userPrice: "asc" }
    ]
  });

  return (
    <div className="space-y-8 animate-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Bundle Pricing</h1>
          <p className="text-muted-foreground">Configure retail and wholesale prices for all networks</p>
        </div>
      </div>

      <PricingEditor initialBundles={JSON.parse(JSON.stringify(bundles))} />
      
      <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 mt-8">
        <div className="flex items-start space-x-4">
            <Globe className="h-6 w-6 text-primary mt-1" />
            <div>
                <h3 className="font-bold">Pro Tip: Sync with Supplier</h3>
                <p className="text-sm text-muted-foreground max-w-xl">Use the "Force Auto-Sync Now" feature to automatically detect packages and update your retail prices based on the supplier's current wholesale rates.</p>
                <SyncButton />
            </div>
        </div>
      </div>
    </div>
  );
}

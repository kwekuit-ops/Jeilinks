import { PrismaClient } from "@prisma/client";
import { getActiveSupplier } from "./src/lib/suppliers";

const prisma = new PrismaClient();

async function syncProducts() {
  try {
    const supplier = await getActiveSupplier();
    console.log(`Syncing products for: ${supplier.name}`);
    
    const supplierProducts = await supplier.fetchProducts();
    console.log(`Found ${supplierProducts.length} supplier products.`);

    const localBundles = await prisma.bundle.findMany();
    console.log(`Found ${localBundles.length} local bundles.`);

    let updatedCount = 0;

    for (const bundle of localBundles) {
      // Find a matching product from the supplier
      // Logic: Match by Network and Size (Case insensitive)
      const match = supplierProducts.find(sp => 
        sp.network.toUpperCase() === bundle.network.toUpperCase() &&
        sp.size.toUpperCase().replace(/\s+/g, '') === bundle.size.toUpperCase().replace(/\s+/g, '')
      );

      if (match) {
        await prisma.bundle.update({
          where: { id: bundle.id },
          data: { 
            supplierProductId: match.id.toString(),
            supplierPrice: match.price
          }
        });
        console.log(`✅ Matched ${bundle.network} ${bundle.size} -> ${match.name} (${match.id})`);
        updatedCount++;
      } else {
        console.log(`❌ No match found for ${bundle.network} ${bundle.size}`);
      }
    }

    console.log(`Finished! Updated ${updatedCount} bundles.`);
  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncProducts();

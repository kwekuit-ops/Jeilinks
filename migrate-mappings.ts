import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting mapping migration...");

  const bundles = await prisma.bundle.findMany();
  
  // Get active supplier from settings
  const settings = await prisma.systemSetting.findMany();
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
  
  const activeSupplier = settingsMap["SUPPLIER_TYPE"] || "FUZESERVE";
  
  console.log(`📡 Active Supplier: ${activeSupplier}`);

  let count = 0;
  for (const bundle of bundles) {
    if (bundle.supplierProductId) {
      await prisma.supplierMapping.upsert({
        where: {
          bundleId_supplierType: {
            bundleId: bundle.id,
            supplierType: activeSupplier
          }
        },
        update: {
          supplierProductId: bundle.supplierProductId,
          supplierPrice: bundle.supplierPrice
        },
        create: {
          bundleId: bundle.id,
          supplierType: activeSupplier,
          supplierProductId: bundle.supplierProductId,
          supplierPrice: bundle.supplierPrice
        }
      });
      count++;
    }
  }

  console.log(`✅ Successfully migrated ${count} bundles to ${activeSupplier} mappings.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

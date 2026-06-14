const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all OTHER bundles
  const otherBundles = await prisma.bundle.findMany({ where: { network: "OTHER" } });
  console.log(`\nFound ${otherBundles.length} "OTHER" bundles to fix.\n`);

  // Get existing AirtelTigo bundles to avoid creating duplicates
  const existingAT = await prisma.bundle.findMany({ where: { network: "AirtelTigo" } });
  const existingSizes = existingAT.map(b => b.size);
  console.log(`Existing AirtelTigo sizes: ${existingSizes.join(', ') || 'none'}\n`);

  let renamed = 0;
  let deactivated = 0;

  for (const bundle of otherBundles) {
    if (existingSizes.includes(bundle.size)) {
      // Duplicate size — deactivate the OTHER one, keep the existing AirtelTigo
      await prisma.bundle.update({
        where: { id: bundle.id },
        data: { isActive: false }
      });
      console.log(`  ⛔ Deactivated  OTHER ${bundle.size} (AirtelTigo ${bundle.size} already exists)`);
      deactivated++;
    } else {
      // No existing AT bundle for this size — rename it
      await prisma.bundle.update({
        where: { id: bundle.id },
        data: { network: "AirtelTigo" }
      });
      console.log(`  ✅ Renamed      OTHER ${bundle.size} → AirtelTigo ${bundle.size}`);
      renamed++;
    }
  }

  console.log(`\n🎉 Done! Renamed: ${renamed} | Deactivated (dupes): ${deactivated}\n`);

  // Final state
  const atBundles = await prisma.bundle.findMany({
    where: { network: "AirtelTigo", isActive: true },
    orderBy: { size: 'asc' }
  });
  console.log(`📡 Active AirtelTigo bundles (${atBundles.length}):`);
  atBundles.forEach(b => console.log(`  ${b.size} | supplierID: ${b.supplierProductId}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });

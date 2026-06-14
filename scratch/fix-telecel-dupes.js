const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Deactivate all "TELECEL" (all-caps) duplicates — keep "Telecel" (proper case)
  // Can't delete because some orders reference these bundle IDs
  const deactivated = await prisma.bundle.updateMany({
    where: { network: "TELECEL" },
    data: { isActive: false }
  });

  console.log(`✅ Deactivated ${deactivated.count} duplicate "TELECEL" bundles (hidden from shop).`);

  // Also clean up any "OTHER" network bundles with no real use
  const others = await prisma.bundle.findMany({ where: { network: "OTHER" } });
  if (others.length > 0) {
    console.log(`\n⚠️  Found ${others.length} "OTHER" network bundles:`);
    others.forEach(b => console.log(`  - ${b.size} | active: ${b.isActive} | supplierID: ${b.supplierProductId}`));
    console.log('\n  (Not deleted — review manually in Admin → Pricing)');
  }

  // Confirm remaining Telecel bundles
  const remaining = await prisma.bundle.findMany({
    where: { network: { contains: 'telecel', mode: 'insensitive' } },
    orderBy: { size: 'asc' }
  });
  console.log(`\n📡 Remaining Telecel bundles (${remaining.length}):`);
  remaining.forEach(b => console.log(`  network: "${b.network}" | size: ${b.size} | active: ${b.isActive}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });

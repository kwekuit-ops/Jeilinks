const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bundles = await prisma.bundle.findMany({
    where: { network: { contains: 'telecel', mode: 'insensitive' } },
    orderBy: { network: 'asc' }
  });

  console.log(`\nFound ${bundles.length} Telecel-related bundles:\n`);
  bundles.forEach(b => {
    console.log(`  network: "${b.network}" | size: ${b.size} | active: ${b.isActive} | supplierID: ${b.supplierProductId}`);
  });

  // Also check for any distinct network names that might be variations
  const all = await prisma.bundle.findMany({ select: { network: true }, distinct: ['network'] });
  console.log('\n📦 All distinct network names in DB:');
  all.forEach(b => console.log(`  "${b.network}"`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });

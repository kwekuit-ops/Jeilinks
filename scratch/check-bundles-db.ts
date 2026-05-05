import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bundles = await prisma.bundle.findMany({
    orderBy: [
      { network: 'asc' },
      { size: 'asc' }
    ]
  });

  console.log(`Total Bundles: ${bundles.length}`);
  bundles.forEach(b => {
    console.log(`${b.id} | ${b.network} | ${b.size} | Agent: ${b.agentPrice} | User: ${b.userPrice} | SupplierID: ${b.supplierProductId} | Active: ${b.isActive}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

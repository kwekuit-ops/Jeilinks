
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const otherBundles = await prisma.bundle.findMany({
    where: { network: 'OTHER' },
    select: { name: true, size: true, supplierProductId: true }
  });
  console.log('OTHER Bundles:', JSON.stringify(otherBundles, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

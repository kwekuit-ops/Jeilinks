
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const networks = await prisma.bundle.findMany({
    select: { network: true },
    distinct: ['network'],
  });
  console.log('Unique Networks:', JSON.stringify(networks, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

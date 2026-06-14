const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const failedTopups = await prisma.failedTopup.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30
  });
  console.log("FAILED TOPUPS:\n", JSON.stringify(failedTopups, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

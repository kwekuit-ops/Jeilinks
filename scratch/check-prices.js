const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bundles = await prisma.bundle.findMany({
    orderBy: [
      { network: 'asc' },
      { userPrice: 'asc' }
    ]
  });
  console.log('--- BUNDLE PRICES ---');
  bundles.forEach(b => {
    console.log(`${b.network} ${b.size}: User Price: ${b.userPrice}, Agent Price: ${b.agentPrice}, Supplier Price: ${b.supplierPrice}`);
  });
  process.exit(0);
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});

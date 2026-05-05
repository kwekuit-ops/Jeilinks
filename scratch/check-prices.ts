import prisma from './src/lib/prisma';
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
}
main();


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: 'CMOYW73C' }, // This might be the short ID, I'll search for it
  });
  
  if (!order) {
    const orders = await prisma.order.findMany({
        where: { id: { contains: 'CMOYW73C' } }
    });
    console.log('Orders found by partial ID:', JSON.stringify(orders, null, 2));
  } else {
    console.log('Order Details:', JSON.stringify(order, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

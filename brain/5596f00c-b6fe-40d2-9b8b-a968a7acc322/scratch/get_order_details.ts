
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: 'cmoyw73cd0005l1049v6hx0xu' },
    include: {
        bundle: true
    }
  });
  console.log('Order Details:', JSON.stringify(order, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

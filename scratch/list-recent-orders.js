const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });
  console.log("RECENT ORDERS:\n", JSON.stringify(orders, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const orders = await prisma.order.findMany({
      take: 1,
      select: { paymentMethod: true }
    });
    console.log('Successfully queried paymentMethod:', orders);
  } catch (e) {
    console.error('Error querying paymentMethod:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

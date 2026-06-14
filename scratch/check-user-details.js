const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 'cmots9te50004i5041kph8k6r' }
  });
  console.log("USER DETAILS:", user);

  const orders = await prisma.order.findMany({
    where: { userId: 'cmots9te50004i5041kph8k6r' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("USER ORDERS COUNT:", orders.length);
  orders.forEach(o => {
    console.log(`ID: ${o.id}, Status: ${o.status}, Phone: ${o.phone}, Amount: ${o.amount}, Method: ${o.paymentMethod}, CreatedAt: ${o.createdAt}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

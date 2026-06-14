const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { paymentMethod: 'PAYSTACK' },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  console.log("PAYSTACK ORDERS:");
  orders.forEach(o => {
    console.log(`ID: ${o.id}, UserID: ${o.userId}, Email: ${o.user?.email || 'N/A'}, Phone: ${o.phone}, Method: ${o.paymentMethod}, Ref: ${o.paystackRef}, CreatedAt: ${o.createdAt}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

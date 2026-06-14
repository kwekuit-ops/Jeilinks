const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { agentId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 15,
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

  console.log("AGENT ORDERS Count:", orders.length);
  orders.forEach(o => {
    console.log(`ID: ${o.id}, UserID: ${o.userId}, AgentID: ${o.agentId}, Phone: ${o.phone}, Method: ${o.paymentMethod}, Ref: ${o.paystackRef}, CreatedAt: ${o.createdAt}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

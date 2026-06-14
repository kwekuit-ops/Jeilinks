const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: "cmqb47q700005i604r955j5pv" },
    include: { bundle: true }
  });
  console.log("ORDER DETAILS:", JSON.stringify(order, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

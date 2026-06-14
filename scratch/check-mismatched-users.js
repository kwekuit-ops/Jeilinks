const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find all orders where userId is null
  const nullUserOrders = await prisma.order.findMany({
    where: { userId: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  console.log(`Analyzing ${nullUserOrders.length} recent orders with null userId...`);
  
  let matchesCount = 0;
  for (const order of nullUserOrders) {
    const phone = order.phone;
    // Search for user whose phone matches
    const matchingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phone },
          { phone: { endsWith: phone.substring(1) } }
        ]
      }
    });

    if (matchingUser) {
      matchesCount++;
      console.log(`MATCH FOUND: Order ID: ${order.id}, Phone: ${phone}, CreatedAt: ${order.createdAt}`);
      console.log(`  Registered User ID: ${matchingUser.id}, Name: ${matchingUser.name}, Email: ${matchingUser.email}, Phone: ${matchingUser.phone}`);
    }
  }
  
  console.log(`Analysis complete. Found ${matchesCount} matches.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

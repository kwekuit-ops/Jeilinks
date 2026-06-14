const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const webhookUpgrades = await prisma.walletTransaction.findMany({
    where: { description: 'Agent Upgrade (Webhook)' },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("WEBHOOK UPGRADES Count:", webhookUpgrades.length);
  webhookUpgrades.forEach(u => {
    console.log(`ID: ${u.id}, UserID: ${u.userId}, Amount: ${u.amount}, Ref: ${u.reference}, CreatedAt: ${u.createdAt}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const topups = await prisma.walletTransaction.findMany({
    where: { type: 'TOPUP' },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          balance: true
        }
      }
    }
  });

  console.log("RECENT TOPUPS:");
  topups.forEach(t => {
    console.log(`ID: ${t.id}, User: ${t.user?.email || 'N/A'}, Balance: ${t.user?.balance}, Amount: ${t.amount}, Ref: ${t.reference}, CreatedAt: ${t.createdAt}, Desc: ${t.description}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

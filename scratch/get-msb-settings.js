const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ['MYSOCIALBOOSTER_API_KEY', 'MYSOCIALBOOSTER_API_BASE', 'SUPPLIER_TYPE'] }
    }
  });
  console.log(JSON.stringify(settings, null, 2));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableMaintenance() {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'MAINTENANCE_MODE' },
      update: { value: 'true' },
      create: { key: 'MAINTENANCE_MODE', value: 'true' }
    });
    console.log('MAINTENANCE_MODE set to true');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

enableMaintenance();

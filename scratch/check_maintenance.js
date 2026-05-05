const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'MAINTENANCE_MODE' }
    });
    console.log('MAINTENANCE_MODE:', setting ? setting.value : 'not set');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

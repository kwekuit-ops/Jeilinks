const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { buildSupplier } = require('../src/lib/supplierBridge');

async function main() {
  const settingsList = await prisma.systemSetting.findMany();
  const settings = {};
  settingsList.forEach(s => settings[s.key] = s.value);

  const supplier = buildSupplier("MYSOCIALBOOSTER", settings);
  const balance = await supplier.fetchBalance();
  console.log("MYSOCIALBOOSTER BALANCE:", balance);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

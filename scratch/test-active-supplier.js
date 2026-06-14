const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getActiveSupplier() {
  const settingsList = await prisma.systemSetting.findMany();
  const settings = {};
  settingsList.forEach(s => settings[s.key] = s.value);

  const type = (settings["SUPPLIER_TYPE"] || "FUZESERVE").toUpperCase();
  const apiKey = settings[`${type}_API_KEY`] || settings["SUPPLIER_API_KEY"];
  const apiBase = settings[`${type}_API_BASE`] || settings["SUPPLIER_API_BASE"];

  return { type, apiKey, apiBase };
}

async function main() {
  const resolved = await getActiveSupplier();
  console.log("RESOLVED SUPPLIER IN DB:", resolved);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

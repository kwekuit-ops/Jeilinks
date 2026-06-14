const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { trackOrderOnSupplier } = require('../src/lib/supplierBridge');

async function main() {
  const orderId = "f19274cb-2e1c-46b4-a582-484364295df4";

  console.log("TRACKING ON FUZESERVE:");
  const resFuze = await trackOrderOnSupplier(orderId, "FUZESERVE");
  console.log("FUZESERVE RESPONSE:", resFuze);

  console.log("\nTRACKING ON MYSOCIALBOOSTER:");
  const resMSB = await trackOrderOnSupplier(orderId, "MYSOCIALBOOSTER");
  console.log("MYSOCIALBOOSTER RESPONSE:", resMSB);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

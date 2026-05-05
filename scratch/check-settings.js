const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSetting.findMany();
  console.log('--- SYSTEM SETTINGS ---');
  settings.forEach(s => console.log(`${s.key}: ${s.value}`));
  process.exit(0);
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const orders = await prisma.order.findMany({where: {phone: "0244711645"}});
    console.log(JSON.stringify(orders, null, 2));
}
main().finally(() => prisma.$disconnect());

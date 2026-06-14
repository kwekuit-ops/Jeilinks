const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phones = ["0550890618", "0542140759", "0549937989", "0596723978", "0538247395", "0556452636"];
  
  console.log("Searching for users...");
  for (const phone of phones) {
    const userByPhone = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phone },
          { phone: { endsWith: phone.substring(1) } },
          { email: { startsWith: phone } }
        ]
      }
    });
    console.log(`Phone: ${phone} => User found:`, userByPhone ? { id: userByPhone.id, name: userByPhone.name, email: userByPhone.email, phone: userByPhone.phone } : "None");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

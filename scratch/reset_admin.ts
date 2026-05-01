
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'kwekuit@gmail.com';
  const password = 'Hazard442..1234';
  const hashed = await bcrypt.hash(password, 10);
  
  await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      role: 'ADMIN'
    }
  });
  
  console.log(`✅ Success! Account ${email} is now an ADMIN with the correct password.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

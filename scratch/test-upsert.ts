
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testUpsert() {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'AGENT' } });
    const bundle = await prisma.bundle.findFirst();
    
    if (!user || !bundle) {
      console.log("No user or bundle found to test");
      return;
    }

    console.log(`Testing upsert for user ${user.id} and bundle ${bundle.id}`);
    
    const result = await prisma.agentBundlePrice.upsert({
      where: {
        agentId_bundleId: {
          agentId: user.id,
          bundleId: bundle.id
        }
      },
      update: { customPrice: 15.5 },
      create: {
        agentId: user.id,
        bundleId: bundle.id,
        customPrice: 15.5
      }
    });
    
    console.log("Upsert result:", result);
  } catch (error) {
    console.error("Upsert failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpsert();

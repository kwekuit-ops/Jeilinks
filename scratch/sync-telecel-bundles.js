const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Live Telecel packages from MySocialBooster
const TELECEL_PACKAGES = [
  { size: "5GB",  supplierProductId: "ae804a5f-4eec-42dc-b5b5-44b71ba69ddf", supplierPrice: 20.30  },
  { size: "10GB", supplierProductId: "e265f571-fe5b-46c2-a95c-93aa54f0b659", supplierPrice: 37.50  },
  { size: "15GB", supplierProductId: "f3f525ca-bd46-4621-a5d2-4853c4881ac5", supplierPrice: 63.94  },
  { size: "20GB", supplierProductId: "68954118-387c-401a-b3f0-07cac3c3a1cf", supplierPrice: 74.87  },
  { size: "25GB", supplierProductId: "78d6f6d7-e71a-4f92-9072-0f1182590115", supplierPrice: 91.89  },
  { size: "30GB", supplierProductId: "7c325664-3556-47a2-8ffe-d77fcb04d580", supplierPrice: 111.86 },
  { size: "40GB", supplierProductId: "8b045e58-0d30-407f-961b-e60d8619c2b6", supplierPrice: 147.00 },
  { size: "50GB", supplierProductId: "96390a25-9aaa-4229-98b4-0b0dea06334f", supplierPrice: 178.93 },
];

// Valid sizes from supplier
const VALID_SIZES = TELECEL_PACKAGES.map(p => p.size);

async function main() {
  console.log("🔍 Fetching current Telecel bundles from DB...");
  const existing = await prisma.bundle.findMany({
    where: { network: "Telecel" }
  });

  console.log(`Found ${existing.length} existing Telecel bundles:`);
  existing.forEach(b => console.log(`  - ${b.size} | Active: ${b.isActive} | SupplierID: ${b.supplierProductId}`));

  // Build a map of existing bundles by size for price preservation
  const existingMap = {};
  existing.forEach(b => existingMap[b.size] = b);

  // 1. Deactivate bundles that don't exist on supplier (e.g. 1GB, 2GB)
  const toDeactivate = existing.filter(b => !VALID_SIZES.includes(b.size));
  if (toDeactivate.length > 0) {
    console.log(`\n⛔ Deactivating ${toDeactivate.length} bundles not on supplier: ${toDeactivate.map(b => b.size).join(', ')}`);
    for (const b of toDeactivate) {
      await prisma.bundle.update({
        where: { id: b.id },
        data: { isActive: false }
      });
    }
  }

  // 2. Upsert correct packages
  console.log("\n✅ Upserting correct Telecel packages...\n");
  for (const pkg of TELECEL_PACKAGES) {
    const ex = existingMap[pkg.size];

    if (ex) {
      // Update supplier ID and price, preserve existing retail/agent prices
      await prisma.bundle.update({
        where: { id: ex.id },
        data: {
          supplierProductId: pkg.supplierProductId,
          supplierPrice: pkg.supplierPrice,
          isActive: true,
        }
      });
      console.log(`  ✏️  Updated ${pkg.size} → Supplier ID: ${pkg.supplierProductId} (prices preserved: retail=${ex.userPrice}, agent=${ex.agentPrice})`);
    } else {
      // Create new bundle with a sensible ~25% markup as default
      const userPrice  = Math.ceil(pkg.supplierPrice * 1.25);
      const agentPrice = Math.ceil(pkg.supplierPrice * 1.10);
      await prisma.bundle.create({
        data: {
          network: "Telecel",
          size: pkg.size,
          supplierProductId: pkg.supplierProductId,
          supplierPrice: pkg.supplierPrice,
          userPrice,
          agentPrice,
          isActive: true,
        }
      });
      console.log(`  ➕ Created  ${pkg.size} → Supplier ID: ${pkg.supplierProductId} | Retail: GHS ${userPrice} | Agent: GHS ${agentPrice}`);
    }
  }

  console.log("\n🎉 Done! Telecel bundles are now in sync with MySocialBooster.\n");
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });

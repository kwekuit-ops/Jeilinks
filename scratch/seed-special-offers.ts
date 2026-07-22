import { PrismaClient } from "@prisma/client";
import { getActiveSupplier } from "../src/lib/suppliers";

const prisma = new PrismaClient();

async function main() {
  const supplier = await getActiveSupplier();
  const products = await supplier.fetchProducts();
  
  const specialOffers = products.filter(p => p.network === "Special Offers");
  
  if (specialOffers.length === 0) {
    console.log("No Special Offers found from supplier.");
    return;
  }

  console.log(`Found ${specialOffers.length} special offers. Seeding into DB...`);
  
  for (const offer of specialOffers) {
    // Check if it already exists
    const existing = await prisma.bundle.findFirst({
      where: {
        network: offer.network,
        size: offer.size
      }
    });

    if (!existing) {
      await prisma.bundle.create({
        data: {
          network: offer.network,
          size: offer.size,
          userPrice: offer.price + 5, // Default +5 GHS markup
          agentPrice: offer.price + 2, // Default +2 GHS markup
          supplierProductId: offer.id.toString(),
          supplierPrice: offer.price,
          isActive: true
        }
      });
      console.log(`Created: ${offer.size} for ${offer.price} GHS`);
    } else {
      console.log(`Already exists: ${offer.size}`);
    }
  }
  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

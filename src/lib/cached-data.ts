import { unstable_cache } from "next/cache";
import prisma from "./prisma";

export const getCachedBundles = unstable_cache(
  async () => {
    console.log("Fetching bundles from DB...");
    return await prisma.bundle.findMany({
      where: { isActive: true },
      orderBy: [{ network: 'asc' }, { userPrice: 'asc' }]
    });
  },
  ["bundles-list"],
  { revalidate: 3600, tags: ["bundles"] } // Cache for 1 hour
);

export const getCachedOrdersCount = unstable_cache(
  async () => {
    console.log("Fetching total orders count from DB...");
    return await prisma.order.count();
  },
  ["total-orders-count"],
  { revalidate: 300, tags: ["orders"] } // Cache for 5 minutes
);

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

export const getDailyAdminStats = unstable_cache(
  async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ordersCount, completedOrders] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.order.findMany({
        where: { 
          createdAt: { gte: today },
          status: "COMPLETED"
        },
        include: { bundle: true }
      })
    ]);

    const dailyProfit = completedOrders.reduce((acc, order) => {
        const amount = Number(order.amount);
        const commission = Number(order.commissionEarned);
        const cost = Number(order.bundle.supplierPrice || 0);
        return acc + (amount - commission - cost);
    }, 0);

    return {
        ordersCount,
        dailyProfit
    };
  },
  ["daily-admin-stats"],
  { revalidate: 60, tags: ["orders"] } // Cache for 1 minute
);

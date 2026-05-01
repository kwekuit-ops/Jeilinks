"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSalesReport(startDate?: Date, endDate?: Date) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const where: any = {
    status: "COMPLETED",
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      // Set to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      bundle: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = orders.reduce(
    (acc, order) => {
      const revenue = Number(order.amount);
      const cost = Number(order.bundle.supplierPrice || 0);
      const profit = revenue - cost;

      return {
        totalRevenue: acc.totalRevenue + revenue,
        totalCost: acc.totalCost + cost,
        totalProfit: acc.totalProfit + profit,
        orderCount: acc.orderCount + 1,
      };
    },
    { totalRevenue: 0, totalCost: 0, totalProfit: 0, orderCount: 0 }
  );

  return { orders, stats };
}

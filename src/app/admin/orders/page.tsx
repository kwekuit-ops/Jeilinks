import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, Search, Filter, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { RefreshOrderButton } from "@/components/RefreshOrderButton";
import { OrdersClient } from "./OrdersClient";
import DateFilter from "../DateFilter";
import { Suspense } from "react";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const filterDate = date || new Date().toISOString().split('T')[0];

  const startDate = new Date(filterDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(filterDate);
  endDate.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    },
    include: {
      user: true,
      bundle: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold font-outfit">Platform Orders</h1>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
                {orders.length} for {filterDate}
            </span>
          </div>
          <p className="text-muted-foreground">Monitor and manage all transactions</p>
        </div>
        <Suspense fallback={<div>Loading calendar...</div>}>
            <DateFilter />
        </Suspense>
      </div>

      <OrdersClient initialOrders={JSON.parse(JSON.stringify(orders))} />
    </div>
  );
}

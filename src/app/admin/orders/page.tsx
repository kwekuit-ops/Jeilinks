import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, Search, Filter, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { RefreshOrderButton } from "@/components/RefreshOrderButton";
import { OrdersClient } from "./OrdersClient";
import DateFilter from "../DateFilter";
import StatusFilter from "./StatusFilter";
import { Suspense } from "react";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ date?: string, endDate?: string, status?: string }> }) {
  const { date: startDateParam, endDate: endDateParam, status } = await searchParams;
  
  const today = new Date().toISOString().split('T')[0];
  const filterDate = startDateParam || today;
  const filterEndDate = endDateParam || filterDate;

  const startDate = new Date(filterDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(filterEndDate);
  endDate.setHours(23, 59, 59, 999);

  const where: any = {
    createdAt: {
        gte: startDate,
        lte: endDate
    }
  };

  if (status && status !== "ALL") {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      status: true,
      phone: true,
      amount: true,
      createdAt: true,
      supplierStatus: true,
      supplierOrderId: true,
      commissionEarned: true,
      user: {
        select: { id: true, name: true, email: true, role: true }
      },
      bundle: {
        select: { network: true, size: true, supplierPrice: true }
      }
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
                {orders.length} {status && status !== "ALL" ? status.toLowerCase() : ""} Orders
            </span>
          </div>
          <p className="text-muted-foreground">
            {filterDate === filterEndDate ? `Tracking for ${filterDate}` : `Range: ${filterDate} to ${filterEndDate}`}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
            <Suspense fallback={<div>Loading filters...</div>}>
                <StatusFilter />
                <DateFilter />
            </Suspense>
        </div>
      </div>

      <OrdersClient initialOrders={JSON.parse(JSON.stringify(orders))} />
    </div>
  );
}

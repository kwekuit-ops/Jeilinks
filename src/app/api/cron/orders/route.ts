import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { trackOrderOnSupplier } from "@/lib/supplierBridge";
import { processOrderRefund } from "@/lib/orderUtils";
import { processOrderCommission } from "@/lib/commissions";

// Triggered by Vercel Cron or any cron service
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "PROCESSING",
        supplierOrderId: { not: null },
      },
      // L3 FIX: Increased from 20 to 50 to prevent backlog at high order volume.
      // FIFO ordering ensures oldest orders are resolved first.
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json({ message: "No pending orders to track." });
    }

    const supplierTypeSetting = await prisma.systemSetting.findUnique({
      where: { key: "SUPPLIER_TYPE" }
    });
    const defaultSupplierType = supplierTypeSetting?.value || process.env.SUPPLIER_TYPE || "FUZESERVE";

    let updatedCount = 0;
    let failedCount = 0;

    for (const order of pendingOrders) {
      const supplierRef = order.supplierOrderId!;
      // Use supplierType stored on the order — routes to the right supplier
      const supplierType = order.supplierType || defaultSupplierType;

      const result = await trackOrderOnSupplier(supplierRef, supplierType);

      if (!result.success) {
        console.error(`Failed to fetch status for ${supplierRef}: ${result.error}`);
        continue;
      }

      const status = result.status?.toLowerCase();

      if (status === "completed") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "COMPLETED" },
        });
        await processOrderCommission(order.id);
        updatedCount++;
      } else if (status === "failed") {
        await processOrderRefund(order.id, result.error || "Supplier failed the order");
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingOrders.length,
      completed: updatedCount,
      failed: failedCount
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

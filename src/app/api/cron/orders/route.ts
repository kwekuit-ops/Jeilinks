import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActiveSupplier } from "@/lib/suppliers";
import { processOrderRefund } from "@/lib/orderUtils";

// This endpoint can be triggered manually, by Vercel Cron, or any other cron service
export async function GET(req: Request) {
  // Optional: Protect this route
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Find all orders that are currently PROCESSING
    // We only process a batch to prevent timeout
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "PROCESSING",
        supplierOrderId: { not: null }, // Must have a FuzeServe reference
      },
      take: 20, 
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json({ message: "No pending orders to track." });
    }

    const supplier = await getActiveSupplier();
    let updatedCount = 0;
    let failedCount = 0;

    // 2. Poll the active supplier for each order's status
    for (const order of pendingOrders) {
      const supplierRef = order.supplierOrderId!;
      
      const result = await supplier.trackOrder(supplierRef);

      if (!result.success) {
        console.error(`Failed to fetch status for ${supplierRef}: ${result.error}`);
        continue;
      }

      const status = result.status?.toLowerCase(); // pending, processing, completed, failed

      if (status === "completed") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "COMPLETED" },
        });
        updatedCount++;
      } else if (status === "failed") {
        await processOrderRefund(order.id, result.error || "Supplier failed the order");
        failedCount++;
      }
      // If it's still 'pending' or 'processing', we do nothing and it gets caught next time.
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

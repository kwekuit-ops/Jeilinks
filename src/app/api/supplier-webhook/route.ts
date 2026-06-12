import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processOrderCommission } from "@/lib/commissions";
import { processOrderRefund } from "@/lib/orderUtils";
import { sendPushNotification } from "@/lib/notifications";


export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  
  if (secret !== process.env.SUPPLIER_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    // body: { reference: string, supplier_order_id: string, status: 'processing' | 'completed' | 'failed' }
    
    const { reference, status, supplier_order_id } = body;

    if (!reference || typeof reference !== "string") {
      return NextResponse.json({ message: "Invalid reference" }, { status: 400 });
    }

    const mappedStatus: any = {
        'processing': 'PROCESSING',
        'completed': 'COMPLETED',
        'failed': 'FAILED'
    };

    const newStatus = mappedStatus[status?.toLowerCase()] || 'PROCESSING';

    // Validate order exists before updating (HIGH-7: prevent blind mutation of arbitrary IDs)
    const existingOrder = await prisma.order.findUnique({ where: { id: reference } });
    if (!existingOrder) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (newStatus === "FAILED") {
      // MED-5: Process refund on failure (was missing)
      await processOrderRefund(reference, "Supplier reported failure via webhook");

      if (existingOrder.userId) {
        await sendPushNotification({
          userId: existingOrder.userId,
          title: "Order Failed ❌",
          message: `Your order for ${existingOrder.phone} could not be delivered. A refund has been processed if applicable.`,
          url: "/dashboard/orders"
        });
      }
    } else {
      const order = await prisma.order.update({
        where: { id: reference },
        data: { 
          status: newStatus,
          supplierOrderId: supplier_order_id
        },
      });

      if (newStatus === "COMPLETED" || newStatus === "PROCESSING") {
          await processOrderCommission(order.id);
      }

      if (order.userId) {
        const bundle = await prisma.bundle.findUnique({ where: { id: order.bundleId } });
        await sendPushNotification({
          userId: order.userId,
          title: newStatus === "COMPLETED" ? "Order Completed! ✅" : "Order Processing ⏳",
          message: newStatus === "COMPLETED"
            ? `Your ${bundle?.size} ${bundle?.network} data to ${order.phone} has been delivered.`
            : `Your order to ${order.phone} is being processed.`,
          url: "/dashboard/orders"
        });
      }
    }

    console.log(`Order ${reference} updated to ${newStatus}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Supplier webhook error:", error);
    return NextResponse.json({ message: "Error processing webhook" }, { status: 500 });
  }
}

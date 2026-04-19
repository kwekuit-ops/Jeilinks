import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  
  if (secret !== process.env.SUPPLIER_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    // body: { reference: string, supplier_order_id: string, status: 'processing' | 'completed' | 'failed' }
    
    const { reference, status, supplier_order_id } = body;

    const mappedStatus: any = {
        'processing': 'PROCESSING',
        'completed': 'COMPLETED',
        'failed': 'FAILED'
    };

    const newStatus = mappedStatus[status.toLowerCase()] || 'PROCESSING';

    // Find order by internal reference (which we passed as 'reference' to supplier)
    const order = await prisma.order.update({
      where: { id: reference },
      data: { 
        status: newStatus,
        supplierOrderId: supplier_order_id // Update supplier ID if it wasn't already set
      },
    });

    console.log(`Order ${reference} updated to ${newStatus}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Supplier webhook error:", error);
    return NextResponse.json({ message: "Error processing webhook" }, { status: 500 });
  }
}

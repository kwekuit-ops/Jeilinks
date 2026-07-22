import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");

  if (!ref) {
    return NextResponse.json({ message: "Reference is required" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { phone: ref },
          { paymentRef: ref },
          { id: ref },
          { supplierOrderId: ref }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        bundle: true
      }
    });


    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.userId !== (session.user as any).id && (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized to track this order" }, { status: 403 });
    }

    // Don't leak internal sensitive user info, just return bundle and status
    return NextResponse.json({
        id: order.id,
        status: order.status,
        phone: order.phone,
        amount: order.amount,
        createdAt: order.createdAt,
        bundle: {
            network: order.bundle.network,
            size: order.bundle.size
        }
    });

  } catch (error) {
    console.error("Tracking API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import prisma from "./prisma";

export async function processOrderRefund(orderId: string, reason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order || order.status === "FAILED") {
    return { success: false, message: "Order not found or already marked as failed" };
  }

  // Update order status first to prevent double refund
  await prisma.order.update({
    where: { id: order.id },
    data: { 
      status: "FAILED",
      failureReason: reason 
    }
  });

  // Only refund if it was paid via WALLET
  if (order.paymentMethod === "WALLET") {
    await prisma.user.update({
      where: { id: order.userId },
      data: { balance: { increment: order.amount } }
    });
    return { success: true, message: "Order failed and wallet refunded" };
  }

  return { success: true, message: "Order marked as failed (Paystack payment requires manual refund)" };
}

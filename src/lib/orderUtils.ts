import prisma from "./prisma";

export async function processOrderRefund(orderId: string, reason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order || order.status === "FAILED") {
    return { success: false, message: "Order not found or already marked as failed" };
  }

  // If a commission was earned on this order, reverse it from the agent's balance
  if (order.agentId && Number(order.commissionEarned) > 0) {
    const commission = Number(order.commissionEarned);
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: order.agentId },
          data: { commissionBalance: { decrement: commission } }
        }),
        prisma.walletTransaction.create({
          data: {
            userId: order.agentId,
            amount: commission,
            type: "DEBIT",
            reference: `COMM-REV-${order.id}`,
            description: `Commission reversal for failed order #${order.id.slice(-6)}`
          }
        })
      ]);
    } catch (revErr) {
      console.error(`Failed to reverse commission for order ${order.id}:`, revErr);
    }
  }

  // Update order status first to prevent double refund
  await prisma.order.update({
    where: { id: order.id },
    data: { 
      status: "FAILED",
      failureReason: reason,
      commissionEarned: 0 // Clear commission earned on the order
    }
  });

  // Automatically credit wallet on failure if the user has an account (is registered),
  // regardless of payment method (WALLET or PAYSTACK). This enables them to self-retry via wallet.
  if (order.userId) {
    const refundRef = `REFUND-${order.id}`;

    // Guard against duplicate wallet refund transactions
    const alreadyRefunded = await prisma.walletTransaction.findFirst({
      where: { reference: refundRef }
    });

    if (!alreadyRefunded) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: order.userId },
          data: { balance: { increment: order.amount } }
        }),
        prisma.walletTransaction.create({
          data: {
            userId: order.userId,
            amount: order.amount,
            type: "CREDIT",
            reference: refundRef,
            description: `Auto-refund for failed order #${order.id.substring(0, 8)} (${order.paymentMethod})`
          }
        })
      ]);
    }
    return { success: true, message: `Order failed. GHS ${Number(order.amount).toFixed(2)} refunded to user wallet.` };
  }

  return { success: true, message: "Order marked as failed (Guest checkout requires admin retry or manual refund)" };
}

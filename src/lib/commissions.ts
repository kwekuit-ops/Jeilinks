import prisma from "./prisma";

export async function processOrderCommission(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { bundle: true },
  });

  const allowedStatuses = ["PROCESSING", "COMPLETED"];
  if (!order || !order.agentId || !allowedStatuses.includes(order.status) || Number(order.commissionEarned) > 0) {
    return;
  }

  // The hidden 0.1 service fee stays with the platform
  const commission = Number(order.amount) - (Number(order.bundle.agentPrice) + 0.1);

  if (commission <= 0) return;

  await prisma.$transaction([
    // Update order with earned commission
    prisma.order.update({
      where: { id: order.id },
      data: { commissionEarned: commission },
    }),
    // Credit agent's commission wallet
    prisma.user.update({
      where: { id: order.agentId },
      data: { commissionBalance: { increment: commission } },
    }),
    // Log transaction
    prisma.walletTransaction.create({
        data: {
            userId: order.agentId,
            amount: commission,
            type: "CREDIT",
            reference: `COMM-${order.id}`,
            description: `Commission from Store Sale - Order #${order.id.slice(-6)}`
        }
    })
  ]);

  console.log(`Commission of GHS ${commission} credited to agent ${order.agentId} for order ${order.id}`);
}

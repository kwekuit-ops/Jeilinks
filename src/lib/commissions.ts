import prisma from "./prisma";

export async function processOrderCommission(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { bundle: true },
  });

  if (!order || !order.agentId || order.status !== "COMPLETED" || Number(order.commissionEarned) > 0) {
    return;
  }

  const commission = Number(order.amount) - Number(order.bundle.agentPrice);

  if (commission <= 0) return;

  await prisma.$transaction([
    // Update order with earned commission
    prisma.order.update({
      where: { id: order.id },
      data: { commissionEarned: commission },
    }),
    // Credit agent's wallet
    prisma.user.update({
      where: { id: order.agentId },
      data: { balance: { increment: commission } },
    }),
  ]);

  console.log(`Commission of GHS ${commission} credited to agent ${order.agentId} for order ${order.id}`);
}

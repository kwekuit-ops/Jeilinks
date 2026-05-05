import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import UserOrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function UserOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { 
      OR: [
        { userId: (session.user as any).id },
        { agentId: (session.user as any).id }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: { bundle: true }
  });

  return <UserOrdersClient 
    initialOrders={JSON.parse(JSON.stringify(orders))} 
    currentUserId={(session.user as any).id}
  />;
}

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserManagementClient from "./UserManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const rawUsers = await prisma.user.findMany({
    include: {
      _count: {
        select: { orders: true }
      },
      orders: {
        where: {
          createdAt: { gte: startOfToday },
          status: "COMPLETED"
        },
        select: { id: true }
      }
    },
    take: 200,
  });

  const users = rawUsers.map(u => ({
    ...u,
    todayOrderCount: u.orders.length
  })).sort((a, b) => b.todayOrderCount - a.todayOrderCount);

  return (
    <div className="space-y-8 animate-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-outfit">User Management</h1>
          <p className="text-muted-foreground">Manage roles, balances and user accounts</p>
        </div>
      </div>

      <UserManagementClient users={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}

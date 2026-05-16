import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { Plus } from "lucide-react";
import UserManagementClient from "./UserManagementClient";

export default async function AdminUsersPage() {
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
    }
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

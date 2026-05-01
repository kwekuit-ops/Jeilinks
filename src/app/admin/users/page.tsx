import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { Plus } from "lucide-react";
import UserManagementClient from "./UserManagementClient";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });

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

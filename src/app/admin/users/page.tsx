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
        <button className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:brightness-110 transition-all">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      <UserManagementClient users={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}

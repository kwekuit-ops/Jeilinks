import prisma from "@/lib/prisma";
import { formatCurrency, cn } from "@/lib/utils";
import { UserCog, Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

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
        <button className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Balance</th>
                <th className="px-6 py-4 font-semibold">Join Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-bold">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                      user.role === "ADMIN" ? "bg-red-100 text-red-600" :
                      user.role === "AGENT" ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold">{formatCurrency(user.balance.toString())}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button title="Modify Balance" className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors">
                        <ArrowUpCircle className="h-4 w-4" />
                    </button>
                    <button title="Change Role" className="p-1.5 hover:bg-primary/5 text-primary rounded-lg transition-colors">
                        <UserCog className="h-4 w-4" />
                    </button>
                    <button title="Delete User" className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

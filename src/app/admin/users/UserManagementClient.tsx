"use client";

import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { UserCog, Trash2, X, Shield, User, Star, Store, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { deleteUser, updateUserRole } from "./actions";
import CreateStoreModal from "./CreateStoreModal";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: any;
  createdAt: any;
  _count: {
    orders: number;
  };
  todayOrderCount: number;
}

export default function UserManagementClient({ users: initialUsers }: { users: UserType[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user ${name}? This action cannot be undone.`)) return;

    setIsProcessing(userId);
    const res = await deleteUser(userId);
    if (res.success) {
      toast.success("User deleted successfully");
      setUsers(users.filter(u => u.id !== userId));
    } else {
      toast.error(res.error || "Failed to delete user");
    }
    setIsProcessing(null);
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const roles = ["USER", "AGENT", "ADMIN"];
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
    
    if (!confirm(`Change role from ${currentRole} to ${nextRole}?`)) return;

    setIsProcessing(userId);
    const res = await updateUserRole(userId, nextRole);
    if (res.success) {
      toast.success(`Role updated to ${nextRole}`);
      setUsers(users.map(u => u.id === userId ? { ...u, role: nextRole } : u));
    } else {
      toast.error(res.error || "Failed to update role");
    }
    setIsProcessing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-bold font-outfit">Platform Users</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Store className="h-4 w-4" />
          <span>Create Store</span>
        </button>
      </div>

      <CreateStoreModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="glass rounded-2xl overflow-hidden border border-border/50 shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">User Details</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">Role</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">Orders</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Balance</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Joined</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user, index) => (
              <tr key={user.id} className={cn("hover:bg-muted/30 transition-colors", isProcessing === user.id && "opacity-50 pointer-events-none")}>
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-base">{user.name || "No Name"}</span>
                        <span className="text-sm text-muted-foreground">{user.email || "No Email"}</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest",
                    user.role === "ADMIN" ? "bg-red-100 text-red-600" :
                    user.role === "AGENT" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                  )}>
                    {user.role === "ADMIN" ? <Shield className="h-3 w-3" /> : 
                     user.role === "AGENT" ? <Star className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    <span>{user.role}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                        "inline-flex items-center justify-center h-8 w-8 rounded-full font-black text-xs transition-all",
                        user.todayOrderCount > 0 ? "bg-green-100 text-green-700 scale-110 shadow-sm" : "bg-muted text-muted-foreground opacity-50"
                    )}>
                      {user.todayOrderCount}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-tighter">
                        {user._count.orders} Total
                    </span>
                    {user.todayOrderCount > 0 && index === 0 && (
                        <span className="text-[8px] bg-yellow-400 text-black px-1 rounded-sm font-black mt-1 animate-pulse">TOP</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-primary">
                    {formatCurrency(user.balance.toString())}
                </td>
                <td className="px-6 py-4 text-muted-foreground text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button 
                    onClick={() => handleRoleChange(user.id, user.role)}
                    title="Cycle Role" 
                    className="p-2 hover:bg-primary/5 text-primary rounded-xl transition-all active:scale-90"
                  >
                      <UserCog className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id, user.name || "User")}
                    title="Delete User" 
                    className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all active:scale-90"
                  >
                      <Trash2 className="h-5 w-5" />
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

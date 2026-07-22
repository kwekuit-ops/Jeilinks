"use client";

import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { UserCog, Trash2, X, Shield, User, Star, Store, Plus, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("most_orders_today");

  const filteredUsers = users
    .filter(u =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "total_orders":
          return b._count.orders - a._count.orders;
        case "balance":
          return Number(b.balance) - Number(a.balance);
        case "most_orders_today":
        default:
          if (b.todayOrderCount !== a.todayOrderCount) {
            return b.todayOrderCount - a.todayOrderCount;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
        <h2 className="text-xl font-bold font-outfit">Platform Users</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-muted-foreground cursor-pointer"
          >
            <option value="most_orders_today">Most Orders Today</option>
            <option value="newest">Newest Joined First</option>
            <option value="oldest">Oldest Joined First</option>
            <option value="total_orders">Highest Total Orders</option>
            <option value="balance">Highest Wallet Balance</option>
          </select>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Store className="h-4 w-4" />
            <span>Create Store</span>
          </button>
        </div>
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
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground text-sm">
                  No users found matching &ldquo;{search}&rdquo;
                </td>
              </tr>
            )}
            {filteredUsers.map((user, index) => (
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
                  {new Date(user.createdAt).toLocaleDateString()} <br />
                  <span className="text-xs opacity-75">{new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

"use client";

import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Search, Plus, Minus, Loader2, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateUserBalance } from "../users/actions";

interface UserType {
  id: string;
  name: string;
  email: string;
  balance: any;
  role: string;
}

export default function WalletManagementClient({ initialUsers }: { initialUsers: UserType[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(search.toLowerCase()) || 
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async (userId: string, type: 'CREDIT' | 'DEBIT') => {
    const amountStr = prompt(`Enter amount to ${type === 'CREDIT' ? 'ADD to' : 'DEDUCT from'} balance:`);
    if (!amountStr) return;
    
    let amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return toast.error("Invalid amount. Please enter a positive number.");

    // If debiting, make amount negative
    if (type === 'DEBIT') {
        amount = -amount;
    }

    setIsProcessing(userId);
    const res = await updateUserBalance(userId, amount);
    
    if (res.success) {
      toast.success(`${type === 'CREDIT' ? 'Credited' : 'Debited'} successfully`);
      setUsers(users.map(u => u.id === userId ? { ...u, balance: (parseFloat(u.balance) + amount).toString() } : u));
    } else {
      toast.error(res.error || "Failed to update balance");
    }
    setIsProcessing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold font-outfit">User Balances</h2>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-border/50 rounded-2xl outline-none focus:border-primary/50 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-5 font-semibold text-[11px] uppercase tracking-wider">User Account</th>
                <th className="px-6 py-5 font-semibold text-[11px] uppercase tracking-wider text-center">Type</th>
                <th className="px-6 py-5 font-semibold text-[11px] uppercase tracking-wider">Current Balance</th>
                <th className="px-6 py-5 font-semibold text-[11px] uppercase tracking-wider text-right">Fund Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className={cn("hover:bg-muted/30 transition-colors", isProcessing === user.id && "opacity-50 pointer-events-none")}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base leading-tight">{user.name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      user.role === "ADMIN" ? "bg-red-50 text-red-600 border-red-100" :
                      user.role === "AGENT" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-600 border-slate-100"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-black text-lg text-primary">
                    {formatCurrency(user.balance.toString())}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                        <button
                            onClick={() => handleAction(user.id, 'CREDIT')}
                            className="flex items-center space-x-1 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-emerald-200"
                        >
                            {isProcessing === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            <span>Credit</span>
                        </button>
                        <button
                            onClick={() => handleAction(user.id, 'DEBIT')}
                            className="flex items-center space-x-1 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-rose-200"
                        >
                            {isProcessing === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                            <span>Debit</span>
                        </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

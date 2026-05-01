"use client";

import { useState, useEffect } from "react";
import { getWithdrawals, updateWithdrawalStatus } from "./actions";
import { formatCurrency, cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Smartphone, User } from "lucide-react";
import { toast } from "react-hot-toast";

export default function WithdrawalsClient() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getWithdrawals();
      setWithdrawals(data);
    } catch (error) {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, status: "COMPLETED" | "REJECTED") => {
    if (!confirm(`Are you sure you want to mark this as ${status.toLowerCase()}?`)) return;
    
    try {
      const res = await updateWithdrawalStatus(id, status);
      if (res.success) {
        toast.success(`Request marked as ${status.toLowerCase()}`);
        loadData();
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-8 animate-in">
      <header>
        <h1 className="text-3xl font-black font-outfit">Payout Requests</h1>
        <p className="text-muted-foreground">Manage agent profit withdrawal requests.</p>
      </header>

      <div className="glass rounded-3xl border border-border/50 overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">MoMo Number</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-muted/10 transition-colors text-sm">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-bold">{w.user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span>{w.phone}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-lg">
                    {formatCurrency(w.amount.toString())}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center w-fit space-x-1",
                      w.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      w.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {w.status === "PENDING" ? <Clock className="h-3 w-3" /> :
                       w.status === "COMPLETED" ? <CheckCircle2 className="h-3 w-3" /> :
                       <XCircle className="h-3 w-3" />}
                      <span>{w.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {w.status === "PENDING" && (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleUpdate(w.id, "REJECTED")}
                          className="p-2 hover:bg-red-100 text-red-500 rounded-xl transition-all"
                          title="Reject & Refund"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleUpdate(w.id, "COMPLETED")}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:brightness-110 transition-all"
                        >
                          Mark Paid
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    No payout requests found.
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

"use client";

import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Minus,
  Loader2,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { updateUserBalance, approveFailedTopup, rejectFailedTopup } from "../users/actions";

interface UserType {
  id: string;
  name: string;
  email: string;
  balance: any;
  role: string;
}

interface FailedTopupType {
  id: string;
  reference: string;
  amount: any;
  email: string;
  userId: string | null;
  reason: string | null;
  createdAt: string;
}

export default function WalletManagementClient({
  initialUsers,
  initialFailedTopups,
}: {
  initialUsers: UserType[];
  initialFailedTopups: FailedTopupType[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [failedTopups, setFailedTopups] = useState(initialFailedTopups);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    type: "CREDIT" | "DEBIT";
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [topupsExpanded, setTopupsExpanded] = useState(true);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (userId: string, name: string, type: "CREDIT" | "DEBIT") => {
    setSelectedUser({ id: userId, name, type });
    setAmount("");
    setModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedUser) return;

    let numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0)
      return toast.error("Invalid amount. Please enter a positive number.");

    if (selectedUser.type === "DEBIT") {
      numAmount = -numAmount;
    }

    setIsProcessing(selectedUser.id);
    const res = await updateUserBalance(selectedUser.id, numAmount);

    if (res.success) {
      toast.success(
        `${selectedUser.type === "CREDIT" ? "Credited" : "Debited"} successfully`
      );
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? { ...u, balance: (parseFloat(u.balance) + numAmount).toString() }
            : u
        )
      );
      setModalOpen(false);
    } else {
      toast.error(res.error || "Failed to update balance");
    }
    setIsProcessing(null);
  };

  const handleApproveTopup = async (id: string) => {
    setIsProcessing(id);
    const res = await approveFailedTopup(id);
    if (res.success) {
      toast.success("Top-up approved & wallet credited ✅");
      setFailedTopups((prev) => prev.filter((t) => t.id !== id));
    } else {
      toast.error(res.error || "Failed to approve top-up");
    }
    setIsProcessing(null);
  };

  const handleRejectTopup = async (id: string) => {
    setIsProcessing(id);
    const res = await rejectFailedTopup(id);
    if (res.success) {
      toast.success("Top-up dismissed");
      setFailedTopups((prev) => prev.filter((t) => t.id !== id));
    } else {
      toast.error(res.error || "Failed to reject top-up");
    }
    setIsProcessing(null);
  };

  return (
    <div className="space-y-8">

      {/* ── Failed Top-ups Section ───────────────────────────── */}
      <div className="glass rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setTopupsExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-5 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-left">
              <h2 className="text-base font-bold font-outfit text-amber-900 dark:text-amber-200">
                Pending Top-up Approvals
              </h2>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                Top-ups paid but not auto-credited — review and approve manually
              </p>
            </div>
            {failedTopups.length > 0 && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                {failedTopups.length}
              </span>
            )}
          </div>
          {topupsExpanded ? (
            <ChevronUp className="h-4 w-4 text-amber-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-600" />
          )}
        </button>

        {/* Table */}
        {topupsExpanded && (
          <div className="overflow-x-auto">
            {failedTopups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 opacity-70" />
                <p className="text-sm font-medium">All clear — no pending top-ups</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">
                      Reference
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">
                      Reason
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">
                      Date
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {failedTopups.map((topup) => (
                    <tr
                      key={topup.id}
                      className={cn(
                        "hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors",
                        isProcessing === topup.id && "opacity-50 pointer-events-none"
                      )}
                    >
                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-tight truncate max-w-[160px]">
                              {topup.email}
                            </p>
                            {topup.userId && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                uid: {topup.userId.slice(0, 10)}…
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-lg text-emerald-600">
                          {formatCurrency(topup.amount.toString())}
                        </span>
                      </td>
                      {/* Reference */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded-lg text-muted-foreground truncate max-w-[140px] block">
                          {topup.reference}
                        </span>
                      </td>
                      {/* Reason */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-xs text-rose-600 dark:text-rose-400 max-w-[200px] block truncate" title={topup.reason || ""}>
                          {topup.reason || "—"}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {new Date(topup.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isProcessing === topup.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveTopup(topup.id)}
                                title="Approve — credit the user's wallet"
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-emerald-200"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectTopup(topup.id)}
                                title="Reject — dismiss without crediting"
                                className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-rose-200"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── User Balances Section ────────────────────────────── */}
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

        {/* Balance Update Modal */}
        {modalOpen && selectedUser && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <div className="bg-background w-full max-w-md rounded-3xl p-8 border shadow-2xl relative z-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black font-outfit">
                  {selectedUser.type === "CREDIT" ? "Credit Wallet" : "Debit Wallet"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Updating balance for{" "}
                  <span className="font-bold text-foreground">{selectedUser.name}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary">
                    GHS
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 bg-muted/30 border-2 border-transparent focus:border-primary/20 rounded-2xl outline-none text-2xl font-black transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-4 bg-muted hover:bg-muted/80 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={!!isProcessing || !amount}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50",
                    selectedUser.type === "CREDIT"
                      ? "bg-emerald-500 shadow-emerald-200"
                      : "bg-rose-500 shadow-rose-200"
                  )}
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    `Confirm ${selectedUser.type === "CREDIT" ? "Credit" : "Debit"}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="glass rounded-3xl overflow-hidden border border-border/50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-5 font-semibold text-xs uppercase tracking-wider">
                    User Account
                  </th>
                  <th className="px-6 py-5 font-semibold text-xs uppercase tracking-wider text-center">
                    Type
                  </th>
                  <th className="px-6 py-5 font-semibold text-xs uppercase tracking-wider">
                    Current Balance
                  </th>
                  <th className="px-6 py-5 font-semibold text-xs uppercase tracking-wider text-right">
                    Fund Management
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isProcessing === user.id && "opacity-50 pointer-events-none"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-base leading-tight">
                              {user.name || "Unknown"}
                            </span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border",
                            user.role === "ADMIN"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : user.role === "AGENT"
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                              : "bg-slate-50 text-slate-600 border-slate-100"
                          )}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-lg text-primary">
                        {formatCurrency(user.balance.toString())}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              openModal(user.id, user.name || user.email, "CREDIT")
                            }
                            className="flex items-center space-x-1 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-emerald-200"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Credit</span>
                          </button>
                          <button
                            onClick={() =>
                              openModal(user.id, user.name || user.email, "DEBIT")
                            }
                            className="flex items-center space-x-1 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm shadow-rose-200"
                          >
                            <Minus className="h-4 w-4" />
                            <span>Debit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-muted-foreground italic"
                    >
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

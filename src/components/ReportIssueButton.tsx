"use client";

import { useState } from "react";
import { MessageCircle, AlertTriangle, X, Calendar, Clock, Phone, ShoppingBag, BadgeHelp, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportIssueButtonProps {
  order: {
    id: string;
    phone: string;
    status: string;
    supplierStatus?: string;
    createdAt: string;
    bundle: {
      network: string;
      size: string;
    };
    amount: number | string;
  };
  adminWhatsApp: string;
}

const ISSUE_TYPES = [
  { id: "failed", label: "Order failed", emoji: "❌", desc: "My order shows FAILED" },
  { id: "stuck", label: "Stuck on Processing", emoji: "⏳", desc: "Order has been processing for too long" },
  { id: "not_delivered", label: "Data not received", emoji: "📵", desc: "Status shows COMPLETED but data is not delivered" },
  { id: "wrong_num", label: "Wrong number sent", emoji: "🔢", desc: "Data was sent to a wrong phone number" },
  { id: "other", label: "Other issue", emoji: "💬", desc: "Something else is wrong" },
];

export function ReportIssueButton({ order, adminWhatsApp }: ReportIssueButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string>("failed");
  const [customNotes, setCustomNotes] = useState("");

  const orderDate = new Date(order.createdAt).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const selectedIssue = ISSUE_TYPES.find(i => i.id === selectedIssueId);

  const handleReport = () => {
    const issueLabel = selectedIssue ? selectedIssue.label : "Other issue";
    const message = [
      `🚨 *Order Issue Report*`,
      ``,
      `*Issue:* ${issueLabel}`,
      customNotes.trim() ? `*Details:* ${customNotes.trim()}` : "",
      ``,
      `📋 *Verified Order Details*`,
      `• Order ID: \`${order.id.toUpperCase()}\``,
      `• Bundle: ${order.bundle.size} ${order.bundle.network}`,
      `• Recipient Phone: ${order.phone}`,
      `• Amount: GHS ${Number(order.amount).toFixed(2)}`,
      `• Current Status: ${order.supplierStatus || order.status}`,
      `• Placed At: ${orderDate}`,
      ``,
      `Please assist. Thank you 🙏`,
    ].filter(Boolean).join("\n");

    const encoded = encodeURIComponent(message);
    const number = adminWhatsApp.replace(/\D/g, "");
    window.open(`https://wa.me/${number}?text=${encoded}`, "_blank");
    setIsOpen(false);
    setCustomNotes("");
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/50",
    PROCESSING: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
    COMPLETED: "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50",
    FAILED: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50",
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Report an issue with this order"
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 transition-all active:scale-95 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50 dark:hover:bg-orange-900/30"
      >
        <AlertTriangle className="h-3 w-3" />
        <span>Report</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Modal Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-orange-50/50 dark:bg-orange-950/20 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-500 rounded-xl">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Report Order Issue</h3>
                  <p className="text-[10px] text-muted-foreground font-bold">Review details and submit to support</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Order Info Card (Read Only) */}
              <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-900 rounded-2xl p-4 space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</span>
                  <span className="font-mono text-xs font-black bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800">
                    {order.id.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-bold truncate text-slate-700 dark:text-slate-350">
                      {order.bundle.size} {order.bundle.network}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-muted-foreground justify-end">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-350">
                      {order.phone}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{orderDate}</span>
                  </div>

                  <div className="flex items-center space-x-2 justify-end">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusColors[order.status] || "bg-slate-100 text-slate-600"}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Issue Selection */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center space-x-1.5">
                  <BadgeHelp className="h-3.5 w-3.5" />
                  <span>Choose Issue Category</span>
                </label>
                <div className="space-y-2">
                  {ISSUE_TYPES.map((issue) => {
                    const isSelected = selectedIssueId === issue.id;
                    return (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => setSelectedIssueId(issue.id)}
                        className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-500 shadow-sm"
                            : "bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border-slate-100 dark:border-zinc-800"
                        }`}
                      >
                        <span className="text-xl leading-none">{issue.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-black leading-none mb-1 ${isSelected ? "text-orange-700 dark:text-orange-400" : "text-foreground"}`}>
                            {issue.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{issue.desc}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom notes */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Additional Details / Message
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Tell us what went wrong (e.g. data didn't receive, wrong recipient network selected, etc.). This will be added to the report."
                  className="w-full min-h-[90px] px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none shadow-inner"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950/30 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReport}
                className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-green-200 dark:shadow-none"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Send via WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

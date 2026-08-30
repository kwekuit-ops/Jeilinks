"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, AlertTriangle,      CheckCircle2, ChevronLeft } from "lucide-react";

interface ReportClientProps {
  order: {
    id: string;
    phone: string;
    status: string;
    supplierStatus?: string;
    createdAt: string;
    amount: number | string;
    bundle: {
      network: string;
      size: string;
    };
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

export function ReportClient({ order, adminWhatsApp }: ReportClientProps) {
  const router = useRouter();
  const [selectedIssueId, setSelectedIssueId] = useState<string>("failed");
  const [customNotes, setCustomNotes] = useState("");

  const orderDate = new Date(order.createdAt).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const selectedIssue = ISSUE_TYPES.find(i => i.id === selectedIssueId);

  const handleSubmit = () => {
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
    let cleanNumber = adminWhatsApp.replace(/\D/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "233" + cleanNumber.substring(1);
    }
    window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encoded}`, "_blank");
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/50",
    PROCESSING: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
    COMPLETED: "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50",
    FAILED: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50",
  };

  return (
    <div className="space-y-8 animate-in max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to previous page</span>
      </button>

      {/* Header */}
      <div className="flex items-center space-x-3.5">
        <div className="p-3 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-outfit text-slate-800 dark:text-slate-100">Report Order Issue</h1>
          <p className="text-xs text-muted-foreground font-bold">Please verify the details below and select the issue type to report.</p>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-border/50 shadow-xl bg-white dark:bg-zinc-900">
        
        {/* Form Header / Order Info (Read-Only) */}
        <div className="p-6 bg-slate-50/50 dark:bg-zinc-950/20 border-b border-border/50">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Verified Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Order ID</span>
                <span className="font-mono font-black">{order.id.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Recipient</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-200">{order.phone}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Bundle</span>
                <span className="font-bold text-primary">{order.bundle.size} {order.bundle.network}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Placed At</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{orderDate}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Amount</span>
                <span className="font-black text-slate-800 dark:text-slate-200">GHS {Number(order.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">Status</span>
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusColors[order.status] || "bg-slate-100 text-slate-600"}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
                  {order.status}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Step 1: Issue Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center space-x-2">
              <span className="flex items-center justify-center h-5 w-5 bg-orange-100 dark:bg-orange-950 text-orange-600 rounded-full text-[10px] font-bold">1</span>
              <span>Select Issue Category</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {ISSUE_TYPES.map((issue) => {
                const isSelected = selectedIssueId === issue.id;
                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? "bg-orange-50/40 dark:bg-orange-950/20 border-orange-500 shadow-sm"
                        : "bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 border-slate-100 dark:border-zinc-800"
                    }`}
                  >
                    <span className="text-2xl leading-none">{issue.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black leading-none mb-1.5 ${isSelected ? "text-orange-700 dark:text-orange-400" : "text-slate-800 dark:text-slate-200"}`}>
                        {issue.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{issue.desc}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-orange-500 shrink-0 animate-in zoom-in duration-150" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Custom details */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center space-x-2">
              <span className="flex items-center justify-center h-5 w-5 bg-orange-100 dark:bg-orange-950 text-orange-600 rounded-full text-[10px] font-bold">2</span>
              <span>Additional Details / Comments</span>
            </h3>

            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g., Customer says they did not receive the bundle SMS yet, or please cross check with supplier API."
              className="w-full min-h-[120px] p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none shadow-inner"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-border/50 flex flex-col md:flex-row gap-4 items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full md:w-auto px-6 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 text-sm font-bold hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors text-center"
            >
              Cancel
            </button>

            {adminWhatsApp ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg shadow-green-200 dark:shadow-none"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Submit to WhatsApp Support</span>
              </button>
            ) : (
              <div className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 px-4 py-3 rounded-2xl">
                ⚠️ WhatsApp Support number is not configured in settings.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

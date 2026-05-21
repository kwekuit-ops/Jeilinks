"use client";

import { useState } from "react";
import { MessageCircle, AlertTriangle, X, ChevronDown } from "lucide-react";

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
  { label: "Order failed", emoji: "❌", desc: "My order shows FAILED" },
  { label: "Stuck on Processing", emoji: "⏳", desc: "Order has been processing too long" },
  { label: "Data not received", emoji: "📵", desc: "Status shows COMPLETED but no data" },
  { label: "Wrong number sent", emoji: "🔢", desc: "Data was sent to wrong number" },
  { label: "Other issue", emoji: "💬", desc: "Something else is wrong" },
];

export function ReportIssueButton({ order, adminWhatsApp }: ReportIssueButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  const handleReport = (issueLabel: string) => {
    const orderDate = new Date(order.createdAt).toLocaleString("en-GH", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const message = [
      `🚨 *Order Issue Report*`,
      ``,
      `*Issue:* ${issueLabel}`,
      ``,
      `📋 *Order Details*`,
      `• Order ID: \`${order.id.slice(-8).toUpperCase()}\``,
      `• Bundle: ${order.bundle.size} ${order.bundle.network}`,
      `• Phone: ${order.phone}`,
      `• Amount: GHS ${Number(order.amount).toFixed(2)}`,
      `• Status: ${order.supplierStatus || order.status}`,
      `• Placed: ${orderDate}`,
      ``,
      `Please assist. Thank you 🙏`,
    ].join("\n");

    const encoded = encodeURIComponent(message);
    const number = adminWhatsApp.replace(/\D/g, "");
    window.open(`https://wa.me/${number}?text=${encoded}`, "_blank");
    setIsOpen(false);
    setSelectedIssue(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Report an issue with this order"
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 transition-all active:scale-95"
      >
        <AlertTriangle className="h-3 w-3" />
        <span>Report</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 bottom-full mb-2 z-50 w-72 bg-white dark:bg-zinc-900 border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-orange-500 rounded-lg">
                  <MessageCircle className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-orange-700 dark:text-orange-400">Report via WhatsApp</p>
                  <p className="text-[9px] text-orange-500 font-bold">Order #{order.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <X className="h-3.5 w-3.5 text-orange-500" />
              </button>
            </div>

            {/* Issue list */}
            <div className="p-2 space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 pt-1 pb-0.5">
                What's the issue?
              </p>
              {ISSUE_TYPES.map((issue) => (
                <button
                  key={issue.label}
                  onClick={() => handleReport(issue.label)}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-200 border border-transparent transition-all group"
                >
                  <span className="text-base leading-none">{issue.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground leading-none mb-0.5">{issue.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{issue.desc}</p>
                  </div>
                  <MessageCircle className="h-3 w-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>

            <div className="px-4 py-2 border-t bg-muted/30">
              <p className="text-[9px] text-muted-foreground text-center">
                Tapping an option will open WhatsApp with a pre-filled message
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

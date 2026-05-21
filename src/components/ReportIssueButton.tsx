"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface ReportIssueButtonProps {
  order: {
    id: string;
  };
  adminWhatsApp?: string;
}

export function ReportIssueButton({ order }: ReportIssueButtonProps) {
  return (
    <Link
      href={`/dashboard/orders/${order.id}/report`}
      title="Report an issue with this order"
      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 transition-all active:scale-95 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50 dark:hover:bg-orange-900/30"
    >
      <AlertTriangle className="h-3 w-3" />
      <span>Report</span>
    </Link>
  );
}

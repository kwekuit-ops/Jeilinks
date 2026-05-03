"use client";

import { Filter } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentStatus = searchParams.get("status") || "ALL";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (status === "ALL") {
        params.delete("status");
    } else {
        params.set("status", status);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-border/50 p-3 px-6 rounded-[2rem] shadow-sm animate-in">
      <div className="p-2 bg-primary/10 rounded-xl">
        <Filter className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-col min-w-[120px]">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Status</span>
        <select
          value={currentStatus}
          onChange={handleChange}
          className="bg-transparent text-sm font-bold outline-none cursor-pointer focus:text-primary transition-colors appearance-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
    </div>
  );
}

"use client";

import { Calendar } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentDate = searchParams.get("date") || new Date().toISOString().split('T')[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.set("date", date);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-border/50 p-2 px-4 rounded-2xl shadow-sm">
      <Calendar className="h-4 w-4 text-primary" />
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Select Date</span>
        <input
          type="date"
          value={currentDate}
          onChange={handleChange}
          className="bg-transparent text-sm font-bold outline-none cursor-pointer"
        />
      </div>
    </div>
  );
}

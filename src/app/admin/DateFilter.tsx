"use client";

import { Calendar } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const startDate = searchParams.get("date") || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get("endDate") || startDate;

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.set("date", val);
    // If setting start date after end date, reset end date to start date
    if (new Date(val) > new Date(endDate)) {
        params.set("endDate", val);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams);
    params.set("endDate", val);
    // If setting end date before start date, reset start date to end date
    if (new Date(val) < new Date(startDate)) {
        params.set("date", val);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-border/50 p-3 px-6 rounded-[2rem] shadow-sm animate-in">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-xl">
            <Calendar className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">From</span>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="bg-transparent text-sm font-bold outline-none cursor-pointer focus:text-primary transition-colors"
          />
        </div>
      </div>
      
      <div className="hidden md:block w-px h-8 bg-border/50" />

      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-xl">
            <Calendar className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">To</span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="bg-transparent text-sm font-bold outline-none cursor-pointer focus:text-primary transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

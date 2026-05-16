"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Pause, Play } from "lucide-react";

export function AutoRefreshToggle() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const router = useRouter();

    useEffect(() => {
        if (!isEnabled) {
            setTimeLeft(60);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isEnabled]);

    useEffect(() => {
        if (isEnabled && timeLeft <= 0) {
            router.refresh();
            setTimeLeft(60);
        }
    }, [isEnabled, timeLeft, router]);

    const percentage = (timeLeft / 60) * 100;

    return (
        <div className="flex items-center space-x-3 bg-white dark:bg-zinc-950 px-3.5 py-2 rounded-2xl border shadow-sm transition-all hover:shadow-md group">
            <div className="relative flex items-center justify-center w-10 h-10">
                <svg className="w-10 h-10 transform -rotate-90">
                    <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="transparent"
                        className="text-secondary"
                    />
                    {isEnabled && (
                        <circle
                            cx="20"
                            cy="20"
                            r="18"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            fill="transparent"
                            strokeDasharray={113.1}
                            strokeDashoffset={113.1 - (113.1 * percentage) / 100}
                            className="text-primary transition-all duration-1000 ease-linear"
                            strokeLinecap="round"
                        />
                    )}
                </svg>
                <button 
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`absolute inset-0 flex items-center justify-center rounded-full transition-all ${isEnabled ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                    {isEnabled ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 ml-0.5 fill-current" />}
                </button>
            </div>
            
            <div className="flex flex-col min-w-[70px]">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 leading-none mb-1">Status Sync</span>
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-black font-mono tracking-tighter">
                        {isEnabled ? `${timeLeft}s` : "DISABLED"}
                    </span>
                    {isEnabled && <RefreshCcw className="h-2.5 w-2.5 text-primary animate-spin" />}
                </div>
            </div>
        </div>
    );
}

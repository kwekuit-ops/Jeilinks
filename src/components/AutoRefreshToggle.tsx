"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Pause, Play } from "lucide-react";

export function AutoRefreshToggle() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const router = useRouter();

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isEnabled) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        router.refresh();
                        return 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setTimeLeft(60);
        }

        return () => clearInterval(interval);
    }, [isEnabled, router]);

    return (
        <div className="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-xl border">
            <div className="flex items-center space-x-2">
                <button 
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`p-1.5 rounded-lg transition-all ${isEnabled ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground"}`}
                >
                    {isEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Auto Refresh</span>
                    <span className="text-xs font-bold font-mono">
                        {isEnabled ? `${timeLeft}s` : "OFF"}
                    </span>
                </div>
            </div>
            {isEnabled && <RefreshCcw className="h-3 w-3 text-primary animate-spin" />}
        </div>
    );
}

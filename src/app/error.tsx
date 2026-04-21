"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-red-100 shadow-2xl text-center space-y-6">
        <div className="inline-flex p-4 bg-red-50 text-red-500 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
            <h2 className="text-2xl font-black font-outfit text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl font-mono break-all text-left">
                {error.message || "Unknown server error"}
            </p>
        </div>
        <button
          onClick={() => reset()}
          className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:brightness-110 transition-all"
        >
          Try again
        </button>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
            Error Digest: {error.digest || "N/A"}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 glass p-8 rounded-2xl shadow-xl animate-in">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6 group">
            <span className="text-4xl font-black tracking-tighter text-primary font-outfit group-hover:scale-105 transition-transform block">
              JEI<span className="text-foreground">LINKS</span>
            </span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight font-outfit">
            Forgot password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {submitted ? (
          /* Success state */
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Check your inbox</h3>
            <p className="text-sm text-muted-foreground">
              If an account with <strong className="text-foreground">{email}</strong> exists,
              we&apos;ve sent a password reset link. It expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        ) : (
          /* Form */
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              id="forgot-password-submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <div className="text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

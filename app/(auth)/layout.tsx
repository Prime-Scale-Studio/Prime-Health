import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen auth-bg flex flex-col">
      {/* ── Top bar ───────────────────────────────── */}
      <div className="p-6 sm:p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group w-fit"
          aria-label="Prime Health – go to home"
        >
          {/* Logo mark */}
          <div className="relative h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_2px_8px_hsl(var(--primary)/0.4)] transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_4px_16px_hsl(var(--primary)/0.5)]">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-xl ring-2 ring-primary/30 animate-pulse-dot" />
          </div>
          {/* Wordmark */}
          <span className="text-xl font-bold tracking-tight text-foreground">
            Prime
            <span className="text-primary">Health</span>
          </span>
        </Link>
      </div>

      {/* ── Centered content ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[440px] animate-fade-up">
          {children}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────── */}
      <div className="py-4 px-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Prime Scale Studio. All rights reserved.
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
      </div>
    </div>
  );
}

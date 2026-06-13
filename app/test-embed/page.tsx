"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function TestEmbedContent() {
  const searchParams = useSearchParams();
  const clinicId = searchParams.get("clinicId");

  useEffect(() => {
    if (!clinicId) return;

    // Remove any previous instance
    const existing = document.getElementById("ph-widget-script");
    if (existing) existing.remove();

    // Also remove any previous widget DOM
    const prevWrap = document.querySelector(".ph-wrap");
    if (prevWrap) prevWrap.remove();

    // Inject the real widget.js
    const script = document.createElement("script");
    script.id = "ph-widget-script";
    script.src = `/widget.js`;
    script.setAttribute("data-clinic-id", clinicId);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
      const wrap = document.querySelector(".ph-wrap");
      if (wrap) wrap.remove();
      // Reset guard so widget re-inits
      (window as Window & { __PH_WIDGET_INIT__?: boolean }).__PH_WIDGET_INIT__ = false;
    };
  }, [clinicId]);

  if (!clinicId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-8">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-sm text-center shadow-sm">
          <h1 className="text-xl font-bold text-foreground">Missing clinicId</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Go to AI Settings and click "Test Live Embed" to use this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Simulated website content */}
      <header className="border-b bg-white dark:bg-zinc-900 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="h-8 w-28 bg-muted rounded-lg animate-pulse" />
        <div className="flex gap-3">
          <div className="h-8 w-16 bg-muted rounded-lg animate-pulse" />
          <div className="h-8 w-16 bg-muted rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-primary/20 rounded-lg animate-pulse" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16 space-y-10">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full" />
          <div className="h-12 w-3/4 bg-muted rounded-xl animate-pulse" />
          <div className="h-4 w-full max-w-lg bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-2/3 max-w-md bg-muted/40 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-6 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-primary/10 rounded-xl animate-pulse" />
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-3 w-full bg-muted/50 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-muted/40 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-8 shadow-sm">
          <div className="h-6 w-48 bg-muted rounded mb-4 animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 bg-muted/40 rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground pt-4">
          👇 The Prime Health booking bubble is in the <strong>bottom-right corner</strong>
        </p>
      </main>
    </div>
  );
}

export default function TestEmbedPage() {
  return (
    <Suspense>
      <TestEmbedContent />
    </Suspense>
  );
}

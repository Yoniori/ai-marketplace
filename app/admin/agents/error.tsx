"use client";

// ─── Route-level error boundary for /admin/agents ───────────────────────────
//
// Next.js App Router calls this component whenever the nearest Server
// Component, Client Component, or loader below it throws — it keeps the
// rest of the app alive and stops the "missing required error components,
// refreshing…" white screen we were seeing when an Anthropic stream
// failure propagated past the page's internal try/catch.
//
// Keep this component intentionally bulletproof: no data-fetching, no
// suspense, no non-trivial component dependencies.

import { RotateCw, XCircle } from "lucide-react";
import { useEffect } from "react";

export default function AgentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the devtools console so the full stack is inspectable
    // even after the user clicks "Try again".
    console.error("[admin/agents] error boundary caught:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0e0e10", color: "#f9f5f8" }}
    >
      <div className="container max-w-3xl py-12">
        <div
          className="rounded-xl p-6"
          style={{
            background: "rgba(25,25,28,0.80)",
            border: "1px solid rgba(239,68,68,0.40)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 text-red-400" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-red-400/80">
              Agent console crashed
            </span>
          </div>

          <p className="mb-4 font-body text-sm text-white/80">
            Something threw outside the streaming error path. The rest of
            the app is unaffected — click &ldquo;Try again&rdquo; to
            re-mount this route.
          </p>

          <pre className="mb-4 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-red-300/90">
            {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : ""}
          </pre>

          <button
            onClick={() => reset()}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-mono text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #00e6e6, #9c42f4)",
              color: "#0e0e10",
            }}
          >
            <RotateCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * components/listing-check/ListingCheckCard.tsx
 *
 * Displays the latest automated quality check for a listing.
 * Handles 6 states: loading (initial fetch), no_check, running,
 * done (ready / needs_revision / flagged), and failed.
 *
 * Single-request flow: "Run check" calls POST and awaits the full
 * result (~5–20s). No polling required.
 */

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Zap,
  ChevronDown,
  ChevronUp,
  FileSearch,
} from "lucide-react";
import type { CheckReport, CheckOutcome } from "@/lib/listing-check/types";

// ── API shape ─────────────────────────────────────────────────

interface ListingCheck {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  outcome: CheckOutcome | null;
  triggered_at: string;
  completed_at: string | null;
  completeness_score: number | null;
  security_score: number | null;
  clarity_score: number | null;
  overall_score: number | null;
  report: CheckReport | null;
  files_analyzed: string[] | null;
  model_used: string | null;
  duration_ms: number | null;
  error_message: string | null;
}

interface Props {
  listingId: string;
}

// ── Loading phases ────────────────────────────────────────────

const LOADING_PHASES = [
  "Reading your listing…",
  "Scanning for security issues…",
  "Checking docs and setup…",
  "Evaluating buyer clarity…",
  "Putting together your report…",
];

const PHASE_MS = 3200; // ms per phase

// ── Verdict messaging ─────────────────────────────────────────

const VERDICT: Record<CheckOutcome, { headline: string; subline: string }> = {
  ready: {
    headline: "Your listing is publish-ready.",
    subline: "Good work — buyers will know exactly what they're getting.",
  },
  needs_revision: {
    headline: "Almost there — a few things to sharpen.",
    subline:
      "These improvements will make a real difference before you go live.",
  },
  flagged: {
    headline: "One issue needs your attention first.",
    subline: "Fix this before publishing — it protects both you and your buyers.",
  },
};

// ── Priority labels ───────────────────────────────────────────

const PRIORITY_LABEL: Record<string, { text: string; style: string }> = {
  high:   { text: "Fix first",   style: "border-red-500/30 text-red-400" },
  medium: { text: "Worth doing", style: "border-amber-500/30 text-amber-400" },
  low:    { text: "Polish",      style: "border-white/[0.08] text-white/30" },
};

// ── Confidence ────────────────────────────────────────────────

function confidenceLabel(filesAnalyzed: string[] | null) {
  const n = filesAnalyzed?.length ?? 0;
  if (n === 0)
    return {
      text: "Based on description only — upload a zip for a deeper read",
      dots: 1,
    };
  if (n <= 2)
    return {
      text: `${n} file${n > 1 ? "s" : ""} reviewed`,
      dots: 2,
    };
  return { text: `${n} files reviewed`, dots: 3 };
}

// ── Score bar ─────────────────────────────────────────────────

function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const barColor =
    score >= 8 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    score >= 8
      ? "text-emerald-400"
      : score >= 5
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
          {label}
        </span>
        <span className={`font-mono text-sm font-bold tabular-nums ${textColor}`}>
          {score}
          <span className="font-normal text-white/20">/10</span>
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

// ── Outcome badge ─────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: CheckOutcome }) {
  if (outcome === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        Ready
      </span>
    );
  }
  if (outcome === "needs_revision") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        Needs revision
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
      <XCircle className="h-3 w-3" />
      Flagged
    </span>
  );
}

// ── Loading view ──────────────────────────────────────────────

function LoadingView() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPhaseIndex((i) =>
        i < LOADING_PHASES.length - 1 ? i + 1 : i
      );
    }, PHASE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progress =
    phaseIndex < LOADING_PHASES.length - 1
      ? ((phaseIndex + 1) / LOADING_PHASES.length) * 100
      : 90; // plateau near end while waiting for server

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="space-y-5">
        {/* Status row */}
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary/60" />
          <p className="text-sm font-medium text-white/70 transition-all duration-500">
            {LOADING_PHASES[phaseIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-primary/40 ease-out"
              style={{ width: `${progress}%`, transition: "width 3s ease-out" }}
            />
          </div>
          <p className="font-mono text-[10px] text-white/20">
            Step {phaseIndex + 1} of {LOADING_PHASES.length} · usually takes 10–20s
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export function ListingCheckCard({ listingId }: Props) {
  const [check, setCheck] = useState<ListingCheck | null | undefined>(
    undefined // undefined = initial fetch pending
  );
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [showImprovements, setShowImprovements] = useState(true);

  useEffect(() => {
    fetch(`/api/listings/${listingId}/check/latest`)
      .then((r) => r.json())
      .then(({ check: latest }) => setCheck(latest ?? null))
      .catch(() => setCheck(null));
  }, [listingId]);

  async function handleRunCheck() {
    setIsRunning(true);
    setRunError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/check`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setRunError(data.error ?? "Check failed. Please try again.");
        return;
      }
      const refreshed = await fetch(
        `/api/listings/${listingId}/check/latest`
      ).then((r) => r.json());
      setCheck(refreshed.check ?? null);
    } catch {
      setRunError("Network error. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }

  // ── Initial fetch skeleton ─────────────────────────────────
  if (check === undefined) {
    return (
      <div className="animate-pulse rounded-lg border border-white/[0.08] bg-white/[0.02] p-6">
        <div className="mb-4 h-3.5 w-28 rounded bg-white/[0.06]" />
        <div className="h-16 w-full rounded bg-white/[0.04]" />
      </div>
    );
  }

  // ── Running ────────────────────────────────────────────────
  if (isRunning || check?.status === "running" || check?.status === "queued") {
    return <LoadingView />;
  }

  // ── No check yet ───────────────────────────────────────────
  if (!check) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/[0.08] text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white/80">Get a second opinion</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/40">
              See how your listing reads to a buyer — we&apos;ll flag what&apos;s
              missing, spot security issues, and tell you if the description
              actually explains what you built.
            </p>
            {runError && (
              <p className="mt-2 text-sm text-red-400">{runError}</p>
            )}
            <button
              onClick={handleRunCheck}
              disabled={isRunning}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/[0.08] px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              Run check
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Failed ─────────────────────────────────────────────────
  if (check.status === "failed") {
    return (
      <div className="relative overflow-hidden rounded-lg border border-red-500/20 bg-red-500/[0.04] p-6">
        <div className="absolute left-0 top-0 h-full w-0.5 rounded-l-lg bg-red-500/40" />
        <div className="flex items-start gap-4 pl-2">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white/80">Something went wrong</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/40">
              {check.error_message ??
                "The check didn't complete. This is usually a transient issue."}
            </p>
            {runError && (
              <p className="mt-1 text-sm text-red-400">{runError}</p>
            )}
            <button
              onClick={handleRunCheck}
              disabled={isRunning}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white/80 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Retrying…
                </>
              ) : (
                "Give it another shot"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Done — full report ─────────────────────────────────────
  const report = check.report;
  if (!report || !check.outcome) return null;

  const verdict = VERDICT[check.outcome];
  const confidence = confidenceLabel(check.files_analyzed);

  const borderBg =
    check.outcome === "ready"
      ? "border-emerald-500/20 bg-emerald-500/[0.02]"
      : check.outcome === "flagged"
      ? "border-red-500/20 bg-red-500/[0.02]"
      : "border-amber-500/20 bg-amber-500/[0.02]";

  const accentBar =
    check.outcome === "ready"
      ? "bg-emerald-500/50"
      : check.outcome === "flagged"
      ? "bg-red-500/50"
      : "bg-amber-500/50";

  return (
    <div className={`relative overflow-hidden rounded-lg border ${borderBg} p-6`}>
      <div className={`absolute left-0 top-0 h-full w-0.5 rounded-l-lg ${accentBar}`} />

      <div className="space-y-6 pl-2">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
              AI Quality Check
            </p>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-white/90 leading-snug">
              {verdict.headline}
            </h3>
            <p className="text-sm text-white/45 leading-relaxed">
              {verdict.subline}
            </p>
            <div className="pt-0.5">
              <OutcomeBadge outcome={check.outcome} />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-3xl font-bold tabular-nums text-white/70 leading-none">
              {report.overall_score}
            </p>
            <p className="font-mono text-[10px] text-white/25 mt-1">
              out of 10
            </p>
          </div>
        </div>

        {/* ── What it found ── */}
        <p className="text-sm leading-relaxed text-white/55 border-l-2 border-white/[0.08] pl-3 italic">
          &ldquo;{report.summary}&rdquo;
        </p>

        {/* ── Scores ── */}
        <div className="space-y-3">
          <ScoreBar label="Docs & setup"   score={report.completeness_score} />
          <ScoreBar label="Security"       score={report.security_score} />
          <ScoreBar label="Buyer clarity"  score={report.clarity_score} />
        </div>

        {/* ── Confidence indicator ── */}
        <div className="flex items-center gap-2.5">
          <FileSearch className="h-3.5 w-3.5 shrink-0 text-white/20" />
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  dot <= confidence.dots
                    ? "bg-white/30"
                    : "bg-white/[0.08]"
                }`}
              />
            ))}
          </div>
          <p className="font-mono text-[10px] text-white/25">{confidence.text}</p>
        </div>

        {/* ── Issues found ── */}
        {report.flags.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
              Issues found
            </p>
            <div className="space-y-2">
              {report.flags.map((flag, i) => (
                <div
                  key={i}
                  className={`rounded-md border px-3.5 py-3 text-sm ${
                    flag.severity === "critical"
                      ? "border-red-500/25 bg-red-500/[0.06] text-red-300"
                      : "border-amber-500/25 bg-amber-500/[0.06] text-amber-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {flag.severity === "critical" ? (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span>{flag.message}</span>
                      {flag.location && (
                        <span className="ml-2 font-mono text-[11px] opacity-50">
                          {flag.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── What to work on ── */}
        {report.improvements.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowImprovements((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
                What to work on
              </p>
              {showImprovements ? (
                <ChevronUp className="h-3.5 w-3.5 text-white/25" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-white/25" />
              )}
            </button>
            {showImprovements && (
              <div className="space-y-2">
                {report.improvements.map((imp, i) => {
                  const p = PRIORITY_LABEL[imp.priority] ?? PRIORITY_LABEL.low;
                  return (
                    <div
                      key={i}
                      className="rounded-md border border-white/[0.05] bg-white/[0.02] px-4 py-3.5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${p.style}`}
                        >
                          {p.text}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-white/65">
                        {imp.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Pricing note ── */}
        {report.pricing_note && (
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/25">
              Pricing note
            </p>
            <p className="text-sm text-white/50">{report.pricing_note}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-4 border-t border-white/[0.05] pt-4">
          <p className="font-mono text-[10px] text-white/20">
            {check.duration_ms != null
              ? `Completed in ${(check.duration_ms / 1000).toFixed(1)}s`
              : "Check complete"}
          </p>
          <button
            onClick={handleRunCheck}
            disabled={isRunning}
            className="shrink-0 inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/60 disabled:opacity-40"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Running…
              </>
            ) : (
              "Re-run check"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

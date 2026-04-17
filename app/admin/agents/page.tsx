"use client";

import { useEffect, useRef, useState } from "react";
import { runAgents, getAgentStatus, type AgentState } from "@/app/actions/ai-agents";
import { Loader2, Sparkles, Terminal, CheckCircle2, XCircle } from "lucide-react";

// ─── Polling tuning ──────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 300; // 2s × 300 = 10 minutes

type Phase = "idle" | "kickoff" | "polling" | "success" | "failed";

export default function AgentsPage() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [kickoffId, setKickoffId] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<AgentState | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [trace, setTrace] = useState<string | null>(null);
  const [rawStatus, setRawStatus] = useState<unknown>(null);
  const [attempts, setAttempts] = useState(0);

  // Keep a ref so the polling loop can bail immediately on unmount / re-run.
  const activeRef = useRef(false);

  // ── Kickoff handler ──────────────────────────────────────────────────────
  async function handleRun() {
    if (!prompt.trim()) return;
    if (phase === "kickoff" || phase === "polling") return;

    setPhase("kickoff");
    setKickoffId(null);
    setCurrentState(null);
    setResult(null);
    setErrorMsg(null);
    setFailureReason(null);
    setTrace(null);
    setRawStatus(null);
    setAttempts(0);

    const data = await runAgents(prompt);
    if (data.error) {
      setErrorMsg(data.error);
      setPhase("failed");
      return;
    }
    if (!data.executionId) {
      setErrorMsg("Kickoff succeeded but no executionId returned.");
      setPhase("failed");
      return;
    }

    setKickoffId(data.executionId);
    setPhase("polling");
  }

  // ── Polling loop (serial, not setInterval — prevents overlapping requests) ─
  useEffect(() => {
    if (phase !== "polling" || !kickoffId) return;

    activeRef.current = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let localAttempts = 0;

    const tick = async () => {
      if (!activeRef.current) return;
      localAttempts += 1;
      setAttempts(localAttempts);

      const status = await getAgentStatus(kickoffId);
      if (!activeRef.current) return;

      if (status.error) {
        setErrorMsg(status.error);
        setPhase("failed");
        return;
      }

      setCurrentState(status.state ?? null);
      // Keep the latest raw payload + trace data on every tick so that,
      // if the crew fails, the console already has the upstream evidence
      // — not just the final FAILED ping.
      if (status.rawStatus !== undefined) setRawStatus(status.rawStatus);
      if (status.failureReason) setFailureReason(status.failureReason);
      if (status.trace) setTrace(status.trace);

      if (status.state === "SUCCESS") {
        setResult(status.result ?? null);
        setPhase("success");
        return;
      }
      if (status.state === "FAILED") {
        setErrorMsg(
          status.failureReason ??
            status.error ??
            "Crew execution reported FAILED state.",
        );
        setPhase("failed");
        return;
      }

      if (localAttempts >= POLL_MAX_ATTEMPTS) {
        setErrorMsg(`Polling timed out after ${POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS / 60_000} minutes.`);
        setPhase("failed");
        return;
      }

      if (activeRef.current) {
        timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    tick();

    return () => {
      activeRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [phase, kickoffId]);

  // ── Derived display state ────────────────────────────────────────────────
  const isBusy = phase === "kickoff" || phase === "polling";
  const formattedResult =
    typeof result === "string" ? result : result != null ? JSON.stringify(result, null, 2) : null;

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0e0e10", color: "#f9f5f8" }}
    >
      <div className="container py-12 max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #00e6e6, #9c42f4)" }}
          >
            <Sparkles className="h-4 w-4 text-[#0e0e10]" />
          </div>
          <div>
            <h1 className="font-headline text-xl font-bold text-white">
              CrewAI Agent Console
            </h1>
            <p className="font-mono text-[11px] text-on-surface-variant/50">
              Admin · Internal use only
            </p>
          </div>
        </div>

        {/* Input card */}
        <div
          className="rounded-xl p-6 mb-4"
          style={{
            background: "rgba(25,25,28,0.80)",
            border: "1px solid rgba(72,71,74,0.50)",
            backdropFilter: "blur(12px)",
          }}
        >
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-on-surface-variant/60">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleRun();
            }}
            disabled={isBusy}
            placeholder="Enter instructions for the CrewAI agents…"
            rows={6}
            className="w-full resize-none rounded-lg bg-transparent text-sm text-white/90 placeholder:text-on-surface-variant/30 outline-none font-body disabled:opacity-50"
            style={{
              padding: "0.75rem",
              background: "rgba(0,0,0,0.30)",
              border: "1px solid rgba(72,71,74,0.50)",
              borderRadius: "0.5rem",
            }}
          />
          <p className="mt-2 font-mono text-[10px] text-on-surface-variant/30">
            Tip: ⌘+Enter to run
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={!prompt.trim() || isBusy}
          className="flex items-center gap-2 rounded-xl px-6 py-3 font-mono text-sm font-semibold transition-all duration-200 disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #00e6e6, #9c42f4)",
            color: "#0e0e10",
          }}
        >
          {phase === "kickoff" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Kicking off…
            </>
          ) : phase === "polling" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Run Agents
            </>
          )}
        </button>

        {/* Status indicator — shown while polling */}
        {phase === "polling" && (
          <div
            className="mt-6 rounded-xl p-4 flex items-center gap-3"
            style={{
              background: "rgba(25,25,28,0.80)",
              border: "1px solid rgba(0,230,230,0.30)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#00e6e6" }} />
            <div className="flex-1">
              <div className="font-mono text-xs text-white/90">
                {currentState ? `Processing · ${currentState}` : "Processing…"}
              </div>
              <div className="font-mono text-[10px] text-on-surface-variant/50 mt-0.5">
                {kickoffId && <>kickoff {kickoffId.slice(0, 8)}… · </>}
                poll {attempts}/{POLL_MAX_ATTEMPTS}
              </div>
            </div>
          </div>
        )}

        {/* Success — final result */}
        {phase === "success" && formattedResult && (
          <div
            className="mt-6 rounded-xl p-5"
            style={{
              background: "rgba(25,25,28,0.80)",
              border: "1px solid rgba(72,71,74,0.50)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#00e6e6" }} />
              <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant/50">
                Final Output
              </span>
            </div>
            <pre
              className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed"
              style={{ color: "#00e6e6" }}
            >
              {formattedResult}
            </pre>
          </div>
        )}

        {/* Failure — error surface (summary + reason + trace + raw payload) */}
        {phase === "failed" && errorMsg && (
          <div
            className="mt-6 rounded-xl p-5 space-y-4"
            style={{
              background: "rgba(25,25,28,0.80)",
              border: "1px solid rgba(239,68,68,0.40)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-red-400/80">
                Error
              </span>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/40 mb-1">
                Summary
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-red-300/90">
                {errorMsg}
              </pre>
            </div>

            {failureReason && failureReason !== errorMsg && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/40 mb-1">
                  Failure reason
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-red-300/90">
                  {failureReason}
                </pre>
              </div>
            )}

            {trace && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/40 mb-1">
                  Trace
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-red-300/80">
                  {trace}
                </pre>
              </div>
            )}

            {rawStatus != null && (
              <details className="group">
                <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface-variant/80">
                  Raw upstream payload
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-on-surface-variant/70">
                  {JSON.stringify(rawStatus, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Terminal footnote — kept for continuity with the original aesthetic */}
        {phase === "idle" && (
          <div className="mt-8 flex items-center gap-2 opacity-40">
            <Terminal className="h-3 w-3 text-cyan-400" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/40">
              Idle · awaiting brief
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

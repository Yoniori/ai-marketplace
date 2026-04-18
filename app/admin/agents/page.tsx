"use client";

import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Terminal,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type {
  PipelineEvent,
  StageKey,
} from "@/lib/design-agents/pipeline";

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase = "idle" | "running" | "success" | "failed";

interface StageMeta {
  key: StageKey;
  title: string;
}

interface StageState {
  status: "pending" | "streaming" | "complete" | "errored";
  text: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [stages, setStages] = useState<StageMeta[]>([]);
  const [states, setStates] = useState<Record<string, StageState>>({});
  const [currentStage, setCurrentStage] = useState<StageKey | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AbortController for cancelling an in-flight run (on unmount or re-run).
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Run handler ──────────────────────────────────────────────────────────
  //
  // Every failure path here must end in `setPhase("failed")` + `setErrorMsg`
  // — never a throw. The route-level error.tsx is a safety net, not the
  // primary handling path. If the user sees the error boundary it means
  // *this* function leaked an exception, which is a bug.
  async function handleRun() {
    const topic = prompt.trim();
    if (!topic) return;
    if (phase === "running") return;

    // Cancel any existing run before starting a new one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("running");
    setStages([]);
    setStates({});
    setCurrentStage(null);
    setErrorMsg(null);

    // Helper: route any caught exception into the red error panel without
    // letting it escape `handleRun`.
    const fail = (err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
      console.error("[admin/agents] run failed:", err);
      setErrorMsg(message);
      setPhase("failed");
    };

    // Wrap `applyEvent` at the call site so a bug in the reducer can never
    // bubble up into React's render tree.
    const safeApply = (evt: PipelineEvent) => {
      try {
        applyEvent(evt);
      } catch (err) {
        console.error("[admin/agents] applyEvent threw for", evt, err);
      }
    };

    try {
      const res = await fetch("/api/design-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let payloadError = `HTTP ${res.status}`;
        try {
          const payload = (await res.json()) as { error?: unknown };
          if (typeof payload.error === "string" && payload.error) {
            payloadError = payload.error;
          }
        } catch {
          // Not JSON — keep the HTTP-status fallback.
        }
        setErrorMsg(payloadError);
        setPhase("failed");
        return;
      }

      // ── Decode the NDJSON stream ─────────────────────────────────────────
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawTerminalEvent = false;

      while (true) {
        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await reader.read();
        } catch (err) {
          // The underlying stream errored mid-flight (dropped connection,
          // server crash, etc). Surface it — don't let the exception
          // escape to the React root.
          fail(err);
          return;
        }
        if (chunk.done) break;

        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep the (possibly partial) last line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let parsed: PipelineEvent | null = null;
          try {
            parsed = JSON.parse(trimmed) as PipelineEvent;
          } catch {
            // Malformed line — skip it and keep going.
            continue;
          }
          if (parsed && typeof parsed === "object" && "type" in parsed) {
            if (parsed.type === "error" || parsed.type === "pipeline_complete") {
              sawTerminalEvent = true;
            }
            safeApply(parsed);
          }
        }
      }

      // Flush any trailing line in the buffer.
      const tail = buffer.trim();
      if (tail) {
        try {
          const parsed = JSON.parse(tail) as PipelineEvent;
          if (parsed && typeof parsed === "object" && "type" in parsed) {
            if (parsed.type === "error" || parsed.type === "pipeline_complete") {
              sawTerminalEvent = true;
            }
            safeApply(parsed);
          }
        } catch {
          /* ignore */
        }
      }

      // If the stream closed without a terminal event AND we never flipped
      // to success/failed via an event, surface it as an error rather than
      // leaving the UI stuck in "running".
      if (!sawTerminalEvent) {
        setErrorMsg(
          "Stream closed before the pipeline reported completion. Check the dev-server terminal for an [design-agents] log line.",
        );
        setPhase("failed");
      }
    } catch (err) {
      fail(err);
    }
  }

  // ── Event reducer ────────────────────────────────────────────────────────
  function applyEvent(evt: PipelineEvent) {
    switch (evt.type) {
      case "pipeline_start": {
        setStages(evt.stages);
        const initial: Record<string, StageState> = {};
        for (const s of evt.stages) {
          initial[s.key] = { status: "pending", text: "" };
        }
        setStates(initial);
        return;
      }
      case "stage_start": {
        setCurrentStage(evt.key);
        setStates((prev) => ({
          ...prev,
          [evt.key]: { status: "streaming", text: "" },
        }));
        return;
      }
      case "stage_delta": {
        setStates((prev) => {
          const existing = prev[evt.key] ?? { status: "streaming", text: "" };
          return {
            ...prev,
            [evt.key]: {
              status: "streaming",
              text: existing.text + evt.delta,
            },
          };
        });
        return;
      }
      case "stage_complete": {
        setStates((prev) => ({
          ...prev,
          [evt.key]: { status: "complete", text: evt.text },
        }));
        return;
      }
      case "pipeline_complete": {
        setCurrentStage(null);
        setPhase("success");
        return;
      }
      case "error": {
        setErrorMsg(evt.message);
        if (evt.key) {
          setStates((prev) => ({
            ...prev,
            [evt.key!]: {
              status: "errored",
              text: prev[evt.key!]?.text ?? "",
            },
          }));
        }
        setPhase("failed");
        return;
      }
    }
  }

  const isBusy = phase === "running";

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
              Native Design Agents
            </h1>
            <p className="font-mono text-[11px] text-on-surface-variant/50">
              Admin · Vercel AI SDK · 6-stage pipeline
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
            Brief
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleRun();
            }}
            disabled={isBusy}
            placeholder="Describe the feature or initiative you want the agents to design…"
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
          {isBusy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running pipeline…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Run Agents
            </>
          )}
        </button>

        {/* Stage panels */}
        {stages.length > 0 && (
          <div className="mt-8 space-y-4">
            {stages.map((stage, idx) => {
              const state = states[stage.key] ?? {
                status: "pending" as const,
                text: "",
              };
              const isCurrent = currentStage === stage.key;
              const borderColor =
                state.status === "errored"
                  ? "rgba(239,68,68,0.45)"
                  : state.status === "complete"
                    ? "rgba(0,230,230,0.35)"
                    : isCurrent
                      ? "rgba(156,66,244,0.45)"
                      : "rgba(72,71,74,0.50)";

              return (
                <div
                  key={stage.key}
                  className="rounded-xl p-5"
                  style={{
                    background: "rgba(25,25,28,0.80)",
                    border: `1px solid ${borderColor}`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/40">
                        Stage {idx + 1} / {stages.length}
                      </span>
                      <span className="font-headline text-sm font-semibold text-white">
                        {stage.title}
                      </span>
                    </div>
                    <StageBadge status={state.status} />
                  </div>

                  {state.text ? (
                    <pre
                      className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed"
                      style={{
                        color:
                          state.status === "errored" ? "#fca5a5" : "#00e6e6",
                      }}
                    >
                      {state.text}
                      {state.status === "streaming" && (
                        <span className="animate-pulse text-white/60">▌</span>
                      )}
                    </pre>
                  ) : (
                    <p className="font-mono text-[10px] text-on-surface-variant/30">
                      {state.status === "pending"
                        ? "Queued…"
                        : "Waiting for first token…"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Failure panel */}
        {phase === "failed" && errorMsg && (
          <div
            className="mt-6 rounded-xl p-5"
            style={{
              background: "rgba(25,25,28,0.80)",
              border: "1px solid rgba(239,68,68,0.40)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-red-400/80">
                Error
              </span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-red-300/90">
              {errorMsg}
            </pre>
          </div>
        )}

        {/* Idle footnote */}
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

// ─── Small badge component ──────────────────────────────────────────────────

function StageBadge({ status }: { status: StageState["status"] }) {
  switch (status) {
    case "complete":
      return (
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cyan-300/80">
          <CheckCircle2 className="h-3 w-3" />
          Done
        </span>
      );
    case "streaming":
      return (
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-violet-300/80">
          <Loader2 className="h-3 w-3 animate-spin" />
          Streaming
        </span>
      );
    case "errored":
      return (
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-red-300/80">
          <XCircle className="h-3 w-3" />
          Error
        </span>
      );
    default:
      return (
        <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/40">
          Pending
        </span>
      );
  }
}

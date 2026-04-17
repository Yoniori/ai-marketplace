"use server";

// ─── Public types ────────────────────────────────────────────────────────────

/** Terminal + in-progress states returned by CrewAI Cloud. */
export type AgentState =
  | "PENDING"
  | "STARTED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | (string & {}); // permit unknown future states without losing autocomplete

/** Result of POST /kickoff — returns an execution handle to poll against. */
export interface KickoffResult {
  executionId?: string;
  error?: string;
}

/** Result of GET /status/:id — snapshot of the crew's current execution.
 *
 * CrewAI Cloud surfaces trace/failure information under several different
 * field names depending on version — we capture the superset and let the
 * UI pick whichever is populated. `rawStatus` is the full, un-normalised
 * payload so the admin console can show the exact upstream response when
 * a crew fails and the structured fields aren't enough to diagnose.
 */
export interface AgentStatus {
  state?: AgentState;
  result?: unknown;
  lastStep?: unknown;
  error?: string;
  /** Human-readable reason the crew died, if the upstream surfaced one. */
  failureReason?: string;
  /** Stack trace or multi-line error blob from the crew runtime. */
  trace?: string;
  /** Untouched status payload — surfaced verbatim for debugging. */
  rawStatus?: unknown;
}

// Back-compat alias — the initial callers typed the kickoff return as
// AgentResult. Kept as an alias so we don't break any external imports.
export type AgentResult = KickoffResult;

// ─── Internals ───────────────────────────────────────────────────────────────

/**
 * Build a CrewAI Cloud endpoint URL from CREWAI_API_URL + a path suffix.
 * Tolerates env values with or without a trailing slash, and strips a
 * pre-existing `/kickoff` suffix so status calls resolve correctly.
 */
function buildUrl(base: string, path: string): string {
  const trimmed = base.replace(/\/+$/, "").replace(/\/kickoff$/, "");
  return `${trimmed}${path}`;
}

function readCreds(): { base: string; token: string } | { error: string } {
  const base = process.env.CREWAI_API_URL;
  const token = process.env.CREWAI_BEARER_TOKEN;
  if (!base || !token) {
    return { error: "CREWAI_API_URL and CREWAI_BEARER_TOKEN must be set in environment variables." };
  }
  return { base, token };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Kick off a crew run. Returns an executionId (the CrewAI kickoff_id) that
 * can be polled with `getAgentStatus`. The crew's tasks.yaml template uses
 * `{brief}` — do not rename this key without updating both tasks.yaml copies.
 */
export async function runAgents(prompt: string): Promise<KickoffResult> {
  const creds = readCreds();
  if ("error" in creds) return creds;

  const url = buildUrl(creds.base, "/kickoff");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.token}`,
      },
      body: JSON.stringify({ inputs: { brief: prompt } }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: `CrewAI kickoff error ${res.status}: ${text}` };
    }

    // CrewAI Cloud's kickoff response is { kickoff_id: string }. Map to our
    // executionId so callers aren't tied to the upstream field name.
    const data = (await res.json().catch(() => ({}))) as {
      kickoff_id?: string;
      kickoffId?: string;
    };
    const executionId = data.kickoff_id ?? data.kickoffId;
    if (!executionId) {
      return { error: "CrewAI kickoff response missing kickoff_id" };
    }
    return { executionId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Poll the status of a running crew. Returns the current state plus the
 * final `result` once the state is "SUCCESS". Callers should re-invoke this
 * on an interval until state is "SUCCESS" or "FAILED".
 */
export async function getAgentStatus(kickoffId: string): Promise<AgentStatus> {
  if (!kickoffId) return { error: "kickoffId is required" };

  const creds = readCreds();
  if ("error" in creds) return creds;

  const url = buildUrl(creds.base, `/status/${encodeURIComponent(kickoffId)}`);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${creds.token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: `CrewAI status error ${res.status}: ${text}` };
    }

    // Some deployments expose the field as `state`, others as `status`.
    // Normalise to `state` on our side so the caller has a single field.
    // Trace/failure information also drifts across CrewAI Cloud versions —
    // we read the superset and let the UI render whatever is populated.
    const data = (await res.json().catch(() => ({}))) as {
      state?: string;
      status?: string;
      result?: unknown;
      last_step?: unknown;
      lastStep?: unknown;
      error?: string;
      error_message?: string;
      errorMessage?: string;
      failure_reason?: string;
      failureReason?: string;
      detail?: string;
      message?: string;
      trace?: string;
      traceback?: string;
      stack?: string;
    };

    const failureReason =
      data.failure_reason ??
      data.failureReason ??
      data.error_message ??
      data.errorMessage ??
      data.detail ??
      data.message;

    const trace = data.trace ?? data.traceback ?? data.stack;

    return {
      state: (data.state ?? data.status) as AgentState | undefined,
      result: data.result,
      lastStep: data.last_step ?? data.lastStep,
      error: data.error,
      failureReason,
      trace,
      rawStatus: data,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

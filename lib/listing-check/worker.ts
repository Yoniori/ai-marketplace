/**
 * lib/listing-check/worker.ts
 * Runs the automated listing quality check: ingests files, calls the AI model
 * once, enforces score constraints, and writes results to listing_checks.
 *
 * Uses OpenAI gpt-4o-mini with function calling (mirrors the original
 * Anthropic tool_use pattern — same structured JSON output guarantee).
 *
 * Called synchronously from POST /api/listings/[id]/check.
 */

import OpenAI from "openai";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { ingestFiles, ingestFromGitHub } from "./ingest";
import { SYSTEM_PROMPT, buildUserMessage, CHECK_TOOL } from "./prompt";
import type { CheckReport, CheckOutcome, ListingForCheck } from "./types";

// ── Env ───────────────────────────────────────────────────────

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.trim() === "") {
    throw new Error(
      "[listing-check] Missing OPENAI_API_KEY.\n" +
        "→ Add OPENAI_API_KEY=sk-... to .env.local and restart the server."
    );
  }
  return key.trim();
}

// ── Score constraint enforcement ──────────────────────────────

/**
 * Enforce the hard rule from the prompt schema:
 * if security_score < 4, overall_score must be ≤ 5 and outcome must be 'flagged'.
 * Guards against the model ignoring its own instructions.
 */
function enforceConstraints(raw: CheckReport): CheckReport {
  const isSecurityCritical = raw.security_score < 4;

  const overall_score = isSecurityCritical
    ? Math.min(raw.overall_score, 5)
    : raw.overall_score;

  const outcome: CheckOutcome =
    isSecurityCritical && raw.outcome !== "flagged"
      ? "flagged"
      : raw.outcome;

  return { ...raw, overall_score, outcome };
}

// ── Main export ───────────────────────────────────────────────

export async function runCheck(
  checkId: string,
  listing: ListingForCheck,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _adminClient: any  // kept for API compatibility but no longer used for writes
): Promise<CheckReport> {
  // Use a fresh basic Supabase client with the service role key.
  // The SSR createServerClient (passed as adminClient) relies on cookie-based
  // session context that can go stale during a long async operation like an
  // OpenAI call. The basic client with persistSession:false is the correct
  // pattern for server-side background writes.
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "[listing-check/worker] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  console.log(
    "[listing-check/worker] Supabase URL:", supabaseUrl,
    "| Service key present:", serviceKey.length > 0
  );

  const db = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Guard: a missing checkId means the INSERT in the route didn't return a row.
  // This should never happen, but catch it early so the error is obvious.
  if (!checkId) {
    throw new Error("[listing-check/worker] checkId is empty — INSERT did not return a row.");
  }

  // ingestFiles still uses _adminClient because it may need SSR cookie context
  // for Storage access. We keep the parameter for that.
  const start = Date.now();
  const MODEL = "gpt-4o-mini";

  try {
    // 1. Ingest files — ZIP takes priority, GitHub repo as fallback
    let files: import("./types").IngestedFile[] = [];
    let fileNames: string[] = [];

    if (listing.files_path) {
      ({ files, fileNames } = await ingestFiles(listing.files_path, _adminClient));
    } else if (listing.github_repo_full_name && listing.github_access_token) {
      console.log("[listing-check/worker] No ZIP — fetching from GitHub repo:", listing.github_repo_full_name);
      ({ files, fileNames } = await ingestFromGitHub(
        listing.github_repo_full_name,
        listing.github_access_token
      ));
    }

    // 2. Build user message
    const userMessage = buildUserMessage(listing, files);

    // 3. OpenAI function-calling — mirrors Anthropic tool_use pattern
    const openai = new OpenAI({ apiKey: getOpenAIKey() });

    console.log("[listing-check/worker] Calling OpenAI API…");
    let response: Awaited<ReturnType<typeof openai.chat.completions.create>>;
    try {
      response = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMessage   },
        ],
        tools: [
          {
            type: "function",
            function: {
              name:        CHECK_TOOL.name,
              description: CHECK_TOOL.description,
              // OpenAI uses `parameters` where Anthropic uses `input_schema` —
              // the JSON Schema content is identical.
              parameters:  CHECK_TOOL.input_schema as Record<string, unknown>,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_check_result" } },
      });
      console.log(
        "[listing-check/worker] OpenAI response received. finish_reason:",
        response.choices[0]?.finish_reason
      );
    } catch (apiErr) {
      const e = apiErr as { status?: number; message?: string };
      console.error(
        "[listing-check/worker] OpenAI API error:",
        `status=${e.status ?? "?"}`,
        `message=${e.message ?? String(apiErr)}`
      );
      throw apiErr;
    }

    // 4. Extract function call arguments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCall = response.choices[0]?.message?.tool_calls?.[0] as any;
    if (!toolCall || toolCall.function?.name !== "submit_check_result") {
      throw new Error(
        "OpenAI response did not include a function call. " +
          `finish_reason: ${response.choices[0]?.finish_reason}`
      );
    }

    // 5. Parse + enforce constraints
    const report = enforceConstraints(
      JSON.parse(toolCall.function.arguments) as CheckReport
    );

    // 6. Write results to DB
    const payload = {
      status:               "done",
      completed_at:         new Date().toISOString(),
      outcome:              report.outcome,
      completeness_score:   report.completeness_score,
      security_score:       report.security_score,
      clarity_score:        report.clarity_score,
      overall_score:        report.overall_score,
      report:               report as unknown as Record<string, unknown>,
      files_analyzed:       fileNames,
      model_used:           MODEL,
      duration_ms:          Date.now() - start,
    };

    console.log(
      "FINAL_CHECK_DATA_BEFORE_SAVE — checkId:", checkId,
      "\n", JSON.stringify({
        checkId,
        listingId: listing.id,
        status:            payload.status,
        outcome:           payload.outcome,
        overall_score:     payload.overall_score,
        completeness_score: payload.completeness_score,
        security_score:    payload.security_score,
        clarity_score:     payload.clarity_score,
        files_analyzed:    payload.files_analyzed,
        model_used:        payload.model_used,
        duration_ms:       payload.duration_ms,
        report_keys:       Object.keys(report),
      }, null, 2)
    );

    const { data: updatedRows, error: updateError } = await db
      .from("listing_checks")
      .update(payload)
      .eq("id", checkId)
      .select("id");

    if (updateError) {
      console.error(
        "[listing-check/worker] DB update failed. code:", updateError.code,
        "| message:", updateError.message,
        "| details:", updateError.details,
        "| hint:", updateError.hint
      );
      throw new Error(
        `[listing-check/worker] Failed to write results to DB: ${updateError.message}`
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.error(
        "[listing-check/worker] UPDATE matched 0 rows! checkId:", checkId,
        "— row may have been deleted or checkId is wrong."
      );
      throw new Error(
        `[listing-check/worker] UPDATE matched 0 rows for checkId: ${checkId}`
      );
    }

    console.log(
      "DEBUG_SUCCESS: DB updated for checkId:",
      checkId,
      "| outcome:", report.outcome,
      "| overall_score:", report.overall_score
    );

    return report;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during check";

    try {
      await db
        .from("listing_checks")
        .update({
          status:        "failed",
          completed_at:  new Date().toISOString(),
          error_message: message,
          duration_ms:   Date.now() - start,
        })
        .eq("id", checkId);
    } catch {
      // Swallow — the original error is what matters
    }

    throw err;
  }
}

/**
 * lib/listing-check/worker.ts
 * Runs the automated listing quality check: ingests files, calls Claude
 * once, enforces score constraints, and writes results to listing_checks.
 *
 * Called synchronously from the POST /api/listings/[id]/check route.
 * The route handler awaits this function — no background processing.
 *
 * Why synchronous (not fire-and-forget):
 *   Next.js 14 serverless functions on Vercel are terminated immediately
 *   after the response is sent. Any promise fired after `return Response`
 *   will be killed. waitUntil() is a Next.js 15+ feature. Synchronous
 *   execution is the only safe pattern in this stack at MVP.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ingestFiles } from "./ingest";
import { SYSTEM_PROMPT, buildUserMessage, CHECK_TOOL } from "./prompt";
import type { CheckReport, CheckOutcome, ListingForCheck } from "./types";

// ── Env ───────────────────────────────────────────────────────

function getAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.trim() === "") {
    throw new Error(
      "[listing-check] Missing ANTHROPIC_API_KEY.\n" +
        "→ Add ANTHROPIC_API_KEY=sk-ant-... to .env.local and restart the server."
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

/**
 * Run the automated quality check for a listing.
 *
 * On success: updates the listing_checks row (status → 'done') and returns CheckReport.
 * On failure: updates the row (status → 'failed') and re-throws so the route
 *             handler can reset listings.review_status to null.
 *
 * @param checkId     - UUID of the listing_checks row (already inserted as 'running')
 * @param listing     - Minimal listing data for context
 * @param adminClient - Supabase client with service role key (bypasses RLS)
 */
export async function runCheck(
  checkId: string,
  listing: ListingForCheck,
  // Accept any Supabase client — the internal cast handles the type gap
  // until 011_listing_checks.sql is applied and db:types is re-run.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any
): Promise<CheckReport> {
  // Cast to any for listing_checks and new listings columns: these tables/columns
  // exist in the DB after 011_listing_checks.sql is applied, but the generated
  // types/supabase.ts won't reflect them until `npm run db:types` is re-run.
  // TODO: remove cast after regenerating types post-migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any;
  const start = Date.now();

  try {
    // 1. Ingest files from Storage (graceful — empty on failure)
    const { files, fileNames } = await ingestFiles(
      listing.files_path,
      adminClient
    );

    // 2. Build user message
    const userMessage = buildUserMessage(listing, files);

    // 3. Single Claude call with forced tool use
    const anthropic = new Anthropic({ apiKey: getAnthropicKey() });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      tools: [CHECK_TOOL],
      tool_choice: { type: "tool" as const, name: "submit_check_result" },
    });

    // 4. Extract tool_use block
    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (!toolUse) {
      throw new Error(
        "Claude response did not include a tool_use block. " +
          `stop_reason: ${response.stop_reason}`
      );
    }

    // 5. Apply score constraints
    const report = enforceConstraints(toolUse.input as CheckReport);

    // 6. Write results to DB
    const { error: updateError } = await db
      .from("listing_checks")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
        outcome: report.outcome,
        completeness_score: report.completeness_score,
        security_score: report.security_score,
        clarity_score: report.clarity_score,
        overall_score: report.overall_score,
        report: report as unknown as Record<string, unknown>,
        files_analyzed: fileNames,
        model_used: "claude-3-5-sonnet-20240620",
        duration_ms: Date.now() - start,
      })
      .eq("id", checkId);

    if (updateError) {
      // Log but don't throw — the check completed; a DB write failure
      // shouldn't cause the route to return 500 at this point.
      console.error(
        "[listing-check/worker] Failed to write results to DB:",
        updateError.message
      );
    }

    return report;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during check";

    // Mark check as failed — best-effort, swallow secondary errors
    try {
      await db
        .from("listing_checks")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: message,
          duration_ms: Date.now() - start,
        })
        .eq("id", checkId);
    } catch {
      // Swallow — the original error is what matters
    }

    throw err; // Re-throw so the route handler resets review_status
  }
}

/**
 * lib/listing-check/types.ts
 * Shared types for the automated listing quality check system.
 *
 * These do not appear in types/supabase.ts yet because the migration
 * (011_listing_checks.sql) must be pushed and types regenerated first.
 * Until then, DB calls use type assertions.
 */

// ── Check lifecycle ───────────────────────────────────────────

/** Status of a listing_checks row. */
export type CheckStatus = "queued" | "running" | "done" | "failed";

/**
 * Outcome written when status = 'done'.
 *
 * ready          — overall >= 7, no critical flags
 * needs_revision — overall 5–6, or warnings present
 * flagged        — any critical security finding (security_score < 4)
 */
export type CheckOutcome = "ready" | "needs_revision" | "flagged";

/**
 * Value written to listings.review_status.
 * Mirrors CheckOutcome plus 'pending' while the check is running.
 */
export type ReviewStatus = "pending" | "ready" | "needs_revision" | "flagged";

// ── Report shape ─────────────────────────────────────────────

export interface Flag {
  severity: "warning" | "critical";
  message: string;
  /** File and line reference, e.g. "config.js:14". Optional. */
  location?: string;
}

export interface Improvement {
  priority: "high" | "medium" | "low";
  /** Single actionable sentence starting with a verb. */
  text: string;
}

/**
 * Structured output from the single Claude call.
 * Stored verbatim in listing_checks.report (JSONB).
 */
export interface CheckReport {
  completeness_score: number; // 0–10
  security_score: number;     // 0–10  (10 = clean)
  clarity_score: number;      // 0–10
  overall_score: number;      // 0–10  (capped at 5 if security_score < 4)
  outcome: CheckOutcome;
  summary: string;            // one sentence
  flags: Flag[];
  improvements: Improvement[];
  pricing_note: string | null;
}

// ── Ingestion ─────────────────────────────────────────────────

/** A single file extracted from the uploaded zip. */
export interface IngestedFile {
  /** Basename only, e.g. "README.md". */
  name: string;
  /** Raw text content, truncated to MAX_LINES lines. */
  content: string;
}

// ── Listing shape used by the worker ─────────────────────────

/**
 * Minimal listing fields needed to run a check.
 * Assembled in the route handler from the DB query result.
 */
export interface ListingForCheck {
  id: string;
  title: string;
  description: string;
  price_type: string;
  price_cents: number;
  /** Supabase Storage path, or null if no file uploaded. */
  files_path: string | null;
  /** Category name for context, or null if uncategorized. */
  category_name: string | null;
}

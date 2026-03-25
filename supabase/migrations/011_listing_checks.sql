-- ============================================================
-- 011_listing_checks.sql
-- Vibe Code Market — Automated Listing Quality Checks
-- ============================================================
-- listing_checks stores results of the automated Claude scan
-- run when a creator submits a listing before publishing.
--
-- NAMING NOTE: This is NOT the same as public.reviews, which
-- holds buyer product reviews. "listing_checks" is an automated
-- quality scan — a basic first-pass, not a full security audit.
--
-- listings.review_status is a new TEXT column kept intentionally
-- separate from listings.status (the publish lifecycle ENUM:
-- draft → published → archived → suspended). Do not add states
-- to that ENUM — review concerns are tracked here instead.
-- ============================================================


-- ── New columns on listings ──────────────────────────────────

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS files_path    TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_status TEXT    DEFAULT NULL;

COMMENT ON COLUMN public.listings.files_path IS
  'Supabase Storage path to the creator-uploaded product zip file.
   Used by the automated check to read source files.
   Expected format: listing-files/{listing_id}/{filename}.zip';

COMMENT ON COLUMN public.listings.review_status IS
  'State of the most recent automated quality check.
   Kept separate from listings.status (the publish lifecycle).
   NULL     = no check has been triggered yet.
   pending  = check is currently running.
   ready    = check completed, outcome: ready.
   needs_revision = check completed, improvements suggested.
   flagged  = critical issue found, routed to admin queue.';

ALTER TABLE public.listings
  ADD CONSTRAINT listing_review_status_values CHECK (
    review_status IS NULL
    OR review_status IN ('pending', 'ready', 'needs_revision', 'flagged')
  );


-- ── listing_checks ───────────────────────────────────────────

CREATE TABLE public.listing_checks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  listing_id      UUID        NOT NULL REFERENCES public.listings(id)  ON DELETE CASCADE,
  triggered_by    UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,

  -- Lifecycle
  triggered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  status          TEXT        NOT NULL DEFAULT 'queued',
  -- 'queued' | 'running' | 'done' | 'failed'

  -- Outcome (NULL until status = 'done')
  outcome         TEXT,
  -- 'ready' | 'needs_revision' | 'flagged'

  -- Scores (NULL until status = 'done'; each 0–10)
  completeness_score  SMALLINT,   -- README, setup docs, entry point
  security_score      SMALLINT,   -- 10 = clean; deducted for secrets/injection
  clarity_score       SMALLINT,   -- description matches code; buyer understands it
  overall_score       SMALLINT,   -- holistic; capped at 5 if security_score < 4

  -- Full structured report from Claude (CheckReport JSON)
  report          JSONB,

  -- Operational metadata
  attempt_count   INTEGER     NOT NULL DEFAULT 0,
  files_analyzed  TEXT[],         -- filenames included in the Claude context
  model_used      TEXT,
  duration_ms     INTEGER,
  error_message   TEXT,           -- populated when status = 'failed'

  -- Constraints
  CONSTRAINT lc_status_values CHECK (
    status IN ('queued', 'running', 'done', 'failed')
  ),
  CONSTRAINT lc_outcome_values CHECK (
    outcome IS NULL
    OR outcome IN ('ready', 'needs_revision', 'flagged')
  ),
  CONSTRAINT lc_score_range CHECK (
    (completeness_score IS NULL OR completeness_score BETWEEN 0 AND 10) AND
    (security_score     IS NULL OR security_score     BETWEEN 0 AND 10) AND
    (clarity_score      IS NULL OR clarity_score      BETWEEN 0 AND 10) AND
    (overall_score      IS NULL OR overall_score      BETWEEN 0 AND 10)
  ),
  CONSTRAINT lc_attempt_non_neg CHECK (attempt_count >= 0)
);

COMMENT ON TABLE public.listing_checks IS
  'Automated quality scans run by Claude before a creator publishes a listing.
   Basic first-pass only — not a full security audit.
   Separate from public.reviews (buyer product ratings).';

COMMENT ON COLUMN public.listing_checks.security_score IS
  '10 = no issues found. Deducted for hardcoded secrets, eval on input, injection patterns.';

COMMENT ON COLUMN public.listing_checks.attempt_count IS
  'Total check attempts for this row, including retries. Starts at 0, set to 1 on first run.';

COMMENT ON COLUMN public.listing_checks.report IS
  'Full CheckReport JSON blob returned by Claude. Includes flags, improvements, pricing_note.';


-- ── Indexes ───────────────────────────────────────────────────

-- Latest check per listing (dashboard query)
CREATE INDEX listing_checks_by_listing_idx
  ON public.listing_checks (listing_id, triggered_at DESC);

-- Worker polling: queued checks in arrival order (Phase 2 async worker)
CREATE INDEX listing_checks_queued_idx
  ON public.listing_checks (triggered_at ASC)
  WHERE status = 'queued';


-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE public.listing_checks ENABLE ROW LEVEL SECURITY;

-- Creators can read checks on their own listings
CREATE POLICY "listing_checks: creator read own"
  ON public.listing_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE  id         = listing_checks.listing_id
        AND  creator_id = auth.uid()
    )
  );

-- Admins can read and update all checks (flagged review queue)
CREATE POLICY "listing_checks: admin all"
  ON public.listing_checks FOR ALL
  USING (public.is_admin());

-- INSERT and UPDATE are performed via the service role key only
-- (API route uses createAdminClient which bypasses RLS)
-- No INSERT policy for authenticated users.

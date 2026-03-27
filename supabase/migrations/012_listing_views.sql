-- ============================================================
-- 012_listing_views.sql
-- Vibe Code Market — Listing View Tracking
-- ============================================================
-- Records each time a user (or anonymous visitor) views a
-- public listing detail page. Used for creator analytics.
-- ============================================================

-- ── Listing Views Table ───────────────────────────────────────

CREATE TABLE public.listing_views (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL = anonymous
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.listing_views             IS 'One row per listing page view. viewer_id is NULL for unauthenticated visitors.';
COMMENT ON COLUMN public.listing_views.viewer_id   IS 'NULL for anonymous visitors. Self-join with profiles for authenticated views.';
COMMENT ON COLUMN public.listing_views.viewed_at   IS 'UTC timestamp of the view event.';

-- Index for the analytics query: fetch all views for a creator's listings
CREATE INDEX idx_listing_views_listing_id ON public.listing_views (listing_id);
CREATE INDEX idx_listing_views_viewed_at  ON public.listing_views (viewed_at DESC);

-- ── Row-Level Security ────────────────────────────────────────

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert a view (fire-and-forget tracking)
CREATE POLICY "listing_views_insert_anyone"
  ON public.listing_views
  FOR INSERT
  WITH CHECK (true);

-- Creators can read views for their own listings only
CREATE POLICY "listing_views_select_creator"
  ON public.listing_views
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM public.listings
      WHERE creator_id = auth.uid()
    )
  );

-- Admins (service role) bypass RLS entirely — no policy needed

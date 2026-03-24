-- ============================================================
-- 005_reviews.sql
-- Vibe Code Market — Reviews & Rating Trigger
-- ============================================================
-- Reviews are gated behind verified purchases (enforced by RLS).
-- One review per buyer per listing.
-- The trigger keeps listings.review_count and avg_rating fresh.
-- ============================================================

CREATE TABLE public.reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  listing_id   UUID        NOT NULL REFERENCES public.listings(id)  ON DELETE CASCADE,
  reviewer_id  UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  purchase_id  UUID        NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,

  -- Content
  rating       SMALLINT    NOT NULL,
  title        TEXT,
  body         TEXT,

  -- Moderation
  is_visible   BOOLEAN     NOT NULL DEFAULT TRUE,
  flagged      BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT rating_range  CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT title_length  CHECK (title IS NULL OR char_length(title) <= 100),
  CONSTRAINT body_length   CHECK (body  IS NULL OR char_length(body)  <= 2000),

  -- One review per buyer per listing
  UNIQUE (reviewer_id, listing_id),
  -- One review per purchase
  UNIQUE (purchase_id)
);

COMMENT ON TABLE  public.reviews             IS 'Post-purchase product reviews. Gated by verified purchase via RLS.';
COMMENT ON COLUMN public.reviews.is_visible  IS 'Soft-hide for moderation without deleting.';
COMMENT ON COLUMN public.reviews.flagged     IS 'Flagged by a user for admin review.';

-- Auto-update updated_at
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Review Stats Trigger ──────────────────────────────────────
-- Keeps listings.review_count and listings.avg_rating
-- in sync whenever a visible review is inserted, updated, or deleted.

CREATE OR REPLACE FUNCTION public.update_listing_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_listing_id UUID;
BEGIN
  -- Determine which listing_id to update
  IF TG_OP = 'DELETE' THEN
    target_listing_id := OLD.listing_id;
  ELSE
    target_listing_id := NEW.listing_id;
  END IF;

  UPDATE public.listings
  SET
    review_count = (
      SELECT COUNT(*)
      FROM   public.reviews
      WHERE  listing_id = target_listing_id
        AND  is_visible = TRUE
    ),
    avg_rating = COALESCE((
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM   public.reviews
      WHERE  listing_id = target_listing_id
        AND  is_visible = TRUE
    ), 0.00)
  WHERE id = target_listing_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_review_stats();

COMMENT ON FUNCTION public.update_listing_review_stats IS
  'Recomputes review_count and avg_rating on the parent listing after any review change.';

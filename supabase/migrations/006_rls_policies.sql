-- ============================================================
-- 006_rls_policies.sql
-- Vibe Code Market — Row Level Security Policies
-- ============================================================
-- RLS is enabled on every table.
-- Policies follow the principle of least privilege:
--   • Public data is readable by anyone
--   • Private data is scoped to the authenticated owner
--   • Admin overrides use a helper function
-- ============================================================

-- ── Helper: is the current user an admin? ─────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id   = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin IS 'Returns TRUE if the current authenticated user has the admin role.';

-- ── PROFILES ──────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read any profile (public marketplace context)
CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT
  USING (TRUE);

-- Users can only insert their own profile (auth trigger handles this)
CREATE POLICY "profiles: self insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles: self update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile (e.g. to change role or suspend)
CREATE POLICY "profiles: admin update"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ── CATEGORIES ────────────────────────────────────────────────

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "categories: public read"
  ON public.categories FOR SELECT
  USING (TRUE);

-- Admin-only write
CREATE POLICY "categories: admin write"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- ── TAGS ──────────────────────────────────────────────────────

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags: public read"
  ON public.tags FOR SELECT
  USING (TRUE);

CREATE POLICY "tags: admin write"
  ON public.tags FOR ALL
  USING (public.is_admin());

-- ── LISTINGS ──────────────────────────────────────────────────

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Anyone can read published listings
CREATE POLICY "listings: public read published"
  ON public.listings FOR SELECT
  USING (status = 'published');

-- Creators can read their own listings (all statuses)
CREATE POLICY "listings: creator read own"
  ON public.listings FOR SELECT
  USING (auth.uid() = creator_id);

-- Creators can insert listings (must set themselves as creator)
CREATE POLICY "listings: creator insert"
  ON public.listings FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id   = auth.uid()
        AND role IN ('creator', 'admin')
    )
  );

-- Creators can update/delete their own listings
CREATE POLICY "listings: creator update own"
  ON public.listings FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "listings: creator delete own"
  ON public.listings FOR DELETE
  USING (auth.uid() = creator_id);

-- Admins can manage all listings (suspend, feature, etc.)
CREATE POLICY "listings: admin all"
  ON public.listings FOR ALL
  USING (public.is_admin());

-- ── LISTING TAGS ──────────────────────────────────────────────

ALTER TABLE public.listing_tags ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "listing_tags: public read"
  ON public.listing_tags FOR SELECT
  USING (TRUE);

-- Only the listing owner can manage tags for their listing
CREATE POLICY "listing_tags: owner write"
  ON public.listing_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id         = listing_tags.listing_id
        AND creator_id = auth.uid()
    )
  );

-- Admins can manage all listing tags
CREATE POLICY "listing_tags: admin all"
  ON public.listing_tags FOR ALL
  USING (public.is_admin());

-- ── PURCHASES ─────────────────────────────────────────────────

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Buyers see only their own purchases
CREATE POLICY "purchases: buyer read own"
  ON public.purchases FOR SELECT
  USING (auth.uid() = buyer_id);

-- Creators see purchases of their listings (for earnings dashboard)
CREATE POLICY "purchases: creator read listing sales"
  ON public.purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id         = purchases.listing_id
        AND creator_id = auth.uid()
    )
  );

-- Admins see all purchases
CREATE POLICY "purchases: admin read all"
  ON public.purchases FOR SELECT
  USING (public.is_admin());

-- Purchases are only inserted by the service role (Stripe webhook handler)
-- No INSERT policy for authenticated users — handled via SUPABASE_SERVICE_ROLE_KEY
-- Admins can update (e.g. mark refunded or disputed)
CREATE POLICY "purchases: admin update"
  ON public.purchases FOR UPDATE
  USING (public.is_admin());

-- ── REVIEWS ───────────────────────────────────────────────────

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible reviews
CREATE POLICY "reviews: public read visible"
  ON public.reviews FOR SELECT
  USING (is_visible = TRUE);

-- Reviewers can read their own reviews (including hidden ones)
CREATE POLICY "reviews: reviewer read own"
  ON public.reviews FOR SELECT
  USING (auth.uid() = reviewer_id);

-- Only verified buyers can insert a review (enforced via purchase check)
CREATE POLICY "reviews: verified buyer insert"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.purchases
      WHERE buyer_id   = auth.uid()
        AND listing_id = reviews.listing_id
        AND status     = 'completed'
    )
  );

-- Reviewers can update their own review (edit title/body, not rating)
CREATE POLICY "reviews: reviewer update own"
  ON public.reviews FOR UPDATE
  USING  (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Reviewers can delete their own review
CREATE POLICY "reviews: reviewer delete own"
  ON public.reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Admins can manage all reviews (hide, flag, delete)
CREATE POLICY "reviews: admin all"
  ON public.reviews FOR ALL
  USING (public.is_admin());

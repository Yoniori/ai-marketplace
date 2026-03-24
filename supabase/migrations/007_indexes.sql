-- ============================================================
-- 007_indexes.sql
-- Vibe Code Market — Performance Indexes
-- ============================================================
-- Covers: listing discovery, tag filtering, purchase lookups,
-- review aggregation, creator dashboards, and full-text search.
-- ============================================================

-- ── PROFILES ──────────────────────────────────────────────────

-- Username lookups (public profile page, @mention)
CREATE INDEX idx_profiles_username
  ON public.profiles (username);

-- Role filtering (admin dashboards)
CREATE INDEX idx_profiles_role
  ON public.profiles (role);

-- ── CATEGORIES ────────────────────────────────────────────────

CREATE INDEX idx_categories_slug
  ON public.categories (slug);

CREATE INDEX idx_categories_sort
  ON public.categories (sort_order);

-- ── TAGS ──────────────────────────────────────────────────────

CREATE INDEX idx_tags_slug
  ON public.tags (slug);

CREATE INDEX idx_tags_type
  ON public.tags (tag_type);

-- ── LISTINGS — Core Discovery ─────────────────────────────────

-- Status filter (only show published listings)
CREATE INDEX idx_listings_status
  ON public.listings (status);

-- Creator dashboard: "my listings"
CREATE INDEX idx_listings_creator_id
  ON public.listings (creator_id);

-- Category browse
CREATE INDEX idx_listings_category_id
  ON public.listings (category_id);

-- Featured listings (partial — only index the small set that are featured)
CREATE INDEX idx_listings_featured
  ON public.listings (is_featured, featured_until)
  WHERE is_featured = TRUE;

-- Sort: newest first
CREATE INDEX idx_listings_published_at
  ON public.listings (published_at DESC NULLS LAST)
  WHERE status = 'published';

-- Sort: highest rated
CREATE INDEX idx_listings_avg_rating
  ON public.listings (avg_rating DESC)
  WHERE status = 'published';

-- Sort: most popular (by purchase count)
CREATE INDEX idx_listings_purchase_count
  ON public.listings (purchase_count DESC)
  WHERE status = 'published';

-- Price range filtering
CREATE INDEX idx_listings_price_cents
  ON public.listings (price_cents)
  WHERE status = 'published';

-- Price type (free / paid / contact)
CREATE INDEX idx_listings_price_type
  ON public.listings (price_type)
  WHERE status = 'published';

-- ── LISTINGS — Full-Text Search ───────────────────────────────
-- Covers title + tagline + description for keyword search.
-- Used by: GET /api/listings?q=...

CREATE INDEX idx_listings_fts
  ON public.listings
  USING GIN (
    to_tsvector(
      'english',
      COALESCE(title, '')       || ' ' ||
      COALESCE(tagline, '')     || ' ' ||
      COALESCE(description, '')
    )
  )
  WHERE status = 'published';

-- ── LISTING TAGS ──────────────────────────────────────────────

-- Tag → listings lookup (filter by tag)
CREATE INDEX idx_listing_tags_tag_id
  ON public.listing_tags (tag_id);

-- Listing → tags lookup (load tags for a listing)
CREATE INDEX idx_listing_tags_listing_id
  ON public.listing_tags (listing_id);

-- ── PURCHASES ─────────────────────────────────────────────────

-- Buyer's purchase history
CREATE INDEX idx_purchases_buyer_id
  ON public.purchases (buyer_id);

-- Creator's sales dashboard
CREATE INDEX idx_purchases_listing_id
  ON public.purchases (listing_id);

-- Stripe webhook lookup by session ID
CREATE INDEX idx_purchases_stripe_session_id
  ON public.purchases (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Status filter (pending / completed / refunded / disputed)
CREATE INDEX idx_purchases_status
  ON public.purchases (status);

-- Access check (buyer_access view performance)
CREATE INDEX idx_purchases_access_granted
  ON public.purchases (buyer_id, listing_id)
  WHERE status = 'completed' AND access_granted = TRUE;

-- ── REVIEWS ───────────────────────────────────────────────────

-- Reviews for a listing (product page)
CREATE INDEX idx_reviews_listing_id
  ON public.reviews (listing_id)
  WHERE is_visible = TRUE;

-- Reviewer's own reviews
CREATE INDEX idx_reviews_reviewer_id
  ON public.reviews (reviewer_id);

-- Moderation queue: flagged reviews
CREATE INDEX idx_reviews_flagged
  ON public.reviews (flagged)
  WHERE flagged = TRUE;

-- ============================================================
-- 003_listings.sql
-- Vibe Code Market — Listings (Products)
-- ============================================================
-- Core product table. Creators publish listings here.
-- Buyers browse, filter, and purchase them.
-- Denormalized review_count / avg_rating updated by trigger (005).
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE public.listing_status AS ENUM (
  'draft',       -- Not yet visible to buyers
  'published',   -- Live and discoverable
  'archived',    -- Hidden by creator
  'suspended'    -- Hidden by admin
);

CREATE TYPE public.price_type AS ENUM (
  'free',        -- No purchase required; product_url granted immediately
  'paid',        -- One-time Stripe payment required
  'contact'      -- No direct purchase; buyer contacts creator
);

-- ── Listings Table ───────────────────────────────────────────

CREATE TABLE public.listings (
  id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID                  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id     INT                   REFERENCES public.categories(id) ON DELETE SET NULL,

  -- Core content
  title           TEXT                  NOT NULL,
  slug            TEXT                  NOT NULL UNIQUE,
  tagline         TEXT                  NOT NULL,    -- One-liner shown on cards (max 120 chars)
  description     TEXT                  NOT NULL,    -- Full markdown description

  -- Links
  demo_url        TEXT,                              -- Live demo / preview URL
  product_url     TEXT,                              -- Delivered to buyer after purchase

  -- Media
  thumbnail_url   TEXT,                              -- Primary card image
  gallery_urls    TEXT[]                NOT NULL DEFAULT '{}',  -- Up to 5 screenshots

  -- Pricing
  price_type      public.price_type     NOT NULL DEFAULT 'paid',
  price_cents     INT                   NOT NULL DEFAULT 0,
  currency        TEXT                  NOT NULL DEFAULT 'usd',

  -- Status & featuring
  status          public.listing_status NOT NULL DEFAULT 'draft',
  is_featured     BOOLEAN               NOT NULL DEFAULT FALSE,
  featured_until  TIMESTAMPTZ,

  -- Denormalized stats (updated by trigger in 005_reviews.sql)
  review_count    INT                   NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(3,2)          NOT NULL DEFAULT 0.00,
  purchase_count  INT                   NOT NULL DEFAULT 0,

  -- Timestamps
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT title_length     CHECK (char_length(title)   BETWEEN 3 AND 100),
  CONSTRAINT tagline_length   CHECK (char_length(tagline) BETWEEN 10 AND 120),
  CONSTRAINT slug_format      CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT price_non_neg    CHECK (price_cents >= 0),
  CONSTRAINT paid_needs_price CHECK (
    price_type != 'paid' OR price_cents > 0
  ),
  CONSTRAINT avg_rating_range CHECK (avg_rating BETWEEN 0 AND 5),
  CONSTRAINT currency_format  CHECK (currency ~ '^[a-z]{3}$')
);

COMMENT ON TABLE  public.listings                IS 'Creator product listings — the core unit of the marketplace.';
COMMENT ON COLUMN public.listings.slug           IS 'URL-safe unique identifier. Used in /listing/[slug] routes.';
COMMENT ON COLUMN public.listings.price_cents    IS 'Price in smallest currency unit (cents for USD). 0 for free listings.';
COMMENT ON COLUMN public.listings.product_url    IS 'Delivered to buyer after successful purchase or free claim.';
COMMENT ON COLUMN public.listings.gallery_urls   IS 'Array of up to 5 Supabase Storage image URLs.';
COMMENT ON COLUMN public.listings.purchase_count IS 'Denormalized. Incremented in Stripe webhook handler (Step 8).';

-- Auto-update updated_at
CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-set published_at when status changes to 'published'
CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listings_published_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_published_at();

-- Now that listings exists, add the FK for listing_tags
ALTER TABLE public.listing_tags
  ADD CONSTRAINT fk_listing_tags_listing
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

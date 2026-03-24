-- ============================================================
-- 002_categories_tags.sql
-- Vibe Code Market — Categories, Tags, and Listing Tags
-- ============================================================
-- categories  : top-level product taxonomy
-- tags        : flat tag list (built_with, general, technology)
-- listing_tags: many-to-many join between listings and tags
-- ============================================================

-- ── Categories ───────────────────────────────────────────────

CREATE TABLE public.categories (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,                          -- Emoji or icon identifier
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT category_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE public.categories IS 'Top-level product categories (e.g. AI Agent, Automation, SaaS Template).';

-- ── Tag Type Enum ─────────────────────────────────────────────

CREATE TYPE public.tag_type AS ENUM ('built_with', 'general', 'technology');

-- ── Tags ─────────────────────────────────────────────────────

CREATE TABLE public.tags (
  id         SERIAL           PRIMARY KEY,
  name       TEXT             NOT NULL UNIQUE,
  slug       TEXT             NOT NULL UNIQUE,
  tag_type   public.tag_type  NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT tag_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE  public.tags          IS 'Flat tag list for filtering. built_with tags represent vibe coding tools.';
COMMENT ON COLUMN public.tags.tag_type IS 'built_with = vibe coding tool (Claude Code, Cursor, etc.); general = topic tag; technology = tech stack.';

-- ── Listing Tags (join table — created after listings) ───────
-- NOTE: FK to listings is added in 003_listings.sql after that table exists.

CREATE TABLE public.listing_tags (
  listing_id  UUID  NOT NULL,
  tag_id      INT   NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, tag_id)
);

COMMENT ON TABLE public.listing_tags IS 'Many-to-many join between listings and tags.';

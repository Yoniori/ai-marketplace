-- ============================================================
-- 001_profiles.sql
-- Vibe Code Market — User Profiles
-- ============================================================
-- Extends Supabase auth.users with public profile data.
-- One profile per user. Created automatically via trigger (008).
-- ============================================================

CREATE TYPE public.user_role AS ENUM ('buyer', 'creator', 'admin');

CREATE TABLE public.profiles (
  -- Primary key mirrors auth.users id
  id                 UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  username           TEXT        NOT NULL UNIQUE,
  display_name       TEXT,
  bio                TEXT,
  avatar_url         TEXT,

  -- Social links
  website_url        TEXT,
  twitter_url        TEXT,
  github_url         TEXT,

  -- Role & permissions
  role               public.user_role NOT NULL DEFAULT 'buyer',

  -- Stripe Connect (populated when creator onboards)
  stripe_account_id  TEXT        UNIQUE,
  stripe_onboarded   BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT username_length   CHECK (char_length(username) BETWEEN 3 AND 30),
  CONSTRAINT username_format   CHECK (username ~ '^[a-z0-9_-]+$'),
  CONSTRAINT bio_length        CHECK (char_length(bio) <= 500)
);

COMMENT ON TABLE  public.profiles                  IS 'Public-facing user profile data extending auth.users.';
COMMENT ON COLUMN public.profiles.id               IS 'Mirrors auth.users.id — one profile per user.';
COMMENT ON COLUMN public.profiles.role             IS 'buyer = purchase only; creator = can list products; admin = full access.';
COMMENT ON COLUMN public.profiles.stripe_account_id IS 'Stripe Connect Express account ID for creator payouts.';

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

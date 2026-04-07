-- 015_built_with.sql
-- Add built_with column to listings for tool attribution

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS built_with TEXT[] DEFAULT '{}' NOT NULL;

COMMENT ON COLUMN public.listings.built_with IS
  'Array of tools used to build this listing (e.g. Claude Code, Cursor, Lovable, Bolt, v0, Replit)';

-- Allow creators to set this field via RLS (creator can update their own listing)
-- No additional RLS needed — existing listing update policy covers new column automatically

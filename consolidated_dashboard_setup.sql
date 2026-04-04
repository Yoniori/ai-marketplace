-- ============================================================================
-- CONSOLIDATED SQL SETUP: Creator Analytics Dashboard + File Uploads
-- ============================================================================
-- This script combines both migrations safely:
--   1. listing_views table + RLS (view tracking for analytics)
--   2. listing-files storage bucket + RLS (product file uploads)
--
-- Safe to run directly in Supabase SQL Editor (idempotent operations)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- Part 1: LISTING VIEWS TABLE (Analytics)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.listing_views (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE  public.listing_views             IS 'One row per listing page view. viewer_id is NULL for unauthenticated visitors.';
COMMENT ON COLUMN public.listing_views.viewer_id   IS 'NULL for anonymous visitors. Self-join with profiles for authenticated views.';
COMMENT ON COLUMN public.listing_views.viewed_at   IS 'UTC timestamp of the view event.';

-- Create indices if they don't exist
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON public.listing_views (listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_viewed_at  ON public.listing_views (viewed_at DESC);

-- Enable RLS
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate
DROP POLICY IF EXISTS "listing_views_insert_anyone" ON public.listing_views;
DROP POLICY IF EXISTS "listing_views_select_creator" ON public.listing_views;

-- Anyone (including anon) can insert a view
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

-- ────────────────────────────────────────────────────────────────────────────
-- Part 2: LISTING FILES STORAGE BUCKET + RLS
-- ────────────────────────────────────────────────────────────────────────────

-- Create the storage bucket (safe with ON CONFLICT DO NOTHING)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-files',
  'listing-files',
  false,                -- private: no public URL access
  52428800,            -- 50 MB in bytes
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "listing-files: creator insert own" ON storage.objects;
DROP POLICY IF EXISTS "listing-files: creator update own" ON storage.objects;
DROP POLICY IF EXISTS "listing-files: creator delete own" ON storage.objects;
DROP POLICY IF EXISTS "listing-files: buyer read after purchase" ON storage.objects;

-- Creators can upload into their own listing's folder
CREATE POLICY "listing-files: creator insert own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-files'
    AND EXISTS (
      SELECT 1 FROM public.listings
      WHERE id::text        = (storage.foldername(name))[1]
        AND creator_id      = auth.uid()
    )
  );

-- Creators can overwrite (re-upload) their own listing files
CREATE POLICY "listing-files: creator update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-files'
    AND EXISTS (
      SELECT 1 FROM public.listings
      WHERE id::text   = (storage.foldername(name))[1]
        AND creator_id = auth.uid()
    )
  );

-- Creators can delete their own listing files
CREATE POLICY "listing-files: creator delete own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-files'
    AND EXISTS (
      SELECT 1 FROM public.listings
      WHERE id::text   = (storage.foldername(name))[1]
        AND creator_id = auth.uid()
    )
  );

-- Buyers who have purchased a listing can download its files
CREATE POLICY "listing-files: buyer read after purchase"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'listing-files'
    AND EXISTS (
      SELECT 1 FROM public.purchases
      WHERE listing_id::text = (storage.foldername(name))[1]
        AND buyer_id         = auth.uid()
    )
  );

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- ✓ listing_views table created with RLS policies
-- ✓ listing-files storage bucket created
-- ✓ Storage access policies configured:
--   - Creators: upload, update, delete in own listing folders
--   - Buyers: read files after purchase
--   - Public: no access (private bucket)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 013_listing_files_bucket.sql
-- Private storage bucket for creator-uploaded product ZIP files.
--
-- Why private (public = false):
--   Buyers should not be able to download product files directly from Storage
--   URLs. Downloads must go through the app which verifies purchase ownership.
--   The Gatekeeper worker reads files via the service-role key (adminClient),
--   which bypasses RLS — no separate policy needed for that path.
--
-- Upload path format: {listing_id}/product.zip
-- Size limit: 50 MB (matches next.config.mjs serverActions.bodySizeLimit)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-files',
  'listing-files',
  false,                -- private: no public URL access
  52428800,            -- 50 MB in bytes
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Creators can upload into their own listing's folder.
-- Path must start with the listing_id, and the listing must belong to them.
-- Note: uploads go through adminClient (service role) in uploadListingZip(),
-- so this policy is a defence-in-depth layer, not the primary guard.
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

-- Creators can overwrite (re-upload) their own listing files.
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

-- Creators can delete their own listing files.
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

-- Buyers who have purchased a listing can download its files.
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

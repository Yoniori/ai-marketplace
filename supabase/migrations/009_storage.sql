-- ─────────────────────────────────────────────────────────────────────────────
-- 009_storage.sql
-- Avatars bucket + storage RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Create the public avatars bucket (2 MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload into their own folder: avatars/{user_id}/*
CREATE POLICY "avatars: authenticated insert own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update objects in their own folder
CREATE POLICY "avatars: authenticated update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own objects
CREATE POLICY "avatars: authenticated delete own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone (including anonymous) can read public avatars
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- 016_launch_upvotes.sql
-- Vibe Launch: daily upvoting system
-- Users can upvote any published listing once per calendar day

CREATE TABLE IF NOT EXISTS public.launch_upvotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT launch_upvotes_user_listing_date_key UNIQUE (user_id, listing_id, date)
);

-- Index for fast "how many upvotes today for listing X"
CREATE INDEX IF NOT EXISTS launch_upvotes_listing_date_idx
  ON public.launch_upvotes (listing_id, date);

-- Index for "did this user already vote for listing X today"
CREATE INDEX IF NOT EXISTS launch_upvotes_user_listing_date_idx
  ON public.launch_upvotes (user_id, listing_id, date);

-- RLS
ALTER TABLE public.launch_upvotes ENABLE ROW LEVEL SECURITY;

-- Anyone can read (to show vote counts)
CREATE POLICY "Anyone can read upvotes"
  ON public.launch_upvotes FOR SELECT
  USING (true);

-- Authenticated users can insert their own upvotes
CREATE POLICY "Users can upvote"
  ON public.launch_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own upvotes
CREATE POLICY "Users can remove own upvote"
  ON public.launch_upvotes FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.launch_upvotes IS
  'Daily upvotes for the Vibe Launch feature. One upvote per user per listing per calendar day.';

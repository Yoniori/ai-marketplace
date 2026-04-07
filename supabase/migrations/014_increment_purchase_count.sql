-- ============================================================
-- 014_increment_purchase_count.sql
-- Vibe Code Market — Atomic purchase count increment
-- ============================================================
-- Called by the Stripe webhook handler after a successful purchase.
-- Using a server-side function ensures the increment is atomic
-- and bypasses RLS (service role context).
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_purchase_count(p_listing_id UUID)
RETURNS void AS $$
  UPDATE public.listings
  SET purchase_count = purchase_count + 1
  WHERE id = p_listing_id;
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_purchase_count IS
  'Atomically increments the denormalized purchase_count on a listing. Called from Stripe webhook.';

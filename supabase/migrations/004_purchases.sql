-- ============================================================
-- 004_purchases.sql
-- Vibe Code Market — Purchases & Buyer Access
-- ============================================================
-- Records every transaction. Stripe webhook handler (Step 8)
-- inserts rows here and flips access_granted = TRUE.
-- The buyer_access view gives a fast "does buyer own this?" check.
-- ============================================================

-- ── Purchase Status Enum ──────────────────────────────────────

CREATE TYPE public.purchase_status AS ENUM (
  'pending',    -- Checkout session created, payment not yet confirmed
  'completed',  -- Payment confirmed, access granted
  'refunded',   -- Full refund issued
  'disputed'    -- Chargeback or active dispute
);

-- ── Purchases Table ───────────────────────────────────────────

CREATE TABLE public.purchases (
  id                     UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parties
  buyer_id               UUID                    NOT NULL REFERENCES public.profiles(id)  ON DELETE RESTRICT,
  listing_id             UUID                    NOT NULL REFERENCES public.listings(id)  ON DELETE RESTRICT,

  -- Stripe references
  stripe_session_id      TEXT                    UNIQUE,         -- Checkout Session ID (cs_...)
  stripe_payment_intent  TEXT,                                   -- PaymentIntent ID   (pi_...)
  stripe_charge_id       TEXT,                                   -- Charge ID          (ch_...)

  -- Financial snapshot at time of purchase
  amount_cents           INT                     NOT NULL CHECK (amount_cents > 0),
  platform_fee_cents     INT                     NOT NULL CHECK (platform_fee_cents >= 0),
  creator_payout_cents   INT                     NOT NULL CHECK (creator_payout_cents >= 0),
  currency               TEXT                    NOT NULL DEFAULT 'usd',

  -- State
  status                 public.purchase_status  NOT NULL DEFAULT 'pending',
  access_granted         BOOLEAN                 NOT NULL DEFAULT FALSE,
  access_granted_at      TIMESTAMPTZ,

  -- Timestamps
  created_at             TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  -- One completed purchase per buyer per listing
  -- (uses partial unique index below to allow pending re-tries)
  CONSTRAINT currency_format CHECK (currency ~ '^[a-z]{3}$'),
  CONSTRAINT fee_sum_check   CHECK (platform_fee_cents + creator_payout_cents = amount_cents)
);

COMMENT ON TABLE  public.purchases                     IS 'One row per transaction. Created on Stripe checkout, completed via webhook.';
COMMENT ON COLUMN public.purchases.amount_cents        IS 'Total buyer payment in cents. Snapshot at time of sale.';
COMMENT ON COLUMN public.purchases.platform_fee_cents  IS '10% platform fee retained by Vibe Code Market.';
COMMENT ON COLUMN public.purchases.creator_payout_cents IS '90% transferred to creator via Stripe Connect.';
COMMENT ON COLUMN public.purchases.access_granted      IS 'TRUE once payment confirmed. Gates product_url delivery.';

-- Prevent a buyer from having >1 completed purchase for the same listing
CREATE UNIQUE INDEX idx_purchases_one_per_buyer_listing
  ON public.purchases (buyer_id, listing_id)
  WHERE status = 'completed';

-- Auto-update updated_at
CREATE TRIGGER trg_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-set access_granted_at when access is granted
CREATE OR REPLACE FUNCTION public.set_access_granted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_granted = TRUE AND (OLD.access_granted = FALSE OR OLD.access_granted IS NULL) THEN
    NEW.access_granted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchases_access_granted_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_access_granted_at();

-- ── Buyer Access View ─────────────────────────────────────────
-- Fast "does this buyer own this listing?" lookup.
-- Used in: product page CTA, review gate, dashboard access list.

CREATE VIEW public.buyer_access AS
  SELECT
    buyer_id,
    listing_id,
    id          AS purchase_id,
    created_at  AS purchased_at
  FROM public.purchases
  WHERE status        = 'completed'
    AND access_granted = TRUE;

COMMENT ON VIEW public.buyer_access IS 'Convenience view: all (buyer_id, listing_id) pairs with granted access.';

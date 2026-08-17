-- =============================================================================
-- Production: Loyalty Rewards Catalog (MISSING OBJECTS ONLY)
-- =============================================================================
-- Source of truth (do not invent schema):
--   supabase/migrations/20260813120000_rc2_loyalty_rewards.sql
-- Also present in:
--   supabase/production/rc2_intelligence_pack.sql  (loyalty section)
--
-- Why this exists:
--   Production API error:
--     Could not find the table 'public.loyalty_rewards' in the schema cache
--   That means PostgREST cannot see public.loyalty_rewards — almost always
--   because the RC2 loyalty migration was never applied to production.
--
-- Safe / additive:
--   - CREATE TABLE IF NOT EXISTS
--   - CREATE INDEX IF NOT EXISTS
--   - CREATE OR REPLACE policies only (DROP POLICY IF EXISTS then CREATE)
--   - No DROP TABLE / DROP COLUMN / DELETE / TRUNCATE
--   - Does NOT touch public.customers or loyalty_points
--
-- Prerequisites:
--   public.restaurants exists
--   public.customers exists (loyalty_redemptions FK)
--
-- After running in Supabase SQL Editor:
--   If the API still reports schema cache miss, reload PostgREST schema:
--   Dashboard → Project Settings → API → Reload schema
--   or:  NOTIFY pgrst, 'reload schema';
-- =============================================================================

-- Loyalty Rewards Catalog
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  points_required integer NOT NULL CHECK (points_required > 0),
  image_url text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  reward_type text NOT NULL DEFAULT 'free_item'
    CHECK (reward_type IN ('free_item', 'discount', 'coupon', 'gift', 'manual')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loyalty_rewards_restaurant_idx
  ON public.loyalty_rewards (restaurant_id, status, points_required);

CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  points_spent integer NOT NULL CHECK (points_spent >= 0),
  status text NOT NULL DEFAULT 'redeemed'
    CHECK (status IN ('available', 'redeemed', 'expired', 'cancelled')),
  redeemed_at timestamptz,
  expires_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loyalty_redemptions_restaurant_idx
  ON public.loyalty_redemptions (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS loyalty_redemptions_customer_idx
  ON public.loyalty_redemptions (customer_id, status);

ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS loyalty_rewards_owner_all ON public.loyalty_rewards;
CREATE POLICY loyalty_rewards_owner_all
  ON public.loyalty_rewards
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS loyalty_redemptions_owner_all ON public.loyalty_redemptions;
CREATE POLICY loyalty_redemptions_owner_all
  ON public.loyalty_redemptions
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Post-check
DO $$
BEGIN
  IF to_regclass('public.loyalty_rewards') IS NULL THEN
    RAISE EXCEPTION 'Migration failed: public.loyalty_rewards was not created.';
  END IF;
  IF to_regclass('public.loyalty_redemptions') IS NULL THEN
    RAISE EXCEPTION 'Migration failed: public.loyalty_redemptions was not created.';
  END IF;
END $$;

-- Optional verification query (run manually after apply):
-- SELECT
--   to_regclass('public.loyalty_rewards') AS loyalty_rewards,
--   to_regclass('public.loyalty_redemptions') AS loyalty_redemptions;

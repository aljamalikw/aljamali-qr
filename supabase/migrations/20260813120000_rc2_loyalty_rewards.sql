-- RC2: Loyalty Rewards Catalog (additive — no destructive changes)
-- Professional: basic rewards. Enterprise: unlimited + analytics (enforced in app).

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

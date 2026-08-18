-- RC2: Restaurant-scoped loyalty earning rules (additive — no destructive changes)
-- NULL = platform default (1 point per currency unit on grand total).

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS loyalty_earning_settings jsonb;

COMMENT ON COLUMN public.restaurants.loyalty_earning_settings IS
  'Restaurant loyalty points earning configuration. NULL preserves platform default earning behavior.';

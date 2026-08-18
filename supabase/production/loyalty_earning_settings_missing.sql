-- =============================================================================
-- Production: Loyalty Earning Settings (MISSING OBJECT ONLY)
-- =============================================================================
-- Source of truth:
--   supabase/migrations/20260818120000_loyalty_earning_settings.sql
--
-- Safe / additive:
--   - ADD COLUMN IF NOT EXISTS only
--   - No DROP / DELETE / TRUNCATE
--   - Does not modify customer points or rewards catalog data
--
-- After running in Supabase SQL Editor:
--   NOTIFY pgrst, 'reload schema';
-- =============================================================================

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS loyalty_earning_settings jsonb;

COMMENT ON COLUMN public.restaurants.loyalty_earning_settings IS
  'Restaurant loyalty points earning configuration. NULL preserves platform default earning behavior.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'restaurants'
      AND column_name = 'loyalty_earning_settings'
  ) THEN
    RAISE EXCEPTION 'Migration failed: restaurants.loyalty_earning_settings was not created.';
  END IF;
END $$;

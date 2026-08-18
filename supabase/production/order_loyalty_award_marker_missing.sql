-- =============================================================================
-- Production: Order Loyalty Award Marker (MISSING COLUMN ONLY)
-- =============================================================================
-- Source of truth:
--   supabase/migrations/20260818143000_order_loyalty_award_marker.sql
--
-- Safe / additive:
--   - ADD COLUMN IF NOT EXISTS only
--   - No DROP / DELETE / TRUNCATE
--   - Does not retroactively award or remove points
-- =============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS loyalty_points_awarded_at timestamptz;

COMMENT ON COLUMN public.orders.loyalty_points_awarded_at IS
  'Set when loyalty points for this order have been awarded, preventing duplicate awards.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'loyalty_points_awarded_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: orders.loyalty_points_awarded_at was not created.';
  END IF;
END $$;

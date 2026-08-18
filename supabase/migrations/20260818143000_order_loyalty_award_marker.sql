-- RC2: Award loyalty points only after Accepted + Paid, exactly once per order.
-- Additive only; preserves existing balances and orders.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS loyalty_points_awarded_at timestamptz;

COMMENT ON COLUMN public.orders.loyalty_points_awarded_at IS
  'Set when loyalty points for this order have been awarded, preventing duplicate awards.';

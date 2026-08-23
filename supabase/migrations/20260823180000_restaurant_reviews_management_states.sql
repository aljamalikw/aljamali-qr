-- Persistent restaurant-side feedback management.
-- Additive only: existing rows keep their data and receive unread/open defaults.

ALTER TABLE public.restaurant_reviews
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

ALTER TABLE public.restaurant_reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'restaurant_reviews_status_check'
  ) THEN
    ALTER TABLE public.restaurant_reviews
      ADD CONSTRAINT restaurant_reviews_status_check
      CHECK (status IN ('open', 'closed'));
  END IF;
END $$;

COMMENT ON COLUMN public.restaurant_reviews.is_read IS
  'Restaurant management flag. New customer feedback starts unread.';
COMMENT ON COLUMN public.restaurant_reviews.status IS
  'Restaurant management workflow: open or closed. Closed items remain stored.';

-- Keep owner updates restaurant-scoped. Do not allow one restaurant to
-- manage another restaurant's feedback.
DROP POLICY IF EXISTS restaurant_reviews_owner_update ON public.restaurant_reviews;
CREATE POLICY restaurant_reviews_owner_update
  ON public.restaurant_reviews
  FOR UPDATE
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

NOTIFY pgrst, 'reload schema';

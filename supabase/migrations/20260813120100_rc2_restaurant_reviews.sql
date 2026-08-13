-- RC2: Restaurant Reviews & Feedback (additive — no destructive changes)

CREATE TABLE IF NOT EXISTS public.restaurant_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  feedback_type text NOT NULL DEFAULT 'public'
    CHECK (feedback_type IN ('public', 'private')),
  google_review_clicked boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS restaurant_reviews_order_unique
  ON public.restaurant_reviews (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS restaurant_reviews_restaurant_idx
  ON public.restaurant_reviews (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS restaurant_reviews_rating_idx
  ON public.restaurant_reviews (restaurant_id, rating);

ALTER TABLE public.restaurant_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS restaurant_reviews_owner_select ON public.restaurant_reviews;
CREATE POLICY restaurant_reviews_owner_select
  ON public.restaurant_reviews
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

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

-- Public insert via service role / anon for completed-order feedback.
-- Owners manage visibility; guests submit through API with order validation.
DROP POLICY IF EXISTS restaurant_reviews_anon_insert ON public.restaurant_reviews;
CREATE POLICY restaurant_reviews_anon_insert
  ON public.restaurant_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (rating >= 1 AND rating <= 5);

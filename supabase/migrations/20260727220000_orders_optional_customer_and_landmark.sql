-- Allow dine-in / takeaway orders without customer contact details.
-- Add optional delivery landmark.

alter table public.orders
  alter column customer_name drop not null;

alter table public.orders
  alter column customer_phone drop not null;

alter table public.orders
  add column if not exists landmark text;

comment on column public.orders.customer_name is
  'Optional for Dine In and Takeaway; required for Delivery at the application layer';
comment on column public.orders.customer_phone is
  'Optional for Dine In and Takeaway; required for Delivery at the application layer';
comment on column public.orders.landmark is
  'Optional delivery landmark / nearby reference';

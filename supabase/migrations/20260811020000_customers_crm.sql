-- Restaurant-scoped Customer CRM.
-- Additive only. Does not alter orders, reservations, billing, or auth.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  full_name text,
  phone text,
  email text,
  birthday date,
  notes text,
  tags text[] not null default '{}'::text[],
  loyalty_points integer not null default 0,
  total_orders integer not null default 0,
  total_reservations integer not null default 0,
  total_spent numeric(12, 3) not null default 0,
  average_order numeric(12, 3) not null default 0,
  first_visit timestamptz,
  last_visit timestamptz,
  favorite_item text,
  favorite_category text,
  -- Future loyalty: tiers, rewards, item frequency, note history, etc.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_loyalty_points_nonneg check (loyalty_points >= 0),
  constraint customers_totals_nonneg check (
    total_orders >= 0
    and total_reservations >= 0
    and total_spent >= 0
    and average_order >= 0
  ),
  constraint customers_has_identity check (
    (phone is not null and length(trim(phone)) > 0)
    or (email is not null and length(trim(email)) > 0)
  )
);

comment on table public.customers is
  'Restaurant-scoped CRM customers auto-built from orders and reservations.';
comment on column public.customers.metadata is
  'Extensible bag for loyalty tiers, rewards, item/category frequency, note history.';
comment on column public.customers.loyalty_points is
  'Current loyalty points balance. Rewards/tiers live in metadata until dedicated tables.';

create index if not exists customers_restaurant_idx
  on public.customers (restaurant_id);

create index if not exists customers_restaurant_last_visit_idx
  on public.customers (restaurant_id, last_visit desc nulls last);

create index if not exists customers_restaurant_phone_idx
  on public.customers (restaurant_id, phone)
  where phone is not null;

create index if not exists customers_restaurant_email_idx
  on public.customers (restaurant_id, lower(email))
  where email is not null;

create index if not exists customers_tags_gin_idx
  on public.customers using gin (tags);

create unique index if not exists customers_restaurant_phone_unique
  on public.customers (restaurant_id, phone)
  where phone is not null and length(trim(phone)) > 0;

create or replace function public.set_customers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_customers_updated_at();

alter table public.customers enable row level security;

drop policy if exists "Members select customers" on public.customers;
create policy "Members select customers"
on public.customers
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members insert customers" on public.customers;
create policy "Members insert customers"
on public.customers
for insert
to authenticated
with check (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

drop policy if exists "Members update customers" on public.customers;
create policy "Members update customers"
on public.customers
for update
to authenticated
using (public.is_platform_admin() or public.is_restaurant_member(restaurant_id))
with check (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

drop policy if exists "Members delete customers" on public.customers;
create policy "Members delete customers"
on public.customers
for delete
to authenticated
using (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

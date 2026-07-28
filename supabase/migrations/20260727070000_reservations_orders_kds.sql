-- Reservations, online orders, kitchen display support, restaurant staff roles prep.
-- Additive only. Preserves existing RLS helpers and owner/admin separation.

-- ---------------------------------------------------------------------------
-- Restaurant feature flags for reservations / ordering / KDS
-- ---------------------------------------------------------------------------
alter table public.restaurants
  add column if not exists reservations_enabled boolean not null default true,
  add column if not exists online_ordering_enabled boolean not null default true,
  add column if not exists kitchen_display_enabled boolean not null default true,
  add column if not exists tax_rate numeric(6, 3) not null default 0,
  add column if not exists service_charge_rate numeric(6, 3) not null default 0;

-- ---------------------------------------------------------------------------
-- Future restaurant staff roles (Kitchen / Waiter / Cashier / Manager)
-- Does NOT change profiles.role / platform admin model.
-- ---------------------------------------------------------------------------
create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null
    check (role in ('kitchen', 'waiter', 'cashier', 'manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

comment on table public.restaurant_members is
  'Restaurant staff membership for future kitchen/waiter/cashier/manager access';

create index if not exists restaurant_members_restaurant_idx
  on public.restaurant_members (restaurant_id);
create index if not exists restaurant_members_user_idx
  on public.restaurant_members (user_id);

create or replace function public.set_restaurant_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists restaurant_members_set_updated_at on public.restaurant_members;
create trigger restaurant_members_set_updated_at
before update on public.restaurant_members
for each row
execute function public.set_restaurant_members_updated_at();

create or replace function public.is_restaurant_member(p_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurant_members m
    where m.restaurant_id = p_restaurant_id
      and m.user_id = auth.uid()
      and m.is_active = true
  )
  or exists (
    select 1
    from public.restaurants r
    where r.id = p_restaurant_id
      and r.owner_id = auth.uid()
  )
  or public.is_platform_admin();
$$;

alter table public.restaurant_members enable row level security;

drop policy if exists "Owners manage restaurant members" on public.restaurant_members;
create policy "Owners manage restaurant members"
on public.restaurant_members
for all
to authenticated
using (
  public.is_platform_admin()
  or exists (
    select 1 from public.restaurants r
    where r.id = restaurant_members.restaurant_id
      and r.owner_id = auth.uid()
  )
)
with check (
  public.is_platform_admin()
  or exists (
    select 1 from public.restaurants r
    where r.id = restaurant_members.restaurant_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Members can view own membership" on public.restaurant_members;
create policy "Members can view own membership"
on public.restaurant_members
for select
to authenticated
using (user_id = auth.uid() or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Reservations
-- ---------------------------------------------------------------------------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  customer_name text not null,
  mobile_number text not null,
  email text,
  reservation_date date not null,
  reservation_time text not null,
  guests integer not null default 2 check (guests > 0),
  special_requests text,
  reservation_type text not null default 'Family'
    check (
      reservation_type in (
        'Birthday',
        'Business',
        'Family',
        'Anniversary',
        'Outdoor',
        'Indoor',
        'Smoking',
        'Non-Smoking'
      )
    ),
  status text not null default 'Pending'
    check (
      status in ('Pending', 'Confirmed', 'Completed', 'Cancelled', 'No Show')
    ),
  table_number text,
  internal_notes text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reservations is 'Public table reservations for restaurants';

create index if not exists reservations_restaurant_date_idx
  on public.reservations (restaurant_id, reservation_date desc);
create index if not exists reservations_status_idx
  on public.reservations (restaurant_id, status);
create index if not exists reservations_created_idx
  on public.reservations (created_at desc);

create or replace function public.set_reservations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row
execute function public.set_reservations_updated_at();

alter table public.reservations enable row level security;

-- Public can create reservations for active restaurants with a slug.
drop policy if exists "Anyone can create reservations" on public.reservations;
create policy "Anyone can create reservations"
on public.reservations
for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id
      and coalesce(r.is_active, true) = true
      and coalesce(r.reservations_enabled, true) = true
      and coalesce(trim(r.slug), '') <> ''
  )
);

drop policy if exists "Owners and members manage reservations" on public.reservations;
create policy "Owners and members manage reservations"
on public.reservations
for all
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- Orders + order items (online ordering + KDS)
-- ---------------------------------------------------------------------------
create sequence if not exists public.restaurant_order_number_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  order_number text not null,
  order_type text not null default 'Dine In'
    check (order_type in ('Dine In', 'Takeaway', 'Delivery')),
  status text not null default 'Pending'
    check (
      status in (
        'Pending',
        'Accepted',
        'Preparing',
        'Ready',
        'Completed',
        'Cancelled'
      )
    ),
  payment_status text not null default 'Unpaid'
    check (payment_status in ('Unpaid', 'Paid', 'Refunded', 'Failed')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_address text,
  table_number text,
  special_instructions text,
  subtotal numeric(12, 3) not null default 0,
  tax_amount numeric(12, 3) not null default 0,
  discount_amount numeric(12, 3) not null default 0,
  grand_total numeric(12, 3) not null default 0,
  currency text not null default 'KWD',
  accepted_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  kitchen_notes text,
  printer_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.orders is 'Online / dine-in orders for restaurants and kitchen display';
comment on column public.orders.printer_payload is
  'Future kitchen printer payload architecture — no printer integration yet';

create unique index if not exists orders_restaurant_order_number_uidx
  on public.orders (restaurant_id, order_number);
create index if not exists orders_restaurant_status_idx
  on public.orders (restaurant_id, status);
create index if not exists orders_restaurant_created_idx
  on public.orders (restaurant_id, created_at desc);

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_orders_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  item_name text not null,
  unit_price numeric(12, 3) not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  line_total numeric(12, 3) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_restaurant_idx
  on public.order_items (restaurant_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders"
on public.orders
for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id
      and coalesce(r.is_active, true) = true
      and coalesce(r.online_ordering_enabled, true) = true
      and coalesce(trim(r.slug), '') <> ''
  )
);

drop policy if exists "Owners and members manage orders" on public.orders;
create policy "Owners and members manage orders"
on public.orders
for all
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

-- Public may insert order items only for newly created orders they just placed.
-- Owners/members fully manage items.
drop policy if exists "Anyone can create order items" on public.order_items;
create policy "Anyone can create order items"
on public.order_items
for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.orders o
    join public.restaurants r on r.id = o.restaurant_id
    where o.id = order_id
      and o.restaurant_id = order_items.restaurant_id
      and coalesce(r.is_active, true) = true
      and coalesce(r.online_ordering_enabled, true) = true
  )
);

drop policy if exists "Owners and members manage order items" on public.order_items;
create policy "Owners and members manage order items"
on public.order_items
for all
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- Realtime publication (safe if already added)
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.order_items;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.reservations;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

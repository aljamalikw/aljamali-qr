-- Subscriptions, payments, support tickets, platform settings
-- Plus restaurant activation / plan / settings columns and admin RLS.

-- ---------------------------------------------------------------------------
-- Restaurants: safe additive columns
-- ---------------------------------------------------------------------------
alter table public.restaurants
  add column if not exists is_active boolean not null default true,
  add column if not exists subscription_plan text not null default 'Starter'
    check (subscription_plan in ('Starter', 'Professional', 'Enterprise')),
  add column if not exists restaurant_name_ar text,
  add column if not exists tagline_en text,
  add column if not exists tagline_ar text,
  add column if not exists address_en text,
  add column if not exists address_ar text,
  add column if not exists opening_hours text,
  add column if not exists whatsapp_number text,
  add column if not exists social_instagram text,
  add column if not exists social_facebook text,
  add column if not exists social_tiktok text,
  add column if not exists delivery_enabled boolean not null default false,
  add column if not exists delivery_notes text,
  add column if not exists theme_primary_color text default '#d4af37',
  add column if not exists cover_url text,
  add column if not exists languages text[] not null default array['en', 'ar']::text[],
  add column if not exists show_prices boolean not null default true,
  add column if not exists bilingual_menu boolean not null default true,
  add column if not exists whatsapp_orders boolean not null default false,
  add column if not exists table_qr_ordering boolean not null default false,
  add column if not exists show_nutrition boolean not null default false,
  add column if not exists dark_mode_default boolean not null default true;

comment on column public.restaurants.is_active is 'Platform activation flag controlled by admins';
comment on column public.restaurants.subscription_plan is 'Current billing plan label mirrored from restaurant_subscriptions';

-- Platform admins need full restaurant access for CRM / activation.
drop policy if exists "Admins can view all restaurants" on public.restaurants;
create policy "Admins can view all restaurants"
on public.restaurants
for select
to authenticated
using (public.is_platform_admin());

drop policy if exists "Admins can update all restaurants" on public.restaurants;
create policy "Admins can update all restaurants"
on public.restaurants
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- restaurant_subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.restaurant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  plan text not null default 'Starter'
    check (plan in ('Starter', 'Professional', 'Enterprise')),
  monthly_price numeric(12, 3) not null default 0,
  currency text not null default 'KWD',
  status text not null default 'trial'
    check (status in ('trial', 'active', 'expired', 'cancelled')),
  renewal_date date,
  started_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.restaurant_subscriptions is 'Billing subscriptions for restaurants';

create unique index if not exists restaurant_subscriptions_restaurant_id_uidx
  on public.restaurant_subscriptions (restaurant_id);

create index if not exists restaurant_subscriptions_status_idx
  on public.restaurant_subscriptions (status);

create or replace function public.set_restaurant_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists restaurant_subscriptions_set_updated_at
  on public.restaurant_subscriptions;
create trigger restaurant_subscriptions_set_updated_at
before update on public.restaurant_subscriptions
for each row
execute function public.set_restaurant_subscriptions_updated_at();

alter table public.restaurant_subscriptions enable row level security;

drop policy if exists "Admins manage restaurant subscriptions"
  on public.restaurant_subscriptions;
create policy "Admins manage restaurant subscriptions"
on public.restaurant_subscriptions
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view own restaurant subscription"
  on public.restaurant_subscriptions;
create policy "Owners can view own restaurant subscription"
on public.restaurant_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = restaurant_subscriptions.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

-- Seed a subscription row for existing restaurants (idempotent).
insert into public.restaurant_subscriptions (
  restaurant_id,
  plan,
  monthly_price,
  currency,
  status,
  renewal_date
)
select
  r.id,
  coalesce(nullif(r.subscription_plan, ''), 'Starter'),
  case coalesce(nullif(r.subscription_plan, ''), 'Starter')
    when 'Professional' then 49.000
    when 'Enterprise' then 99.000
    else 19.000
  end,
  coalesce(nullif(r.currency, ''), 'KWD'),
  case when r.is_active then 'active' else 'cancelled' end,
  (current_date + interval '30 days')::date
from public.restaurants r
on conflict (restaurant_id) do nothing;

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  invoice_number text,
  amount numeric(12, 3) not null default 0,
  currency text not null default 'KWD',
  payment_method text,
  status text not null default 'pending'
    check (status in ('paid', 'pending', 'overdue', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.payments is 'Restaurant billing invoices and payment records';

create index if not exists payments_restaurant_id_idx on public.payments (restaurant_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

alter table public.payments enable row level security;

drop policy if exists "Admins manage payments" on public.payments;
create policy "Admins manage payments"
on public.payments
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view own restaurant payments" on public.payments;
create policy "Owners can view own restaurant payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = payments.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- support_tickets
-- ---------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  subject text not null,
  category text,
  priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  status text not null default 'Open'
    check (status in ('Open', 'In Progress', 'Closed')),
  assigned_staff text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

comment on table public.support_tickets is 'Support tickets for restaurant owners and platform staff';

create index if not exists support_tickets_restaurant_id_idx
  on public.support_tickets (restaurant_id);
create index if not exists support_tickets_status_idx
  on public.support_tickets (status);

create or replace function public.set_support_tickets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row
execute function public.set_support_tickets_updated_at();

alter table public.support_tickets enable row level security;

drop policy if exists "Admins manage support tickets" on public.support_tickets;
create policy "Admins manage support tickets"
on public.support_tickets
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view own restaurant tickets" on public.support_tickets;
create policy "Owners can view own restaurant tickets"
on public.support_tickets
for select
to authenticated
using (
  restaurant_id is not null
  and exists (
    select 1
    from public.restaurants
    where restaurants.id = support_tickets.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can create own restaurant tickets" on public.support_tickets;
create policy "Owners can create own restaurant tickets"
on public.support_tickets
for insert
to authenticated
with check (
  restaurant_id is not null
  and created_by = auth.uid()
  and exists (
    select 1
    from public.restaurants
    where restaurants.id = support_tickets.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can update own restaurant tickets" on public.support_tickets;
create policy "Owners can update own restaurant tickets"
on public.support_tickets
for update
to authenticated
using (
  restaurant_id is not null
  and exists (
    select 1
    from public.restaurants
    where restaurants.id = support_tickets.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
)
with check (
  restaurant_id is not null
  and exists (
    select 1
    from public.restaurants
    where restaurants.id = support_tickets.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- support_ticket_replies
-- ---------------------------------------------------------------------------
create table if not exists public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  body text not null,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.support_ticket_replies is 'Threaded replies on support tickets';

create index if not exists support_ticket_replies_ticket_id_idx
  on public.support_ticket_replies (ticket_id);

alter table public.support_ticket_replies enable row level security;

drop policy if exists "Admins manage ticket replies" on public.support_ticket_replies;
create policy "Admins manage ticket replies"
on public.support_ticket_replies
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view replies on own tickets"
  on public.support_ticket_replies;
create policy "Owners can view replies on own tickets"
on public.support_ticket_replies
for select
to authenticated
using (
  exists (
    select 1
    from public.support_tickets t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = support_ticket_replies.ticket_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can reply on own tickets"
  on public.support_ticket_replies;
create policy "Owners can reply on own tickets"
on public.support_ticket_replies
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.support_tickets t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = support_ticket_replies.ticket_id
      and r.owner_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- platform_settings (single-row style)
-- ---------------------------------------------------------------------------
create table if not exists public.platform_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  platform_name text not null default 'Aljamali QR',
  brand_logo_url text,
  smtp_host text,
  smtp_port integer,
  smtp_user text,
  support_email text,
  whatsapp_number text,
  currency text not null default 'KWD',
  timezone text not null default 'Asia/Kuwait',
  updated_at timestamptz not null default now()
);

comment on table public.platform_settings is 'Single-row platform configuration for admins';

create or replace function public.set_platform_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row
execute function public.set_platform_settings_updated_at();

insert into public.platform_settings (id)
values ('00000000-0000-0000-0000-000000000001'::uuid)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "Admins manage platform settings" on public.platform_settings;
create policy "Admins manage platform settings"
on public.platform_settings
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- Admins need platform-wide scan visibility for analytics.
drop policy if exists "Admins can view all qr scans" on public.qr_code_scans;
create policy "Admins can view all qr scans"
on public.qr_code_scans
for select
to authenticated
using (public.is_platform_admin());

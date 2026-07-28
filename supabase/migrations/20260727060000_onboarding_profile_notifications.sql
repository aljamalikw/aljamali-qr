-- Onboarding, extended restaurant profile, QR advanced fields, notifications.
-- Additive only; preserves existing RLS and role separation.

-- ---------------------------------------------------------------------------
-- Restaurants: onboarding + extended profile
-- ---------------------------------------------------------------------------
alter table public.restaurants
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step integer not null default 1,
  add column if not exists restaurant_type text,
  add column if not exists owner_name text,
  add column if not exists website text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists google_maps_url text,
  add column if not exists preferred_language text default 'en',
  add column if not exists favicon_url text,
  add column if not exists menu_accent_color text default '#d4af37',
  add column if not exists font_style text default 'serif',
  add column if not exists about_us text,
  add column if not exists cuisine_type text,
  add column if not exists holiday_schedule text,
  add column if not exists gallery_urls text[] default array[]::text[],
  add column if not exists branches jsonb default '[]'::jsonb,
  add column if not exists delivery_platforms jsonb default '[]'::jsonb,
  add column if not exists tax_number text,
  add column if not exists commercial_registration text,
  add column if not exists vat_number text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords text,
  add column if not exists og_image_url text;

comment on column public.restaurants.onboarding_completed is
  'True when the owner finishes the first-time onboarding wizard';

-- Existing restaurants with a name are treated as already onboarded.
update public.restaurants
set onboarding_completed = true
where coalesce(trim(restaurant_name), '') <> ''
  and onboarding_completed = false;

-- ---------------------------------------------------------------------------
-- QR codes: advanced management fields
-- ---------------------------------------------------------------------------
alter table public.qr_codes
  add column if not exists area text,
  add column if not exists is_dynamic boolean not null default true,
  add column if not exists expires_at timestamptz,
  add column if not exists password_protected boolean not null default false,
  add column if not exists password_hint text,
  add column if not exists scan_limit integer,
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists qr_codes_restaurant_archived_idx
  on public.qr_codes (restaurant_id, is_archived)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Categories / menu items soft-delete support
-- ---------------------------------------------------------------------------
alter table public.categories
  add column if not exists deleted_at timestamptz,
  add column if not exists is_archived boolean not null default false;

alter table public.menu_items
  add column if not exists deleted_at timestamptz,
  add column if not exists is_archived boolean not null default false,
  add column if not exists discount_price numeric(12, 3);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  href text,
  is_read boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.notifications is 'In-app notification center for owners and admins';

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where is_read = false;

alter table public.notifications enable row level security;

drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications"
on public.notifications
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can insert notifications" on public.notifications;
create policy "Admins can insert notifications"
on public.notifications
for insert
to authenticated
with check (public.is_platform_admin() or user_id = auth.uid());

-- =============================================================================
-- Aljamali QR — manual schema sync (idempotent)
-- Generated from every file in supabase/migrations/
-- Safe to run multiple times. Does NOT drop tables/columns or delete data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers: drop NOT NULL only when the column currently is NOT NULL
-- ---------------------------------------------------------------------------
create or replace function public.__manual_sync_drop_not_null(
  p_schema text,
  p_table text,
  p_column text
)
returns void
language plpgsql
as $$
begin
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = p_schema
      and c.table_name = p_table
      and c.column_name = p_column
      and c.is_nullable = 'NO'
  ) then
    execute format(
      'alter table %I.%I alter column %I drop not null',
      p_schema,
      p_table,
      p_column
    );
  end if;
end;
$$;

-- =============================================================================
-- 1) TABLES (CREATE IF NOT EXISTS)
-- =============================================================================

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  restaurant_name text,
  slug text unique,
  email text,
  phone text,
  logo_url text,
  currency text not null default 'KWD',
  timezone text not null default 'Asia/Kuwait',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  is_available boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  type text not null,
  destination_url text not null,
  table_number text,
  description text,
  is_active boolean not null default true,
  scans_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qr_code_scans (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  referrer text
);

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  contact_person text not null,
  mobile_number text not null,
  email text,
  city text,
  restaurant_type text,
  branches integer not null default 1,
  preferred_date date not null,
  preferred_time text not null,
  alternate_date date,
  current_menu_type text,
  notes text,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'restaurant_owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  status text not null default 'Draft',
  publish_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  plan text not null default 'Starter',
  monthly_price numeric(12, 3) not null default 0,
  currency text not null default 'KWD',
  status text not null default 'trial',
  renewal_date date,
  started_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  invoice_number text,
  amount numeric(12, 3) not null default 0,
  currency text not null default 'KWD',
  payment_method text,
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  subject text not null,
  category text,
  priority text not null default 'Medium',
  status text not null default 'Open',
  assigned_staff text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  body text not null,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

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

create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  customer_name text not null,
  mobile_number text not null,
  email text,
  reservation_date date not null,
  reservation_time text not null,
  guests integer not null default 2,
  special_requests text,
  reservation_type text not null default 'Family',
  status text not null default 'Pending',
  table_number text,
  internal_notes text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.restaurant_order_number_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  order_number text not null,
  order_type text not null default 'Dine In',
  status text not null default 'Pending',
  payment_status text not null default 'Unpaid',
  customer_name text,
  customer_phone text,
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

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  item_name text not null,
  unit_price numeric(12, 3) not null default 0,
  quantity integer not null default 1,
  notes text,
  line_total numeric(12, 3) not null default 0,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 2) COLUMNS (ADD IF NOT EXISTS) — covers tables created by older migrations
-- =============================================================================

-- restaurants
alter table public.restaurants add column if not exists restaurant_name text;
alter table public.restaurants add column if not exists slug text;
alter table public.restaurants add column if not exists email text;
alter table public.restaurants add column if not exists phone text;
alter table public.restaurants add column if not exists logo_url text;
alter table public.restaurants add column if not exists currency text;
alter table public.restaurants add column if not exists timezone text;
alter table public.restaurants add column if not exists created_at timestamptz;
alter table public.restaurants add column if not exists updated_at timestamptz;
alter table public.restaurants add column if not exists is_active boolean not null default true;
alter table public.restaurants add column if not exists subscription_plan text not null default 'Starter';
alter table public.restaurants add column if not exists restaurant_name_ar text;
alter table public.restaurants add column if not exists tagline_en text;
alter table public.restaurants add column if not exists tagline_ar text;
alter table public.restaurants add column if not exists address_en text;
alter table public.restaurants add column if not exists address_ar text;
alter table public.restaurants add column if not exists opening_hours text;
alter table public.restaurants add column if not exists whatsapp_number text;
alter table public.restaurants add column if not exists social_instagram text;
alter table public.restaurants add column if not exists social_facebook text;
alter table public.restaurants add column if not exists social_tiktok text;
alter table public.restaurants add column if not exists delivery_enabled boolean not null default false;
alter table public.restaurants add column if not exists delivery_notes text;
alter table public.restaurants add column if not exists theme_primary_color text default '#d4af37';
alter table public.restaurants add column if not exists cover_url text;
alter table public.restaurants add column if not exists languages text[] not null default array['en', 'ar']::text[];
alter table public.restaurants add column if not exists show_prices boolean not null default true;
alter table public.restaurants add column if not exists bilingual_menu boolean not null default true;
alter table public.restaurants add column if not exists whatsapp_orders boolean not null default false;
alter table public.restaurants add column if not exists table_qr_ordering boolean not null default false;
alter table public.restaurants add column if not exists show_nutrition boolean not null default false;
alter table public.restaurants add column if not exists dark_mode_default boolean not null default true;
alter table public.restaurants add column if not exists onboarding_completed boolean not null default false;
alter table public.restaurants add column if not exists onboarding_step integer not null default 1;
alter table public.restaurants add column if not exists restaurant_type text;
alter table public.restaurants add column if not exists owner_name text;
alter table public.restaurants add column if not exists website text;
alter table public.restaurants add column if not exists city text;
alter table public.restaurants add column if not exists country text;
alter table public.restaurants add column if not exists google_maps_url text;
alter table public.restaurants add column if not exists preferred_language text default 'en';
alter table public.restaurants add column if not exists favicon_url text;
alter table public.restaurants add column if not exists menu_accent_color text default '#d4af37';
alter table public.restaurants add column if not exists font_style text default 'serif';
alter table public.restaurants add column if not exists about_us text;
alter table public.restaurants add column if not exists cuisine_type text;
alter table public.restaurants add column if not exists holiday_schedule text;
alter table public.restaurants add column if not exists gallery_urls text[] default array[]::text[];
alter table public.restaurants add column if not exists branches jsonb default '[]'::jsonb;
alter table public.restaurants add column if not exists delivery_platforms jsonb default '[]'::jsonb;
alter table public.restaurants add column if not exists tax_number text;
alter table public.restaurants add column if not exists commercial_registration text;
alter table public.restaurants add column if not exists vat_number text;
alter table public.restaurants add column if not exists seo_title text;
alter table public.restaurants add column if not exists seo_description text;
alter table public.restaurants add column if not exists seo_keywords text;
alter table public.restaurants add column if not exists og_image_url text;
alter table public.restaurants add column if not exists reservations_enabled boolean not null default true;
alter table public.restaurants add column if not exists online_ordering_enabled boolean not null default true;
alter table public.restaurants add column if not exists kitchen_display_enabled boolean not null default true;
alter table public.restaurants add column if not exists tax_rate numeric(6, 3) not null default 0;
alter table public.restaurants add column if not exists service_charge_rate numeric(6, 3) not null default 0;

-- categories
alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists display_order integer not null default 0;
alter table public.categories add column if not exists is_active boolean not null default true;
alter table public.categories add column if not exists created_at timestamptz;
alter table public.categories add column if not exists updated_at timestamptz;
alter table public.categories add column if not exists deleted_at timestamptz;
alter table public.categories add column if not exists is_archived boolean not null default false;

-- menu_items
alter table public.menu_items add column if not exists category_id uuid;
alter table public.menu_items add column if not exists description text;
alter table public.menu_items add column if not exists image_url text;
alter table public.menu_items add column if not exists is_available boolean not null default true;
alter table public.menu_items add column if not exists display_order integer not null default 0;
alter table public.menu_items add column if not exists created_at timestamptz;
alter table public.menu_items add column if not exists updated_at timestamptz;
alter table public.menu_items add column if not exists deleted_at timestamptz;
alter table public.menu_items add column if not exists is_archived boolean not null default false;
alter table public.menu_items add column if not exists discount_price numeric(12, 3);

-- qr_codes
alter table public.qr_codes add column if not exists table_number text;
alter table public.qr_codes add column if not exists description text;
alter table public.qr_codes add column if not exists is_active boolean not null default true;
alter table public.qr_codes add column if not exists scans_count integer not null default 0;
alter table public.qr_codes add column if not exists created_at timestamptz;
alter table public.qr_codes add column if not exists updated_at timestamptz;
alter table public.qr_codes add column if not exists area text;
alter table public.qr_codes add column if not exists is_dynamic boolean not null default true;
alter table public.qr_codes add column if not exists expires_at timestamptz;
alter table public.qr_codes add column if not exists password_protected boolean not null default false;
alter table public.qr_codes add column if not exists password_hint text;
alter table public.qr_codes add column if not exists scan_limit integer;
alter table public.qr_codes add column if not exists is_archived boolean not null default false;
alter table public.qr_codes add column if not exists archived_at timestamptz;
alter table public.qr_codes add column if not exists deleted_at timestamptz;
-- App-compatible aliases used by lib/qr-codes (additive; migrations used area/is_dynamic/password_hint)
alter table public.qr_codes add column if not exists table_area text;
alter table public.qr_codes add column if not exists qr_mode text;
alter table public.qr_codes add column if not exists access_password text;

-- qr_code_scans
alter table public.qr_code_scans add column if not exists ip_address text;
alter table public.qr_code_scans add column if not exists user_agent text;
alter table public.qr_code_scans add column if not exists referrer text;
alter table public.qr_code_scans add column if not exists scanned_at timestamptz;

-- demo_requests
alter table public.demo_requests add column if not exists email text;
alter table public.demo_requests add column if not exists city text;
alter table public.demo_requests add column if not exists restaurant_type text;
alter table public.demo_requests add column if not exists branches integer not null default 1;
alter table public.demo_requests add column if not exists alternate_date date;
alter table public.demo_requests add column if not exists current_menu_type text;
alter table public.demo_requests add column if not exists notes text;
alter table public.demo_requests add column if not exists status text not null default 'New';
alter table public.demo_requests add column if not exists created_at timestamptz;
alter table public.demo_requests add column if not exists updated_at timestamptz;
alter table public.demo_requests add column if not exists internal_notes text;
alter table public.demo_requests add column if not exists last_contacted_at timestamptz;
alter table public.demo_requests add column if not exists next_follow_up_at timestamptz;
alter table public.demo_requests add column if not exists follow_up_notes text;
alter table public.demo_requests add column if not exists is_archived boolean not null default false;
alter table public.demo_requests add column if not exists archived_at timestamptz;
alter table public.demo_requests add column if not exists deleted_at timestamptz;
alter table public.demo_requests add column if not exists priority text not null default 'Medium';
alter table public.demo_requests add column if not exists assigned_salesperson text;

-- profiles
alter table public.profiles add column if not exists role text not null default 'restaurant_owner';
alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;

-- announcements
alter table public.announcements add column if not exists status text not null default 'Draft';
alter table public.announcements add column if not exists publish_at timestamptz;
alter table public.announcements add column if not exists expires_at timestamptz;
alter table public.announcements add column if not exists created_at timestamptz;
alter table public.announcements add column if not exists updated_at timestamptz;

-- restaurant_subscriptions
alter table public.restaurant_subscriptions add column if not exists plan text not null default 'Starter';
alter table public.restaurant_subscriptions add column if not exists monthly_price numeric(12, 3) not null default 0;
alter table public.restaurant_subscriptions add column if not exists currency text not null default 'KWD';
alter table public.restaurant_subscriptions add column if not exists status text not null default 'trial';
alter table public.restaurant_subscriptions add column if not exists renewal_date date;
alter table public.restaurant_subscriptions add column if not exists started_at timestamptz;
alter table public.restaurant_subscriptions add column if not exists cancelled_at timestamptz;
alter table public.restaurant_subscriptions add column if not exists created_at timestamptz;
alter table public.restaurant_subscriptions add column if not exists updated_at timestamptz;

-- payments
alter table public.payments add column if not exists invoice_number text;
alter table public.payments add column if not exists amount numeric(12, 3) not null default 0;
alter table public.payments add column if not exists currency text not null default 'KWD';
alter table public.payments add column if not exists payment_method text;
alter table public.payments add column if not exists status text not null default 'pending';
alter table public.payments add column if not exists paid_at timestamptz;
alter table public.payments add column if not exists created_at timestamptz;

-- support_tickets
alter table public.support_tickets add column if not exists category text;
alter table public.support_tickets add column if not exists priority text not null default 'Medium';
alter table public.support_tickets add column if not exists status text not null default 'Open';
alter table public.support_tickets add column if not exists assigned_staff text;
alter table public.support_tickets add column if not exists created_by uuid;
alter table public.support_tickets add column if not exists created_at timestamptz;
alter table public.support_tickets add column if not exists updated_at timestamptz;
alter table public.support_tickets add column if not exists closed_at timestamptz;

-- support_ticket_replies
alter table public.support_ticket_replies add column if not exists author_id uuid;
alter table public.support_ticket_replies add column if not exists created_at timestamptz;

-- platform_settings
alter table public.platform_settings add column if not exists platform_name text not null default 'Aljamali QR';
alter table public.platform_settings add column if not exists brand_logo_url text;
alter table public.platform_settings add column if not exists smtp_host text;
alter table public.platform_settings add column if not exists smtp_port integer;
alter table public.platform_settings add column if not exists smtp_user text;
alter table public.platform_settings add column if not exists support_email text;
alter table public.platform_settings add column if not exists whatsapp_number text;
alter table public.platform_settings add column if not exists currency text not null default 'KWD';
alter table public.platform_settings add column if not exists timezone text not null default 'Asia/Kuwait';
alter table public.platform_settings add column if not exists updated_at timestamptz;

-- notifications
alter table public.notifications add column if not exists restaurant_id uuid;
alter table public.notifications add column if not exists href text;
alter table public.notifications add column if not exists is_read boolean not null default false;
alter table public.notifications add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists created_at timestamptz;

-- restaurant_members
alter table public.restaurant_members add column if not exists is_active boolean not null default true;
alter table public.restaurant_members add column if not exists created_at timestamptz;
alter table public.restaurant_members add column if not exists updated_at timestamptz;

-- reservations
alter table public.reservations add column if not exists email text;
alter table public.reservations add column if not exists special_requests text;
alter table public.reservations add column if not exists reservation_type text not null default 'Family';
alter table public.reservations add column if not exists status text not null default 'Pending';
alter table public.reservations add column if not exists table_number text;
alter table public.reservations add column if not exists internal_notes text;
alter table public.reservations add column if not exists confirmed_at timestamptz;
alter table public.reservations add column if not exists cancelled_at timestamptz;
alter table public.reservations add column if not exists created_at timestamptz;
alter table public.reservations add column if not exists updated_at timestamptz;
alter table public.reservations add column if not exists guests integer not null default 2;

-- orders
alter table public.orders add column if not exists order_type text not null default 'Dine In';
alter table public.orders add column if not exists status text not null default 'Pending';
alter table public.orders add column if not exists payment_status text not null default 'Unpaid';
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists table_number text;
alter table public.orders add column if not exists special_instructions text;
alter table public.orders add column if not exists subtotal numeric(12, 3) not null default 0;
alter table public.orders add column if not exists tax_amount numeric(12, 3) not null default 0;
alter table public.orders add column if not exists discount_amount numeric(12, 3) not null default 0;
alter table public.orders add column if not exists grand_total numeric(12, 3) not null default 0;
alter table public.orders add column if not exists currency text not null default 'KWD';
alter table public.orders add column if not exists accepted_at timestamptz;
alter table public.orders add column if not exists preparing_at timestamptz;
alter table public.orders add column if not exists ready_at timestamptz;
alter table public.orders add column if not exists completed_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists kitchen_notes text;
alter table public.orders add column if not exists printer_payload jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists created_at timestamptz;
alter table public.orders add column if not exists updated_at timestamptz;
alter table public.orders add column if not exists landmark text;

-- Make contact fields nullable (final intended state)
select public.__manual_sync_drop_not_null('public', 'orders', 'customer_name');
select public.__manual_sync_drop_not_null('public', 'orders', 'customer_phone');

-- order_items
alter table public.order_items add column if not exists menu_item_id uuid;
alter table public.order_items add column if not exists notes text;
alter table public.order_items add column if not exists unit_price numeric(12, 3) not null default 0;
alter table public.order_items add column if not exists quantity integer not null default 1;
alter table public.order_items add column if not exists line_total numeric(12, 3) not null default 0;
alter table public.order_items add column if not exists created_at timestamptz;

-- =============================================================================
-- 3) INDEXES (IF NOT EXISTS)
-- =============================================================================

create index if not exists restaurants_owner_id_idx on public.restaurants (owner_id);
create unique index if not exists restaurants_owner_id_unique on public.restaurants (owner_id);
create unique index if not exists restaurants_slug_key on public.restaurants (slug);

create index if not exists categories_restaurant_id_idx on public.categories (restaurant_id);
create index if not exists categories_display_order_idx on public.categories (display_order);

create index if not exists menu_items_restaurant_id_idx on public.menu_items (restaurant_id);
create index if not exists menu_items_category_id_idx on public.menu_items (category_id);
create index if not exists menu_items_display_order_idx on public.menu_items (display_order);

create index if not exists qr_codes_restaurant_id_idx on public.qr_codes (restaurant_id);
create index if not exists qr_codes_created_at_idx on public.qr_codes (created_at desc);
create index if not exists qr_codes_restaurant_archived_idx
  on public.qr_codes (restaurant_id, is_archived)
  where deleted_at is null;

create index if not exists qr_code_scans_qr_code_id_idx on public.qr_code_scans (qr_code_id);
create index if not exists qr_code_scans_restaurant_id_idx on public.qr_code_scans (restaurant_id);
create index if not exists qr_code_scans_scanned_at_idx on public.qr_code_scans (scanned_at desc);
create index if not exists qr_code_scans_restaurant_scanned_at_idx
  on public.qr_code_scans (restaurant_id, scanned_at desc);

create index if not exists demo_requests_created_at_idx on public.demo_requests (created_at desc);
create index if not exists demo_requests_status_idx on public.demo_requests (status);
create index if not exists demo_requests_preferred_date_idx on public.demo_requests (preferred_date);
create index if not exists demo_requests_is_archived_idx
  on public.demo_requests (is_archived)
  where deleted_at is null;
create index if not exists demo_requests_deleted_at_idx on public.demo_requests (deleted_at);
create index if not exists demo_requests_next_follow_up_at_idx
  on public.demo_requests (next_follow_up_at)
  where deleted_at is null and is_archived = false;

create index if not exists profiles_role_idx on public.profiles (role);

create unique index if not exists restaurant_subscriptions_restaurant_id_uidx
  on public.restaurant_subscriptions (restaurant_id);
create index if not exists restaurant_subscriptions_status_idx
  on public.restaurant_subscriptions (status);

create index if not exists payments_restaurant_id_idx on public.payments (restaurant_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

create index if not exists support_tickets_restaurant_id_idx on public.support_tickets (restaurant_id);
create index if not exists support_tickets_status_idx on public.support_tickets (status);

create index if not exists support_ticket_replies_ticket_id_idx
  on public.support_ticket_replies (ticket_id);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where is_read = false;

create index if not exists restaurant_members_restaurant_idx on public.restaurant_members (restaurant_id);
create index if not exists restaurant_members_user_idx on public.restaurant_members (user_id);

create index if not exists reservations_restaurant_date_idx
  on public.reservations (restaurant_id, reservation_date desc);
create index if not exists reservations_status_idx
  on public.reservations (restaurant_id, status);
create index if not exists reservations_created_idx
  on public.reservations (created_at desc);

create unique index if not exists orders_restaurant_order_number_uidx
  on public.orders (restaurant_id, order_number);
create index if not exists orders_restaurant_status_idx
  on public.orders (restaurant_id, status);
create index if not exists orders_restaurant_created_idx
  on public.orders (restaurant_id, created_at desc);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_restaurant_idx on public.order_items (restaurant_id);

-- =============================================================================
-- 4) FUNCTIONS (CREATE OR REPLACE)
-- =============================================================================

create or replace function public.set_restaurants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_restaurant_for_owner(
  p_owner_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_email text;
  v_created_at timestamptz;
begin
  select email, created_at
  into v_user_email, v_created_at
  from auth.users
  where id = p_owner_id;

  if not found then
    raise exception 'User not found';
  end if;

  if lower(trim(v_user_email)) is distinct from lower(trim(p_email)) then
    raise exception 'Email does not match user';
  end if;

  if v_created_at < now() - interval '10 minutes' then
    raise exception 'Registration window expired';
  end if;

  if exists (
    select 1
    from public.restaurants
    where owner_id = p_owner_id
  ) then
    return;
  end if;

  insert into public.restaurants (owner_id, email)
  values (p_owner_id, p_email);
end;
$$;

revoke all on function public.create_restaurant_for_owner(uuid, text) from public;
grant execute on function public.create_restaurant_for_owner(uuid, text) to anon, authenticated;

create or replace function public.set_categories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_menu_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_qr_codes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.record_qr_scan(
  p_qr_code_id uuid,
  p_ip_address text default null,
  p_user_agent text default null,
  p_referrer text default null
)
returns table (
  destination_url text,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qr public.qr_codes%rowtype;
begin
  select *
  into v_qr
  from public.qr_codes
  where id = p_qr_code_id;

  if not found then
    raise exception 'QR code not found';
  end if;

  if v_qr.is_active then
    insert into public.qr_code_scans (
      qr_code_id,
      restaurant_id,
      ip_address,
      user_agent,
      referrer
    )
    values (
      p_qr_code_id,
      v_qr.restaurant_id,
      p_ip_address,
      p_user_agent,
      p_referrer
    );

    update public.qr_codes
    set scans_count = scans_count + 1
    where id = p_qr_code_id;
  end if;

  return query
  select v_qr.destination_url, v_qr.is_active;
end;
$$;

revoke all on function public.record_qr_scan(uuid, text, text, text) from public;
grant execute on function public.record_qr_scan(uuid, text, text, text) to anon, authenticated;

create or replace function public.get_qr_scan_summaries(
  p_restaurant_id uuid,
  p_today_start timestamptz
)
returns table (
  qr_code_id uuid,
  today_scans bigint,
  last_scan timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    qr_code_id,
    count(*) filter (where scanned_at >= p_today_start) as today_scans,
    max(scanned_at) as last_scan
  from public.qr_code_scans
  where restaurant_id = p_restaurant_id
  group by qr_code_id;
$$;

grant execute on function public.get_qr_scan_summaries(uuid, timestamptz) to authenticated;

create or replace function public.set_demo_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'restaurant_owner')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.set_announcements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_restaurant_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_support_tickets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_platform_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_restaurant_members_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create or replace function public.set_reservations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 5) TRIGGERS
-- =============================================================================

drop trigger if exists restaurants_set_updated_at on public.restaurants;
create trigger restaurants_set_updated_at
before update on public.restaurants
for each row
execute function public.set_restaurants_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_categories_updated_at();

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
before update on public.menu_items
for each row
execute function public.set_menu_items_updated_at();

drop trigger if exists qr_codes_set_updated_at on public.qr_codes;
create trigger qr_codes_set_updated_at
before update on public.qr_codes
for each row
execute function public.set_qr_codes_updated_at();

drop trigger if exists demo_requests_set_updated_at on public.demo_requests;
create trigger demo_requests_set_updated_at
before update on public.demo_requests
for each row
execute function public.set_demo_requests_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row
execute function public.set_announcements_updated_at();

drop trigger if exists restaurant_subscriptions_set_updated_at
  on public.restaurant_subscriptions;
create trigger restaurant_subscriptions_set_updated_at
before update on public.restaurant_subscriptions
for each row
execute function public.set_restaurant_subscriptions_updated_at();

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row
execute function public.set_support_tickets_updated_at();

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row
execute function public.set_platform_settings_updated_at();

drop trigger if exists restaurant_members_set_updated_at on public.restaurant_members;
create trigger restaurant_members_set_updated_at
before update on public.restaurant_members
for each row
execute function public.set_restaurant_members_updated_at();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row
execute function public.set_reservations_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_orders_updated_at();

-- =============================================================================
-- 6) ROW LEVEL SECURITY
-- =============================================================================

alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.qr_codes enable row level security;
alter table public.qr_code_scans enable row level security;
alter table public.demo_requests enable row level security;
alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.restaurant_subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_replies enable row level security;
alter table public.platform_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- =============================================================================
-- 7) POLICIES (DROP IF EXISTS + CREATE)
-- =============================================================================

-- restaurants
drop policy if exists "Users can view their own restaurant" on public.restaurants;
create policy "Users can view their own restaurant"
on public.restaurants for select to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Users can create their own restaurant" on public.restaurants;
create policy "Users can create their own restaurant"
on public.restaurants for insert to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own restaurant" on public.restaurants;
create policy "Users can update their own restaurant"
on public.restaurants for update to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Users can delete their own restaurant" on public.restaurants;
create policy "Users can delete their own restaurant"
on public.restaurants for delete to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Public can view restaurants by slug" on public.restaurants;
create policy "Public can view restaurants by slug"
on public.restaurants for select to anon, authenticated
using (slug is not null);

drop policy if exists "Admins can view all restaurants" on public.restaurants;
create policy "Admins can view all restaurants"
on public.restaurants for select to authenticated
using (public.is_platform_admin());

drop policy if exists "Admins can update all restaurants" on public.restaurants;
create policy "Admins can update all restaurants"
on public.restaurants for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- categories
drop policy if exists "Users can view their own restaurant categories" on public.categories;
create policy "Users can view their own restaurant categories"
on public.categories for select to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Users can create categories for their own restaurant" on public.categories;
create policy "Users can create categories for their own restaurant"
on public.categories for insert to authenticated
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Users can update their own restaurant categories" on public.categories;
create policy "Users can update their own restaurant categories"
on public.categories for update to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own restaurant categories" on public.categories;
create policy "Users can delete their own restaurant categories"
on public.categories for delete to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Public can view active categories" on public.categories;
create policy "Public can view active categories"
on public.categories for select to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.restaurants r
    where r.id = categories.restaurant_id
      and r.slug is not null
  )
);

-- menu_items
drop policy if exists "Users can view their own restaurant menu items" on public.menu_items;
create policy "Users can view their own restaurant menu items"
on public.menu_items for select to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Users can create menu items for their own restaurant" on public.menu_items;
create policy "Users can create menu items for their own restaurant"
on public.menu_items for insert to authenticated
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Users can update their own restaurant menu items" on public.menu_items;
create policy "Users can update their own restaurant menu items"
on public.menu_items for update to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own restaurant menu items" on public.menu_items;
create policy "Users can delete their own restaurant menu items"
on public.menu_items for delete to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Public can view available menu items" on public.menu_items;
create policy "Public can view available menu items"
on public.menu_items for select to anon, authenticated
using (
  is_available = true
  and exists (
    select 1 from public.restaurants r
    where r.id = menu_items.restaurant_id
      and r.slug is not null
  )
);

-- qr_codes
drop policy if exists "Users can view their own restaurant qr codes" on public.qr_codes;
create policy "Users can view their own restaurant qr codes"
on public.qr_codes for select to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Users can create qr codes for their own restaurant" on public.qr_codes;
create policy "Users can create qr codes for their own restaurant"
on public.qr_codes for insert to authenticated
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Users can update their own restaurant qr codes" on public.qr_codes;
create policy "Users can update their own restaurant qr codes"
on public.qr_codes for update to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own restaurant qr codes" on public.qr_codes;
create policy "Users can delete their own restaurant qr codes"
on public.qr_codes for delete to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

-- qr_code_scans
drop policy if exists "Users can view scans for their own restaurants" on public.qr_code_scans;
create policy "Users can view scans for their own restaurants"
on public.qr_code_scans for select to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = qr_code_scans.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Admins can view all qr scans" on public.qr_code_scans;
create policy "Admins can view all qr scans"
on public.qr_code_scans for select to authenticated
using (public.is_platform_admin());

-- demo_requests (final admin-restricted set + public insert)
drop policy if exists "Anonymous users can submit demo requests" on public.demo_requests;
create policy "Anonymous users can submit demo requests"
on public.demo_requests for insert to anon
with check (true);

drop policy if exists "Authenticated users can view demo requests" on public.demo_requests;
drop policy if exists "Authenticated users can create demo requests" on public.demo_requests;
drop policy if exists "Authenticated users can update demo requests" on public.demo_requests;
drop policy if exists "Authenticated users can delete demo requests" on public.demo_requests;

drop policy if exists "Admins can view demo requests" on public.demo_requests;
create policy "Admins can view demo requests"
on public.demo_requests for select to authenticated
using (public.is_platform_admin());

drop policy if exists "Admins can create demo requests" on public.demo_requests;
create policy "Admins can create demo requests"
on public.demo_requests for insert to authenticated
with check (public.is_platform_admin());

drop policy if exists "Admins can update demo requests" on public.demo_requests;
create policy "Admins can update demo requests"
on public.demo_requests for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Admins can delete demo requests" on public.demo_requests;
create policy "Admins can delete demo requests"
on public.demo_requests for delete to authenticated
using (public.is_platform_admin());

-- profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select to authenticated
using (auth.uid() = id or public.is_platform_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- announcements
drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
on public.announcements for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view published announcements" on public.announcements;
create policy "Owners can view published announcements"
on public.announcements for select to authenticated
using (
  status = 'Published'
  and (publish_at is null or publish_at <= now())
  and (expires_at is null or expires_at > now())
);

-- restaurant_subscriptions
drop policy if exists "Admins manage restaurant subscriptions" on public.restaurant_subscriptions;
create policy "Admins manage restaurant subscriptions"
on public.restaurant_subscriptions for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view own restaurant subscription" on public.restaurant_subscriptions;
create policy "Owners can view own restaurant subscription"
on public.restaurant_subscriptions for select to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = restaurant_subscriptions.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

-- payments
drop policy if exists "Admins manage payments" on public.payments;
create policy "Admins manage payments"
on public.payments for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view own restaurant payments" on public.payments;
create policy "Owners can view own restaurant payments"
on public.payments for select to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = payments.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

-- support_tickets
drop policy if exists "Admins manage support tickets" on public.support_tickets;
create policy "Admins manage support tickets"
on public.support_tickets for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view own restaurant tickets" on public.support_tickets;
create policy "Owners can view own restaurant tickets"
on public.support_tickets for select to authenticated
using (
  restaurant_id is not null
  and exists (
    select 1 from public.restaurants
    where restaurants.id = support_tickets.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can create own restaurant tickets" on public.support_tickets;
create policy "Owners can create own restaurant tickets"
on public.support_tickets for insert to authenticated
with check (
  restaurant_id is not null
  and created_by = auth.uid()
  and exists (
    select 1 from public.restaurants
    where restaurants.id = support_tickets.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can update own restaurant tickets" on public.support_tickets;
create policy "Owners can update own restaurant tickets"
on public.support_tickets for update to authenticated
using (
  restaurant_id is not null
  and exists (
    select 1 from public.restaurants
    where restaurants.id = support_tickets.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
)
with check (
  restaurant_id is not null
  and exists (
    select 1 from public.restaurants
    where restaurants.id = support_tickets.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

-- support_ticket_replies
drop policy if exists "Admins manage ticket replies" on public.support_ticket_replies;
create policy "Admins manage ticket replies"
on public.support_ticket_replies for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view replies on own tickets" on public.support_ticket_replies;
create policy "Owners can view replies on own tickets"
on public.support_ticket_replies for select to authenticated
using (
  exists (
    select 1
    from public.support_tickets t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = support_ticket_replies.ticket_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can reply on own tickets" on public.support_ticket_replies;
create policy "Owners can reply on own tickets"
on public.support_ticket_replies for insert to authenticated
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

-- platform_settings
drop policy if exists "Admins manage platform settings" on public.platform_settings;
create policy "Admins manage platform settings"
on public.platform_settings for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- notifications
drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications"
on public.notifications for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can insert notifications" on public.notifications;
create policy "Admins can insert notifications"
on public.notifications for insert to authenticated
with check (public.is_platform_admin() or user_id = auth.uid());

drop policy if exists "Public can notify owners of new orders" on public.notifications;
create policy "Public can notify owners of new orders"
on public.notifications for insert to anon, authenticated
with check (
  type in ('new_order', 'new_reservation')
  and exists (
    select 1 from public.restaurants r
    where r.id = notifications.restaurant_id
      and r.owner_id = notifications.user_id
      and coalesce(r.is_active, true) = true
  )
);

-- restaurant_members
drop policy if exists "Owners manage restaurant members" on public.restaurant_members;
create policy "Owners manage restaurant members"
on public.restaurant_members for all to authenticated
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
on public.restaurant_members for select to authenticated
using (user_id = auth.uid() or public.is_platform_admin());

-- reservations
drop policy if exists "Anyone can create reservations" on public.reservations;
create policy "Anyone can create reservations"
on public.reservations for insert to anon, authenticated
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
on public.reservations for all to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

-- orders
drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders"
on public.orders for insert to anon, authenticated
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
on public.orders for all to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

-- order_items
drop policy if exists "Anyone can create order items" on public.order_items;
create policy "Anyone can create order items"
on public.order_items for insert to anon, authenticated
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
on public.order_items for all to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

-- =============================================================================
-- 8) SEED / BACKFILL (safe, no overwrites of existing meaningful data)
-- =============================================================================

insert into public.profiles (id, role)
select id, 'restaurant_owner'
from auth.users
on conflict (id) do nothing;

insert into public.platform_settings (id)
values ('00000000-0000-0000-0000-000000000001'::uuid)
on conflict (id) do nothing;

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
    when 'Professional' then 15.000
    when 'Enterprise' then 0.000
    else 8.000
  end,
  coalesce(nullif(r.currency, ''), 'KWD'),
  case when r.is_active then 'active' else 'cancelled' end,
  (current_date + interval '30 days')::date
from public.restaurants r
on conflict (restaurant_id) do nothing;

update public.restaurants
set onboarding_completed = true
where coalesce(trim(restaurant_name), '') <> ''
  and onboarding_completed = false;

-- Copy migration QR aliases into app-compatible columns when empty
update public.qr_codes
set table_area = coalesce(nullif(trim(table_area), ''), nullif(trim(area), ''))
where coalesce(nullif(trim(table_area), ''), '') = ''
  and coalesce(nullif(trim(area), ''), '') <> '';

update public.qr_codes
set qr_mode = case
  when coalesce(qr_mode, '') <> '' then qr_mode
  when is_dynamic is false then 'permanent'
  else 'dynamic'
end
where coalesce(qr_mode, '') = '';

-- =============================================================================
-- 9) REALTIME PUBLICATION (safe if already added)
-- =============================================================================

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

-- =============================================================================
-- 10) CLEANUP HELPER
-- =============================================================================

drop function if exists public.__manual_sync_drop_not_null(text, text, text);

-- Done.

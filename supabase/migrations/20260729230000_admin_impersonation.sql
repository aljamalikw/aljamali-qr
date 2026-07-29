-- Secure Super Admin impersonation + platform-admin access for owner dashboard tables.

create table if not exists public.admin_impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  restaurant_name text,
  token_hash text not null unique,
  reason text,
  ip_address text,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ended_at timestamptz
);

create index if not exists admin_impersonation_sessions_admin_active_idx
  on public.admin_impersonation_sessions (admin_user_id)
  where ended_at is null;

create index if not exists admin_impersonation_sessions_token_hash_idx
  on public.admin_impersonation_sessions (token_hash);

create table if not exists public.admin_impersonation_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  restaurant_name text,
  action text not null check (action in ('start', 'exit', 'login_link')),
  reason text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists admin_impersonation_logs_created_idx
  on public.admin_impersonation_logs (created_at desc);

alter table public.admin_impersonation_sessions enable row level security;
alter table public.admin_impersonation_logs enable row level security;

-- No direct client policies — access only via service role from API routes.

-- Allow platform admins to operate owner dashboard tables while impersonating.
drop policy if exists "Admins can manage all categories" on public.categories;
create policy "Admins can manage all categories"
on public.categories
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Admins can manage all menu items" on public.menu_items;
create policy "Admins can manage all menu items"
on public.menu_items
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Admins can manage all qr codes" on public.qr_codes;
create policy "Admins can manage all qr codes"
on public.qr_codes
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

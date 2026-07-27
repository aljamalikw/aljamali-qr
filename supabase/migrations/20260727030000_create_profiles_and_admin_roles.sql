-- Multi-role profiles for Aljamali QR
-- Roles: restaurant_owner (default), admin, sales, support, super_admin

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'restaurant_owner'
    check (
      role in (
        'restaurant_owner',
        'admin',
        'sales',
        'support',
        'super_admin'
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Platform roles for restaurant owners and Aljamali staff';
comment on column public.profiles.role is 'Application role used for route and RLS authorization';

create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

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

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

insert into public.profiles (id, role)
select id, 'restaurant_owner'
from auth.users
on conflict (id) do nothing;

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

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_platform_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- Restrict demo request management to platform admins only.
drop policy if exists "Authenticated users can view demo requests" on public.demo_requests;
drop policy if exists "Authenticated users can create demo requests" on public.demo_requests;
drop policy if exists "Authenticated users can update demo requests" on public.demo_requests;
drop policy if exists "Authenticated users can delete demo requests" on public.demo_requests;

create policy "Admins can view demo requests"
on public.demo_requests
for select
to authenticated
using (public.is_platform_admin());

create policy "Admins can create demo requests"
on public.demo_requests
for insert
to authenticated
with check (public.is_platform_admin());

create policy "Admins can update demo requests"
on public.demo_requests
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Admins can delete demo requests"
on public.demo_requests
for delete
to authenticated
using (public.is_platform_admin());

-- Initial restaurants schema for Aljamali QR
-- Run via Supabase SQL editor or: supabase db push

create table public.restaurants (
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

comment on table public.restaurants is 'Restaurant profiles owned by authenticated users';

create index restaurants_owner_id_idx on public.restaurants (owner_id);

create or replace function public.set_restaurants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_set_updated_at
before update on public.restaurants
for each row
execute function public.set_restaurants_updated_at();

alter table public.restaurants enable row level security;

create policy "Users can view their own restaurant"
on public.restaurants
for select
to authenticated
using (auth.uid() = owner_id);

create policy "Users can create their own restaurant"
on public.restaurants
for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "Users can update their own restaurant"
on public.restaurants
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Users can delete their own restaurant"
on public.restaurants
for delete
to authenticated
using (auth.uid() = owner_id);

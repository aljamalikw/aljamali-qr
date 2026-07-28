-- Restaurant categories schema for Aljamali QR
-- Run via Supabase SQL editor or: supabase db push

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categories is 'Menu categories belonging to a restaurant';

create index categories_restaurant_id_idx on public.categories (restaurant_id);
create index categories_display_order_idx on public.categories (display_order);

create or replace function public.set_categories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_categories_updated_at();

alter table public.categories enable row level security;

create policy "Users can view their own restaurant categories"
on public.categories
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

create policy "Users can create categories for their own restaurant"
on public.categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

create policy "Users can update their own restaurant categories"
on public.categories
for update
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

create policy "Users can delete their own restaurant categories"
on public.categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

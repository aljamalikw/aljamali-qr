-- Menu items schema for Aljamali QR
-- Run via Supabase SQL editor or: supabase db push

create table public.menu_items (
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

comment on table public.menu_items is 'Menu items belonging to a restaurant';

create index menu_items_restaurant_id_idx on public.menu_items (restaurant_id);
create index menu_items_category_id_idx on public.menu_items (category_id);
create index menu_items_display_order_idx on public.menu_items (display_order);

create or replace function public.set_menu_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger menu_items_set_updated_at
before update on public.menu_items
for each row
execute function public.set_menu_items_updated_at();

alter table public.menu_items enable row level security;

create policy "Users can view their own restaurant menu items"
on public.menu_items
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

create policy "Users can create menu items for their own restaurant"
on public.menu_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

create policy "Users can update their own restaurant menu items"
on public.menu_items
for update
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

create policy "Users can delete their own restaurant menu items"
on public.menu_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

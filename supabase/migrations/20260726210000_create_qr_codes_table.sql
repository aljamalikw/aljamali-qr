-- QR codes schema for Aljamali QR
-- Run via Supabase SQL editor or: supabase db push

create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  type text not null check (
    type in (
      'restaurant-table',
      'vip-room',
      'outdoor',
      'delivery',
      'takeaway',
      'kitchen',
      'custom'
    )
  ),
  destination_url text not null,
  table_number text,
  description text,
  is_active boolean not null default true,
  scans_count integer not null default 0 check (scans_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.qr_codes is 'Scannable QR codes belonging to a restaurant';
comment on column public.qr_codes.destination_url is 'URL encoded in the QR image';
comment on column public.qr_codes.description is 'Optional notes shown in the dashboard';
comment on column public.qr_codes.is_active is 'Whether the QR code is active in the dashboard';

create index qr_codes_restaurant_id_idx on public.qr_codes (restaurant_id);
create index qr_codes_created_at_idx on public.qr_codes (created_at desc);

create or replace function public.set_qr_codes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger qr_codes_set_updated_at
before update on public.qr_codes
for each row
execute function public.set_qr_codes_updated_at();

alter table public.qr_codes enable row level security;

create policy "Users can view their own restaurant qr codes"
on public.qr_codes
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

create policy "Users can create qr codes for their own restaurant"
on public.qr_codes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

create policy "Users can update their own restaurant qr codes"
on public.qr_codes
for update
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

create policy "Users can delete their own restaurant qr codes"
on public.qr_codes
for delete
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = qr_codes.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

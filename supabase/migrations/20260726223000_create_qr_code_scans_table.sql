-- QR scan tracking for Aljamali QR
-- Run via Supabase SQL editor or: supabase db push

create table public.qr_code_scans (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  referrer text
);

comment on table public.qr_code_scans is 'Individual QR code scan events';

create index qr_code_scans_qr_code_id_idx on public.qr_code_scans (qr_code_id);
create index qr_code_scans_restaurant_id_idx on public.qr_code_scans (restaurant_id);
create index qr_code_scans_scanned_at_idx on public.qr_code_scans (scanned_at desc);
create index qr_code_scans_restaurant_scanned_at_idx
  on public.qr_code_scans (restaurant_id, scanned_at desc);

alter table public.qr_code_scans enable row level security;

create policy "Users can view scans for their own restaurants"
on public.qr_code_scans
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants
    where restaurants.id = qr_code_scans.restaurant_id
      and restaurants.owner_id = auth.uid()
  )
);

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

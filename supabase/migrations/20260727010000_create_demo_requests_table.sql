-- Demo requests for Aljamali QR
-- Run via Supabase SQL editor or: supabase db push

create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  contact_person text not null,
  mobile_number text not null,
  email text,
  city text,
  restaurant_type text,
  branches integer not null default 1 check (branches >= 1),
  preferred_date date not null,
  preferred_time text not null,
  alternate_date date,
  current_menu_type text,
  notes text,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.demo_requests is 'Public demo booking requests submitted by prospective restaurants';
comment on column public.demo_requests.status is 'Request lifecycle status for the admin dashboard';

create index demo_requests_created_at_idx on public.demo_requests (created_at desc);
create index demo_requests_status_idx on public.demo_requests (status);
create index demo_requests_preferred_date_idx on public.demo_requests (preferred_date);

create or replace function public.set_demo_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger demo_requests_set_updated_at
before update on public.demo_requests
for each row
execute function public.set_demo_requests_updated_at();

alter table public.demo_requests enable row level security;

create policy "Anonymous users can submit demo requests"
on public.demo_requests
for insert
to anon
with check (true);

create policy "Authenticated users can view demo requests"
on public.demo_requests
for select
to authenticated
using (true);

create policy "Authenticated users can create demo requests"
on public.demo_requests
for insert
to authenticated
with check (true);

create policy "Authenticated users can update demo requests"
on public.demo_requests
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete demo requests"
on public.demo_requests
for delete
to authenticated
using (true);

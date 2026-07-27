-- CRM priority/assignment + platform announcements
-- Keep existing demo_requests data intact.

alter table public.demo_requests
  add column if not exists priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  add column if not exists assigned_salesperson text;

comment on column public.demo_requests.priority is 'CRM priority for sales follow-up';
comment on column public.demo_requests.assigned_salesperson is 'Salesperson assigned to this demo request';

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  status text not null default 'Draft'
    check (status in ('Draft', 'Published', 'Scheduled', 'Expired')),
  publish_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.announcements is 'Platform announcements shown to restaurant dashboards';

create or replace function public.set_announcements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row
execute function public.set_announcements_updated_at();

alter table public.announcements enable row level security;

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
on public.announcements
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Owners can view published announcements" on public.announcements;
create policy "Owners can view published announcements"
on public.announcements
for select
to authenticated
using (
  status = 'Published'
  and (publish_at is null or publish_at <= now())
  and (expires_at is null or expires_at > now())
);

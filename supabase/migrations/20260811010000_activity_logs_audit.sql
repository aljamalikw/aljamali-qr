-- Platform-wide activity / audit log (source of truth for Admin Activity).
-- Additive only: does not alter admin_activity_logs or existing flows.

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text,
  actor_email text,
  actor_role text,
  owner_id uuid references auth.users (id) on delete set null,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  entity_type text,
  entity_id text,
  action text not null,
  old_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

comment on table public.activity_logs is
  'Immutable audit trail for admin and restaurant-owner actions. No automatic deletion.';

create index if not exists activity_logs_created_idx
  on public.activity_logs (created_at desc);

create index if not exists activity_logs_action_idx
  on public.activity_logs (action);

create index if not exists activity_logs_actor_idx
  on public.activity_logs (actor_id);

create index if not exists activity_logs_owner_idx
  on public.activity_logs (owner_id);

create index if not exists activity_logs_restaurant_idx
  on public.activity_logs (restaurant_id);

create index if not exists activity_logs_entity_idx
  on public.activity_logs (entity_type, entity_id);

create index if not exists activity_logs_actor_role_idx
  on public.activity_logs (actor_role);

alter table public.activity_logs enable row level security;

drop policy if exists "Super admins can view activity logs" on public.activity_logs;
create policy "Super admins can view activity logs"
on public.activity_logs
for select
to authenticated
using (public.is_super_admin());

drop policy if exists "Authenticated users can insert own activity logs"
  on public.activity_logs;
create policy "Authenticated users can insert own activity logs"
on public.activity_logs
for insert
to authenticated
with check (
  actor_id = auth.uid()
  or public.is_platform_admin()
);

-- Backfill from legacy admin_activity_logs (best-effort, non-destructive).
insert into public.activity_logs (
  id,
  created_at,
  actor_id,
  actor_email,
  actor_role,
  restaurant_id,
  action,
  old_values,
  new_values,
  ip_address,
  metadata
)
select
  a.id,
  a.created_at,
  a.actor_user_id,
  a.actor_email,
  a.actor_role,
  a.restaurant_id,
  a.action,
  '{}'::jsonb,
  coalesce(a.details, '{}'::jsonb),
  a.ip_address,
  jsonb_strip_nulls(
    jsonb_build_object(
      'restaurantName', a.restaurant_name,
      'reason', a.reason,
      'legacySource', 'admin_activity_logs'
    )
  )
from public.admin_activity_logs a
where not exists (
  select 1 from public.activity_logs l where l.id = a.id
);

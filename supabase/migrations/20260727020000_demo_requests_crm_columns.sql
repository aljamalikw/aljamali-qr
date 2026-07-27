-- Demo Requests CRM columns for Aljamali QR
-- Run via Supabase SQL editor or: supabase db push

alter table public.demo_requests
  add column if not exists internal_notes text,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists follow_up_notes text,
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

comment on column public.demo_requests.internal_notes is 'Private CRM notes for the sales team';
comment on column public.demo_requests.last_contacted_at is 'When the prospect was last contacted';
comment on column public.demo_requests.next_follow_up_at is 'Scheduled next follow-up timestamp';
comment on column public.demo_requests.follow_up_notes is 'Notes related to the next follow-up';
comment on column public.demo_requests.is_archived is 'Soft-archived requests hidden from the default active list';
comment on column public.demo_requests.archived_at is 'When the request was archived';
comment on column public.demo_requests.deleted_at is 'Soft-delete timestamp; rows are never physically deleted';

create index if not exists demo_requests_is_archived_idx
  on public.demo_requests (is_archived)
  where deleted_at is null;

create index if not exists demo_requests_deleted_at_idx
  on public.demo_requests (deleted_at);

create index if not exists demo_requests_next_follow_up_at_idx
  on public.demo_requests (next_follow_up_at)
  where deleted_at is null and is_archived = false;

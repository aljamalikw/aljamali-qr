-- Expand support ticket statuses for conversation workflow.
-- Migrate legacy "In Progress" → "Waiting for Admin".

update public.support_tickets
set status = 'Waiting for Admin'
where status = 'In Progress';

alter table public.support_tickets
  drop constraint if exists support_tickets_status_check;

alter table public.support_tickets
  add constraint support_tickets_status_check
  check (
    status in (
      'Open',
      'Waiting for Customer',
      'Waiting for Admin',
      'Resolved',
      'Closed',
      'In Progress'
    )
  );

-- Keep "In Progress" briefly allowed for any lagging clients, then tighten.
update public.support_tickets
set status = 'Waiting for Admin'
where status = 'In Progress';

alter table public.support_tickets
  drop constraint if exists support_tickets_status_check;

alter table public.support_tickets
  add constraint support_tickets_status_check
  check (
    status in (
      'Open',
      'Waiting for Customer',
      'Waiting for Admin',
      'Resolved',
      'Closed'
    )
  );

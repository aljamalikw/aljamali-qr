-- Admin payment management: reference/notes + failed status (additive, safe)

alter table public.payments
  add column if not exists reference text,
  add column if not exists notes text;

comment on column public.payments.reference is 'External transaction or bank reference for reconciliation';
comment on column public.payments.notes is 'Admin notes for manual reconciliation';

alter table public.payments drop constraint if exists payments_status_check;

alter table public.payments
  add constraint payments_status_check
  check (status in ('paid', 'pending', 'overdue', 'refunded', 'failed'));

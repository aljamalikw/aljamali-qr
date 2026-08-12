-- Additive: allow WhatsApp Share status without dropping historical "sent" rows.
-- Safe for live production (no data loss, no resets).

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_status_check;

alter table public.marketing_campaigns
  add constraint marketing_campaigns_status_check
  check (
    status in ('draft', 'scheduled', 'sent', 'shared', 'cancelled')
  );

comment on column public.marketing_campaigns.status is
  'draft | scheduled | shared (WhatsApp Share opened) | sent (legacy) | cancelled';

-- Additive live patch: allow marketing campaign status "shared".
-- Apply in Supabase SQL editor if not using migration runner.

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_status_check;

alter table public.marketing_campaigns
  add constraint marketing_campaigns_status_check
  check (
    status in ('draft', 'scheduled', 'sent', 'shared', 'cancelled')
  );

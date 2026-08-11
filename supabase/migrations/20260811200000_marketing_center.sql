-- Restaurant-scoped Marketing Center (campaigns + recipients).
-- Additive only. Does not alter billing, auth, orders, or CRM schemas beyond FKs.

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  campaign_type text not null
    check (
      campaign_type in (
        'Birthday',
        'Win Back',
        'VIP',
        'Loyalty',
        'New Customer',
        'Custom'
      )
    ),
  status text not null default 'draft'
    check (
      status in ('draft', 'scheduled', 'sent', 'cancelled')
    ),
  subject text,
  message text not null default '',
  notes text,
  channels text[] not null default array['whatsapp', 'email']::text[],
  audience_filters jsonb not null default '{}'::jsonb,
  recipient_count integer not null default 0,
  estimated_revenue numeric(12, 3) not null default 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_by_name text,
  created_by_email text,
  -- Provider hooks: whatsapp, email, sms, push payloads / delivery ids
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_campaigns_recipient_count_nonneg check (recipient_count >= 0),
  constraint marketing_campaigns_estimated_revenue_nonneg check (estimated_revenue >= 0)
);

comment on table public.marketing_campaigns is
  'Restaurant marketing campaigns built from Customer CRM audiences.';
comment on column public.marketing_campaigns.metadata is
  'Extensible provider bag for WhatsApp Business, Resend/SendGrid, Twilio, Firebase Push.';
comment on column public.marketing_campaigns.channels is
  'Selected channels: whatsapp | email | sms | push (sms/push reserved).';

create index if not exists marketing_campaigns_restaurant_idx
  on public.marketing_campaigns (restaurant_id);

create index if not exists marketing_campaigns_restaurant_status_idx
  on public.marketing_campaigns (restaurant_id, status);

create index if not exists marketing_campaigns_scheduled_idx
  on public.marketing_campaigns (restaurant_id, scheduled_at)
  where scheduled_at is not null;

create table if not exists public.marketing_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  channel text not null default 'email'
    check (channel in ('whatsapp', 'email', 'sms', 'push')),
  status text not null default 'pending'
    check (status in ('pending', 'queued', 'sent', 'failed', 'skipped')),
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (campaign_id, customer_id, channel)
);

comment on table public.marketing_campaign_recipients is
  'Per-customer delivery rows for marketing campaigns (provider-ready).';

create index if not exists marketing_recipients_campaign_idx
  on public.marketing_campaign_recipients (campaign_id);

create index if not exists marketing_recipients_customer_idx
  on public.marketing_campaign_recipients (customer_id);

create index if not exists marketing_recipients_restaurant_idx
  on public.marketing_campaign_recipients (restaurant_id);

create table if not exists public.marketing_templates (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  slug text not null,
  name text not null,
  subject text not null default '',
  message text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

comment on table public.marketing_templates is
  'Restaurant-editable marketing message templates (seeded from system defaults).';

create index if not exists marketing_templates_restaurant_idx
  on public.marketing_templates (restaurant_id);

create or replace function public.set_marketing_campaigns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marketing_campaigns_set_updated_at on public.marketing_campaigns;
create trigger marketing_campaigns_set_updated_at
before update on public.marketing_campaigns
for each row
execute function public.set_marketing_campaigns_updated_at();

create or replace function public.set_marketing_templates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marketing_templates_set_updated_at on public.marketing_templates;
create trigger marketing_templates_set_updated_at
before update on public.marketing_templates
for each row
execute function public.set_marketing_templates_updated_at();

alter table public.marketing_campaigns enable row level security;
alter table public.marketing_campaign_recipients enable row level security;
alter table public.marketing_templates enable row level security;

drop policy if exists "Members select marketing campaigns" on public.marketing_campaigns;
create policy "Members select marketing campaigns"
on public.marketing_campaigns for select to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members insert marketing campaigns" on public.marketing_campaigns;
create policy "Members insert marketing campaigns"
on public.marketing_campaigns for insert to authenticated
with check (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

drop policy if exists "Members update marketing campaigns" on public.marketing_campaigns;
create policy "Members update marketing campaigns"
on public.marketing_campaigns for update to authenticated
using (public.is_platform_admin() or public.is_restaurant_member(restaurant_id))
with check (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

drop policy if exists "Members delete marketing campaigns" on public.marketing_campaigns;
create policy "Members delete marketing campaigns"
on public.marketing_campaigns for delete to authenticated
using (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

drop policy if exists "Members select marketing recipients" on public.marketing_campaign_recipients;
create policy "Members select marketing recipients"
on public.marketing_campaign_recipients for select to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members insert marketing recipients" on public.marketing_campaign_recipients;
create policy "Members insert marketing recipients"
on public.marketing_campaign_recipients for insert to authenticated
with check (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

drop policy if exists "Members update marketing recipients" on public.marketing_campaign_recipients;
create policy "Members update marketing recipients"
on public.marketing_campaign_recipients for update to authenticated
using (public.is_platform_admin() or public.is_restaurant_member(restaurant_id))
with check (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

drop policy if exists "Members delete marketing recipients" on public.marketing_campaign_recipients;
create policy "Members delete marketing recipients"
on public.marketing_campaign_recipients for delete to authenticated
using (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

drop policy if exists "Members select marketing templates" on public.marketing_templates;
create policy "Members select marketing templates"
on public.marketing_templates for select to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members upsert marketing templates" on public.marketing_templates;
create policy "Members upsert marketing templates"
on public.marketing_templates for all to authenticated
using (public.is_platform_admin() or public.is_restaurant_member(restaurant_id))
with check (public.is_platform_admin() or public.is_restaurant_member(restaurant_id));

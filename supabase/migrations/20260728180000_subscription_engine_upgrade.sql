-- Subscription engine upgrade:
-- 7-day trial, trial/grace timestamps, grace status, configurable plan prices.
-- Additive only — preserves existing rows and tables.

-- ---------------------------------------------------------------------------
-- restaurant_subscriptions: new columns
-- ---------------------------------------------------------------------------
alter table public.restaurant_subscriptions
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists grace_period_days integer not null default 3;

comment on column public.restaurant_subscriptions.trial_started_at is
  'When the current trial window started';
comment on column public.restaurant_subscriptions.trial_ends_at is
  'When the trial window ends (before grace)';
comment on column public.restaurant_subscriptions.grace_period_days is
  'Days of grace after trial/renewal end before expired locks apply';

-- Backfill trial windows without shrinking existing renewal dates.
update public.restaurant_subscriptions
set
  trial_started_at = coalesce(trial_started_at, started_at, created_at, now()),
  trial_ends_at = coalesce(
    trial_ends_at,
    case
      when renewal_date is not null then (renewal_date::timestamp + time '23:59:59') at time zone 'UTC'
      else coalesce(started_at, created_at, now()) + interval '7 days'
    end
  ),
  grace_period_days = coalesce(grace_period_days, 3)
where trial_started_at is null
   or trial_ends_at is null;

-- Allow grace status (drop prior status check if present)
do $$
declare
  cname text;
begin
  select c.conname into cname
  from pg_constraint c
  where c.conrelid = 'public.restaurant_subscriptions'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%status%';
  if cname is not null then
    execute format(
      'alter table public.restaurant_subscriptions drop constraint %I',
      cname
    );
  end if;
end $$;

alter table public.restaurant_subscriptions
  drop constraint if exists restaurant_subscriptions_status_check;

alter table public.restaurant_subscriptions
  add constraint restaurant_subscriptions_status_check
  check (status in ('trial', 'active', 'grace', 'expired', 'cancelled'));

-- ---------------------------------------------------------------------------
-- Configurable plan pricing on platform_settings
-- ---------------------------------------------------------------------------
alter table public.platform_settings
  add column if not exists subscription_plan_prices jsonb not null
    default '{
      "Starter": {"monthly": 19, "yearly": 190},
      "Professional": {"monthly": 49, "yearly": 490},
      "Enterprise": {"monthly": 99, "yearly": 990}
    }'::jsonb;

comment on column public.platform_settings.subscription_plan_prices is
  'Monthly/yearly plan prices in platform currency (editable by admins)';

update public.platform_settings
set subscription_plan_prices = coalesce(
  subscription_plan_prices,
  '{
    "Starter": {"monthly": 19, "yearly": 190},
    "Professional": {"monthly": 49, "yearly": 490},
    "Enterprise": {"monthly": 99, "yearly": 990}
  }'::jsonb
)
where subscription_plan_prices is null
   or subscription_plan_prices = '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Auto-create 7-day trial subscription for new restaurants
-- ---------------------------------------------------------------------------
create or replace function public.create_default_restaurant_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_price numeric(12, 3);
  v_prices jsonb;
begin
  v_plan := coalesce(nullif(new.subscription_plan, ''), 'Starter');

  select subscription_plan_prices
    into v_prices
  from public.platform_settings
  where id = '00000000-0000-0000-0000-000000000001'::uuid;

  v_price := coalesce(
    (v_prices -> v_plan ->> 'monthly')::numeric,
    case v_plan
      when 'Professional' then 49.000
      when 'Enterprise' then 99.000
      else 19.000
    end
  );

  insert into public.restaurant_subscriptions (
    restaurant_id,
    plan,
    monthly_price,
    currency,
    status,
    trial_started_at,
    trial_ends_at,
    grace_period_days,
    renewal_date,
    started_at
  )
  values (
    new.id,
    v_plan,
    v_price,
    coalesce(nullif(new.currency, ''), 'KWD'),
    'trial',
    now(),
    now() + interval '7 days',
    3,
    (timezone('utc', now()) + interval '7 days')::date,
    now()
  )
  on conflict (restaurant_id) do nothing;

  return new;
end;
$$;

drop trigger if exists restaurants_create_default_subscription
  on public.restaurants;
create trigger restaurants_create_default_subscription
after insert on public.restaurants
for each row
execute function public.create_default_restaurant_subscription();

-- Seed missing subscription rows for existing restaurants (7-day trial from now
-- only when no row exists — does not alter existing subscription data).
insert into public.restaurant_subscriptions (
  restaurant_id,
  plan,
  monthly_price,
  currency,
  status,
  trial_started_at,
  trial_ends_at,
  grace_period_days,
  renewal_date,
  started_at
)
select
  r.id,
  coalesce(nullif(r.subscription_plan, ''), 'Starter'),
  case coalesce(nullif(r.subscription_plan, ''), 'Starter')
    when 'Professional' then 49.000
    when 'Enterprise' then 99.000
    else 19.000
  end,
  coalesce(nullif(r.currency, ''), 'KWD'),
  'trial',
  now(),
  now() + interval '7 days',
  3,
  (timezone('utc', now()) + interval '7 days')::date,
  now()
from public.restaurants r
on conflict (restaurant_id) do nothing;

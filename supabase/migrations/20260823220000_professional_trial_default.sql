-- New restaurants start on a Professional trial (not Starter).
-- Feature access is gated by restaurant_subscriptions.plan, so a Starter
-- trial would lock Professional capabilities during the evaluation period.
--
-- This migration only changes defaults and insert-time assignment.
-- It does NOT update existing restaurant_subscriptions or restaurants rows.
-- Paid Starter, paid Professional, and historical trial records stay as-is.

alter table public.restaurants
  alter column subscription_plan set default 'Professional';

alter table public.restaurant_subscriptions
  alter column plan set default 'Professional';

comment on column public.restaurants.subscription_plan is
  'Billing plan label mirrored from restaurant_subscriptions. New restaurants default to Professional (trial).';

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
  v_plan := coalesce(nullif(new.subscription_plan, ''), 'Professional');

  select subscription_plan_prices
    into v_prices
  from public.platform_settings
  where id = '00000000-0000-0000-0000-000000000001'::uuid;

  v_price := coalesce(
    (v_prices -> v_plan ->> 'monthly')::numeric,
    case v_plan
      when 'Professional' then 15.000
      when 'Enterprise' then 0.000
      else 8.000
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

comment on function public.create_default_restaurant_subscription() is
  'Insert-time trial row for a new restaurant. Defaults to Professional when subscription_plan is empty. Does not charge.';

create or replace function public.create_restaurant_for_owner(
  p_owner_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_email text;
  v_created_at timestamptz;
  v_existing int;
  v_plan text;
  v_in_registration_window boolean;
begin
  select email, created_at
    into v_user_email, v_created_at
  from auth.users
  where id = p_owner_id;

  if not found then
    raise exception 'User not found';
  end if;

  if lower(trim(v_user_email)) is distinct from lower(trim(p_email)) then
    raise exception 'Email does not match user';
  end if;

  v_in_registration_window := v_created_at >= now() - interval '10 minutes';

  select count(*)::int
    into v_existing
  from public.restaurants
  where owner_id = p_owner_id;

  -- First restaurant: signup bootstrap on a Professional trial.
  if v_existing = 0 then
    if not v_in_registration_window then
      raise exception 'Registration window expired';
    end if;

    insert into public.restaurants (owner_id, email, subscription_plan)
    values (p_owner_id, p_email, 'Professional');
    return;
  end if;

  -- Signup retry: already has a restaurant inside the registration window.
  -- Succeed idempotently without creating another row.
  if v_in_registration_window then
    return;
  end if;

  -- Outside signup: allow additional restaurants only when plan permits
  -- (Professional / Enterprise unlimited; Starter blocked).
  v_plan := public.owner_subscription_plan_for_limits(p_owner_id);

  if v_plan = 'Starter' then
    raise exception 'Your current plan allows only one restaurant. Upgrade to Professional to create additional restaurants.'
      using errcode = 'check_violation';
  end if;

  insert into public.restaurants (
    owner_id,
    email,
    subscription_plan
  )
  values (
    p_owner_id,
    p_email,
    v_plan
  );
end;
$$;

revoke all on function public.create_restaurant_for_owner(uuid, text) from public;
grant execute on function public.create_restaurant_for_owner(uuid, text) to anon, authenticated;

comment on function public.create_restaurant_for_owner(uuid, text) is
  'Signup bootstrap (Professional trial) + plan-gated additional restaurant create.';

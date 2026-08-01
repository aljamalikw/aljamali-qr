-- Sync platform subscription prices to the canonical catalog:
-- Starter KD 8 / Professional KD 15 / Enterprise Contact Us (0)

update public.platform_settings
set subscription_plan_prices = '{
  "Starter": {"monthly": 8, "yearly": 80},
  "Professional": {"monthly": 15, "yearly": 150},
  "Enterprise": {"monthly": 0, "yearly": 0}
}'::jsonb
where id = '00000000-0000-0000-0000-000000000001';

-- Align existing subscription rows that still store legacy list prices.
update public.restaurant_subscriptions
set monthly_price = 8
where plan = 'Starter'
  and monthly_price in (19, 19.000, 49, 49.000, 99, 99.000);

update public.restaurant_subscriptions
set monthly_price = 15
where plan = 'Professional'
  and monthly_price in (19, 19.000, 49, 49.000, 99, 99.000);

update public.restaurant_subscriptions
set monthly_price = 0
where plan = 'Enterprise'
  and monthly_price in (19, 19.000, 49, 49.000, 99, 99.000);

-- Update default subscription trigger fallbacks.
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

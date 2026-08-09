-- Multi-restaurant support: drop 1:1 owner unique constraint and enforce
-- plan restaurant limits at the database layer (mirrors PLAN_FEATURES in
-- lib/subscriptions/plans.ts). Application create path remains
-- POST /api/restaurants/create.

drop index if exists public.restaurants_owner_id_unique;

create or replace function public.enforce_owner_restaurant_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing int;
  v_plan text;
begin
  select count(*)::int
    into v_existing
  from public.restaurants
  where owner_id = new.owner_id;

  -- First restaurant is always allowed (signup / bootstrap).
  if v_existing = 0 then
    return new;
  end if;

  -- Canonical source: restaurant_subscriptions.plan (not restaurants.subscription_plan).
  select rs.plan
    into v_plan
  from public.restaurants r
  join public.restaurant_subscriptions rs on rs.restaurant_id = r.id
  where r.owner_id = new.owner_id
  order by
    case rs.plan
      when 'Enterprise' then 3
      when 'Professional' then 2
      else 1
    end desc,
    r.created_at asc
  limit 1;

  v_plan := coalesce(nullif(trim(v_plan), ''), 'Starter');

  -- Starter: maxRestaurants = 1 (mirrors PLAN_FEATURES.Starter).
  if v_plan = 'Starter' then
    raise exception 'Your current plan allows only one restaurant. Upgrade to Professional to create additional restaurants.'
      using errcode = 'check_violation';
  end if;

  -- Professional / Enterprise: unlimited.
  return new;
end;
$$;

drop trigger if exists trg_enforce_owner_restaurant_plan_limit on public.restaurants;
create trigger trg_enforce_owner_restaurant_plan_limit
before insert on public.restaurants
for each row
execute function public.enforce_owner_restaurant_plan_limit();

comment on function public.enforce_owner_restaurant_plan_limit() is
  'Enforces plan maxRestaurants: Starter=1, Professional/Enterprise=unlimited. Plan from restaurant_subscriptions.';

-- Align create_restaurant_for_owner with multi-restaurant plan limits.
-- The old "if any restaurant exists then return" permanently capped every
-- owner at one restaurant. Signup stays idempotent only inside the
-- registration window; additional creates are plan-gated.

create or replace function public.owner_subscription_plan_for_limits(p_owner_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  -- Canonical source: restaurant_subscriptions.plan (mirrors app helpers).
  select rs.plan
    into v_plan
  from public.restaurants r
  join public.restaurant_subscriptions rs on rs.restaurant_id = r.id
  where r.owner_id = p_owner_id
  order by
    case rs.plan
      when 'Enterprise' then 3
      when 'Professional' then 2
      else 1
    end desc,
    r.created_at asc
  limit 1;

  return coalesce(nullif(trim(v_plan), ''), 'Starter');
end;
$$;

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

  if v_existing = 0 then
    return new;
  end if;

  v_plan := public.owner_subscription_plan_for_limits(new.owner_id);

  -- Starter: maxRestaurants = 1 (mirrors PLAN_FEATURES.Starter).
  if v_plan = 'Starter' then
    raise exception 'Your current plan allows only one restaurant. Upgrade to Professional to create additional restaurants.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

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

  -- First restaurant: signup bootstrap (registration window required).
  if v_existing = 0 then
    if not v_in_registration_window then
      raise exception 'Registration window expired';
    end if;

    insert into public.restaurants (owner_id, email)
    values (p_owner_id, p_email);
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

revoke all on function public.owner_subscription_plan_for_limits(uuid) from public;
grant execute on function public.owner_subscription_plan_for_limits(uuid) to authenticated;

revoke all on function public.create_restaurant_for_owner(uuid, text) from public;
grant execute on function public.create_restaurant_for_owner(uuid, text) to anon, authenticated;

comment on function public.create_restaurant_for_owner(uuid, text) is
  'Signup bootstrap + plan-gated additional restaurant create. No longer permanently caps owners at one restaurant.';

comment on function public.owner_subscription_plan_for_limits(uuid) is
  'Highest restaurant_subscriptions.plan for an owner; used by restaurant limit enforcement.';

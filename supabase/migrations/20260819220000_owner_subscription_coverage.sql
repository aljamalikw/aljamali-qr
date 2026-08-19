-- Owner-level subscription coverage (additive, backward compatible).
-- Do NOT apply automatically to production until reviewed.
--
-- Keeps restaurant_subscriptions (one row per restaurant).
-- Adds is_covered so an owner's paid plan can cover up to the plan limit
-- without creating a second charge.

alter table public.restaurant_subscriptions
  add column if not exists is_covered boolean not null default true;

comment on column public.restaurant_subscriptions.is_covered is
  'Whether this restaurant is covered by the owner''s canonical paid subscription.';

create index if not exists restaurant_subscriptions_is_covered_idx
  on public.restaurant_subscriptions (is_covered);

-- Backfill: for each owner, cover earliest restaurants up to the plan cap.
-- Professional = 2, Starter = 1, Enterprise = all. Does not modify payments.
with owner_plans as (
  select
    r.owner_id,
    max(
      case rs.plan
        when 'Enterprise' then 3
        when 'Professional' then 2
        else 1
      end
    ) as plan_rank
  from public.restaurants r
  join public.restaurant_subscriptions rs on rs.restaurant_id = r.id
  group by r.owner_id
),
ranked as (
  select
    rs.id,
    r.owner_id,
    row_number() over (
      partition by r.owner_id
      order by r.created_at asc
    ) as restaurant_n,
    coalesce(op.plan_rank, 1) as plan_rank
  from public.restaurant_subscriptions rs
  join public.restaurants r on r.id = rs.restaurant_id
  left join owner_plans op on op.owner_id = r.owner_id
)
update public.restaurant_subscriptions rs
set is_covered = case
  when ranked.plan_rank >= 3 then true
  when ranked.plan_rank = 2 then ranked.restaurant_n <= 2
  else ranked.restaurant_n <= 1
end
from ranked
where rs.id = ranked.id;

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

  if v_plan = 'Starter' then
    raise exception 'Your current plan allows only one restaurant. Upgrade to Professional to create additional restaurants.'
      using errcode = 'check_violation';
  end if;

  if v_plan = 'Professional' and v_existing >= 2 then
    raise exception 'Your Professional plan includes 2 restaurants. Upgrade to Enterprise to cover additional restaurants.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

comment on function public.enforce_owner_restaurant_plan_limit() is
  'Enforces plan maxRestaurants: Starter=1, Professional=2, Enterprise=unlimited.';

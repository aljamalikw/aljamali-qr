-- Harden signup restaurant bootstrap:
-- 1) Do not fail when auth.users.email is still null (unconfirmed signup).
-- 2) Guarantee onboarding_completed_steps has a default so inserts cannot fail.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'restaurants'
      and column_name = 'onboarding_completed_steps'
  ) then
    execute $sql$
      alter table public.restaurants
        alter column onboarding_completed_steps set default '[]'::jsonb
    $sql$;

    execute $sql$
      update public.restaurants
      set onboarding_completed_steps = '[]'::jsonb
      where onboarding_completed_steps is null
    $sql$;
  end if;
end $$;

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
  select u.email, u.created_at
    into v_user_email, v_created_at
  from auth.users u
  where u.id = p_owner_id;

  if not found then
    raise exception 'User not found';
  end if;

  if v_user_email is null or length(trim(v_user_email)) = 0 then
    select i.identity_data ->> 'email'
      into v_user_email
    from auth.identities i
    where i.user_id = p_owner_id
      and coalesce(i.identity_data ->> 'email', '') <> ''
    order by i.created_at asc
    limit 1;
  end if;

  if v_user_email is null or length(trim(v_user_email)) = 0 then
    v_user_email := p_email;
  end if;

  if lower(trim(v_user_email)) is distinct from lower(trim(p_email)) then
    raise exception 'Email does not match user';
  end if;

  v_in_registration_window := v_created_at >= now() - interval '15 minutes';

  select count(*)::int
    into v_existing
  from public.restaurants
  where owner_id = p_owner_id;

  if v_existing = 0 then
    if not v_in_registration_window then
      raise exception 'Registration window expired';
    end if;

    insert into public.restaurants (owner_id, email, subscription_plan)
    values (p_owner_id, p_email, 'Professional');
    return;
  end if;

  if v_in_registration_window then
    return;
  end if;

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
  'Signup bootstrap that tolerates unconfirmed Auth emails, plus plan-gated extra restaurants.';

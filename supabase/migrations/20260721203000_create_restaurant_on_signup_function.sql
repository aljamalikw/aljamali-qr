-- Secure restaurant bootstrap for new sign-ups (including email-confirmation flow)

create unique index if not exists restaurants_owner_id_unique
on public.restaurants (owner_id);

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

  if v_created_at < now() - interval '10 minutes' then
    raise exception 'Registration window expired';
  end if;

  if exists (
    select 1
    from public.restaurants
    where owner_id = p_owner_id
  ) then
    return;
  end if;

  insert into public.restaurants (owner_id, email)
  values (p_owner_id, p_email);
end;
$$;

revoke all on function public.create_restaurant_for_owner(uuid, text) from public;
grant execute on function public.create_restaurant_for_owner(uuid, text) to anon, authenticated;

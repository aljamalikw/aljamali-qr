-- Super Admin restaurant management: archive flag, super-admin helper, permanent delete RPC

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$$;

comment on function public.is_super_admin() is
  'True when the authenticated user has the super_admin profile role';

alter table public.restaurants
  add column if not exists is_archived boolean not null default false;

comment on column public.restaurants.is_archived is
  'Soft-archived restaurants hidden from default admin management lists';

create index if not exists restaurants_is_archived_idx
  on public.restaurants (is_archived);

drop policy if exists "Super admins can delete restaurants" on public.restaurants;
create policy "Super admins can delete restaurants"
on public.restaurants
for delete
to authenticated
using (public.is_super_admin());

create or replace function public.admin_delete_restaurant_permanently(
  p_restaurant_id uuid,
  p_confirm_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_owner_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Only super admins can permanently delete restaurants';
  end if;

  select restaurant_name, owner_id
    into v_name, v_owner_id
  from public.restaurants
  where id = p_restaurant_id
  for update;

  if not found then
    raise exception 'Restaurant not found';
  end if;

  if v_owner_id = auth.uid() then
    raise exception 'You cannot permanently delete your own restaurant';
  end if;

  if lower(trim(coalesce(v_name, ''))) <> lower(trim(coalesce(p_confirm_name, ''))) then
    raise exception 'Restaurant name confirmation does not match';
  end if;

  -- Cascades remove categories, menu items, QR codes, scans, reservations,
  -- orders, subscriptions, payments, and other restaurant-scoped rows.
  delete from public.restaurants
  where id = p_restaurant_id;
end;
$$;

comment on function public.admin_delete_restaurant_permanently(uuid, text) is
  'Super-admin only permanent restaurant delete with name confirmation';

revoke all on function public.admin_delete_restaurant_permanently(uuid, text) from public;
grant execute on function public.admin_delete_restaurant_permanently(uuid, text) to authenticated;

-- Allows the public (anon) checkout / reservation flows to notify the
-- restaurant owner without granting any other notification access.
-- Additive only; existing "Users manage own notifications" and
-- "Admins can insert notifications" policies are untouched.

drop policy if exists "Public can notify owners of new orders" on public.notifications;
create policy "Public can notify owners of new orders"
on public.notifications
for insert
to anon, authenticated
with check (
  type in ('new_order', 'new_reservation')
  and exists (
    select 1 from public.restaurants r
    where r.id = notifications.restaurant_id
      and r.owner_id = notifications.user_id
      and coalesce(r.is_active, true) = true
  )
);

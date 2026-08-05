-- ============================================================================
-- Server-side public order creation
-- ============================================================================
-- Public (anonymous) customers must NOT insert into orders / order_items via
-- the anon key. Creation goes through a Next.js Route Handler that uses the
-- service role after validating the restaurant server-side.
--
-- RLS stays enabled. Owners/members (and platform admins via
-- is_restaurant_member) retain SELECT / UPDATE / DELETE on their restaurants.
-- There is intentionally NO INSERT policy for anon or authenticated — only
-- the service role (which bypasses RLS) may create orders.
-- ============================================================================

-- Drop obsolete public INSERT policies (cross-table EXISTS against restaurants).
drop policy if exists "Anyone can create orders" on public.orders;
drop policy if exists "Anyone can create order items" on public.order_items;

-- Replace broad FOR ALL manage policies with explicit SELECT/UPDATE/DELETE.
-- No INSERT policies for anon/authenticated on either table.
drop policy if exists "Owners and members manage orders" on public.orders;
drop policy if exists "Owners and members manage order items" on public.order_items;

drop policy if exists "Members select orders" on public.orders;
create policy "Members select orders"
on public.orders
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members update orders" on public.orders;
create policy "Members update orders"
on public.orders
for update
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members delete orders" on public.orders;
create policy "Members delete orders"
on public.orders
for delete
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members select order items" on public.order_items;
create policy "Members select order items"
on public.order_items
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members update order items" on public.order_items;
create policy "Members update order items"
on public.order_items
for update
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members delete order items" on public.order_items;
create policy "Members delete order items"
on public.order_items
for delete
to authenticated
using (public.is_restaurant_member(restaurant_id));

-- Defense in depth: revoke direct INSERT from browser roles.
-- Service role bypasses RLS and retains insert capability.
revoke insert on public.orders from anon, authenticated;
revoke insert on public.order_items from anon, authenticated;

comment on table public.orders is
  'Restaurant orders. Public creation via server (service role); owners/members manage via RLS.';
comment on table public.order_items is
  'Line items for orders. Public creation via server (service role); owners/members manage via RLS.';

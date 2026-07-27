-- Allow anonymous visitors to read public menu data by restaurant slug.

create policy "Public can view restaurants by slug"
on public.restaurants
for select
to anon, authenticated
using (slug is not null);

create policy "Public can view active categories"
on public.categories
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.restaurants r
    where r.id = categories.restaurant_id
      and r.slug is not null
  )
);

create policy "Public can view available menu items"
on public.menu_items
for select
to anon, authenticated
using (
  is_available = true
  and exists (
    select 1
    from public.restaurants r
    where r.id = menu_items.restaurant_id
      and r.slug is not null
  )
);

-- ============================================================================
-- Server-side public reservation creation
-- ============================================================================
-- Public (anonymous) customers must NOT insert into reservations via the
-- anon key. Creation goes through /api/reservations/create using the
-- service role after the restaurant and payload are validated server-side.
--
-- Owner/member SELECT/UPDATE/DELETE policies are unchanged.
-- ============================================================================

drop policy if exists "Anyone can create reservations" on public.reservations;

-- Defense in depth: revoke direct INSERT from browser roles.
-- Service role bypasses RLS and retains insert capability.
revoke insert on public.reservations from anon, authenticated;

comment on table public.reservations is
  'Public table reservations. Customer creation via server (service role); owners/members manage via RLS.';

notify pgrst, 'reload schema';

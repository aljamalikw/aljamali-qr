-- Extend restaurant onboarding progress for the 11-step Setup Wizard.
-- Additive only. Existing onboarding_completed / onboarding_step retained.

alter table public.restaurants
  add column if not exists onboarding_completed_steps jsonb not null default '[]'::jsonb;

alter table public.restaurants
  add column if not exists onboarding_completed_at timestamptz;

alter table public.restaurants
  add column if not exists onboarding_last_updated timestamptz;

comment on column public.restaurants.onboarding_completed_steps is
  'JSON array of completed/skipped Setup Wizard step numbers (1-11).';
comment on column public.restaurants.onboarding_completed_at is
  'When the restaurant finished the Setup Wizard.';
comment on column public.restaurants.onboarding_last_updated is
  'Last time onboarding progress was saved.';

-- Remap incomplete wizards from the previous 8-step flow to the new 11-step flow.
-- Old: 1 Welcome, 2 Info, 3 Branding, 4 Categories, 5 Menu, 6 QR, 7 Preview, 8 Finish
-- New: 1 Info, 2 Logo, 3 Categories, 4 Menu, 5 QR, 6 Preview, 7 Reservations,
--      8 Ordering, 9 Loyalty, 10 Marketing, 11 Finish
update public.restaurants
set onboarding_step = case
  when coalesce(onboarding_step, 1) <= 2 then 1
  when onboarding_step = 3 then 2
  when onboarding_step = 4 then 3
  when onboarding_step = 5 then 4
  when onboarding_step = 6 then 5
  when onboarding_step = 7 then 6
  when onboarding_step >= 8 then 7
  else 1
end
where coalesce(onboarding_completed, false) = false;

-- Completed restaurants stay complete; normalize step pointer to finish.
update public.restaurants
set onboarding_step = 11
where coalesce(onboarding_completed, false) = true
  and coalesce(onboarding_step, 0) < 11;

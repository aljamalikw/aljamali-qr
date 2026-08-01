-- Aljamali QR — subscription lifecycle, audit log, email framework, onboarding remap

-- ---------------------------------------------------------------------------
-- Subscription: add suspended status
-- ---------------------------------------------------------------------------
alter table public.restaurant_subscriptions
  drop constraint if exists restaurant_subscriptions_status_check;

alter table public.restaurant_subscriptions
  add constraint restaurant_subscriptions_status_check
  check (
    status in (
      'trial',
      'active',
      'grace',
      'suspended',
      'expired',
      'cancelled'
    )
  );

-- ---------------------------------------------------------------------------
-- Remap incomplete onboarding steps (+1 for Welcome inserted at step 1)
-- Existing: 1 Info, 2 Branding, 3 Categories, 4 Menu, 5 QR
-- New:      1 Welcome, 2 Info, 3 Branding, 4 Categories, 5 Menu, 6 QR, 7 Preview, 8 Finish
-- ---------------------------------------------------------------------------
update public.restaurants
set onboarding_step = least(coalesce(onboarding_step, 1) + 1, 8)
where coalesce(onboarding_completed, false) = false
  and coalesce(onboarding_step, 1) between 1 and 5;

-- ---------------------------------------------------------------------------
-- Admin activity / audit log
-- ---------------------------------------------------------------------------
create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_email text,
  actor_role text,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  restaurant_name text,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  reason text,
  ip_address text
);

create index if not exists admin_activity_logs_created_idx
  on public.admin_activity_logs (created_at desc);

create index if not exists admin_activity_logs_action_idx
  on public.admin_activity_logs (action);

create index if not exists admin_activity_logs_actor_idx
  on public.admin_activity_logs (actor_user_id);

create index if not exists admin_activity_logs_restaurant_idx
  on public.admin_activity_logs (restaurant_id);

alter table public.admin_activity_logs enable row level security;

drop policy if exists "Super admins can view activity logs" on public.admin_activity_logs;
create policy "Super admins can view activity logs"
on public.admin_activity_logs
for select
to authenticated
using (public.is_super_admin());

drop policy if exists "Platform admins can insert activity logs" on public.admin_activity_logs;
create policy "Platform admins can insert activity logs"
on public.admin_activity_logs
for insert
to authenticated
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Editable email template overrides + outbox (framework, no provider yet)
-- ---------------------------------------------------------------------------
create table if not exists public.email_templates (
  id text primary key,
  label text not null,
  description text not null default '',
  subject text not null,
  body_html text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.email_templates enable row level security;

drop policy if exists "Admins manage email templates" on public.email_templates;
create policy "Admins manage email templates"
on public.email_templates
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  template_id text,
  to_email text not null,
  subject text not null,
  body_html text not null,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'preview')),
  error_message text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_outbox_created_idx
  on public.email_outbox (created_at desc);

alter table public.email_outbox enable row level security;

drop policy if exists "Admins manage email outbox" on public.email_outbox;
create policy "Admins manage email outbox"
on public.email_outbox
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- Seed default template rows (idempotent)
insert into public.email_templates (id, label, description, subject, body_html)
values
  ('registration_successful', 'Registration Successful', 'Sent after owner signup.', 'Welcome to Aljamali QR', '<p>Welcome to Aljamali QR.</p>'),
  ('email_verified', 'Email Verified', 'Sent after email verification.', 'Your email is verified', '<p>Your email has been verified.</p>'),
  ('trial_started', 'Trial Started', 'Sent when a trial begins.', 'Your free trial has started', '<p>Your free trial has started.</p>'),
  ('trial_ending_soon', 'Trial Ending Soon', 'Reminder before trial ends.', 'Your trial ends soon', '<p>Your trial is ending soon.</p>'),
  ('trial_expired', 'Trial Expired', 'Sent when trial expires.', 'Your trial has expired', '<p>Your trial has expired.</p>'),
  ('subscription_activated', 'Subscription Activated', 'Sent when a plan activates.', 'Subscription activated', '<p>Your subscription is now active.</p>'),
  ('subscription_renewed', 'Subscription Renewed', 'Sent on renewal.', 'Subscription renewed', '<p>Your subscription was renewed.</p>'),
  ('subscription_cancelled', 'Subscription Cancelled', 'Sent on cancellation.', 'Subscription cancelled', '<p>Your subscription was cancelled.</p>'),
  ('payment_received', 'Payment Received', 'Payment receipt.', 'Payment received', '<p>We received your payment.</p>'),
  ('restaurant_suspended', 'Restaurant Suspended', 'Account suspended notice.', 'Restaurant suspended', '<p>Your restaurant has been suspended.</p>'),
  ('restaurant_reactivated', 'Restaurant Reactivated', 'Account reactivated notice.', 'Restaurant reactivated', '<p>Your restaurant has been reactivated.</p>'),
  ('password_reset', 'Password Reset', 'Password reset email.', 'Reset your password', '<p>Reset your password using the link provided.</p>'),
  ('reservation_confirmation', 'Reservation Confirmation', 'Guest reservation confirm.', 'Reservation confirmed', '<p>Your reservation is confirmed.</p>'),
  ('reservation_cancelled', 'Reservation Cancelled', 'Guest reservation cancelled.', 'Reservation cancelled', '<p>Your reservation was cancelled.</p>'),
  ('new_order', 'New Order', 'Kitchen/owner new order.', 'New order received', '<p>You have a new order.</p>'),
  ('support_reply', 'Support Reply', 'Support ticket reply.', 'New support reply', '<p>You have a new support reply.</p>')
on conflict (id) do nothing;

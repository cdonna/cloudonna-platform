-- ClouDonna Platform — first-party business events
--
-- Phase 11's own framing: "first-party business events only... do not
-- install third-party visitor intelligence... do not send private
-- Donna or Decision data into analytics." This table IS the first-party
-- destination — our own Postgres, nothing external, nothing sent to a
-- vendor. Deliberately anonymous and write-mostly: no user id, no
-- session id, no IP address, nothing that could re-identify a visitor.
-- If that's ever needed, it's a new, explicit decision — not something
-- this table quietly grows into.

create type business_event_name as enum (
  'contact_viewed',
  'inquiry_started',
  'inquiry_submitted',
  'founding_tester_submitted',
  'partner_inquiry_submitted',
  'vendor_inquiry_submitted'
);

create table business_events (
  id uuid primary key default gen_random_uuid(),
  event_name business_event_name not null,
  source_page text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table business_events is
  'First-party-only event log for the six named business events in docs/operations/05-inquiry-system-v2.md. No visitor identity of any kind — no user id, session id, or IP. Not a general-purpose analytics table: adding a new event name means editing business_event_name deliberately, not passing an arbitrary string through from the client.';

create index business_events_name_idx on business_events (event_name);
create index business_events_created_at_idx on business_events (created_at desc);

alter table business_events enable row level security;

-- Public write (any visitor can log one of the six named events), no
-- SELECT policy for anon/authenticated — reading this data back is a
-- staff-only, future reporting concern, not needed by anything today.
create policy business_events_insert_public on business_events
  for insert to anon, authenticated
  with check (true);

create policy business_events_select_staff on business_events
  for select using (is_platform_staff());

-- ClouDonna Platform — Business Operations
-- Migration: first-party Inquiry System + platform staff
--
-- The single backend for every public contact/lead-capture surface —
-- /contact, the homepage Founding Testers section, /early-access,
-- /for-vendors, /for-partners all write here through one API route
-- (apps/web/src/app/api/inquiries/route.ts). Replaces the previous
-- EarlyAccess component's simulated submission (setTimeout, nothing
-- transmitted or stored) with a real, persisted workflow.
--
-- Deliberately excludes any field for decision content, evidence, or
-- org/workspace data — there is no column here an inquiry could carry
-- that kind of data through, by construction, not by convention.

create type inquiry_type as enum (
  'founding_tester',
  'enterprise_pilot',
  'customer',
  'partner',
  'vendor',
  'general'
);

create type inquiry_status as enum ('new', 'in_review', 'responded', 'closed', 'spam');

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type inquiry_type not null,
  name text not null,
  business_email text not null,
  company text,
  role text,
  country text,
  phone text,
  message text,
  source_page text,
  utm_source text,
  utm_campaign text,
  referrer text,
  status inquiry_status not null default 'new',
  owner uuid references profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_name_not_blank check (btrim(name) <> ''),
  constraint inquiries_email_format check (business_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table inquiries is
  'The one first-party inquiry backend for every public contact surface. Public INSERT (anon + authenticated), staff-only SELECT/UPDATE, no DELETE policy at all — a submitted inquiry is never removed, only ever moved to status=closed/spam, so the record stays a real audit trail. Never holds decision content: the column set is fixed and there is no field an evidence/decision payload could land in.';

create index inquiries_status_idx on inquiries (status);
create index inquiries_type_idx on inquiries (inquiry_type);
create index inquiries_created_at_idx on inquiries (created_at desc);
create index inquiries_owner_idx on inquiries (owner);

create trigger inquiries_set_updated_at
  before update on inquiries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Platform staff — who is allowed to see/manage inquiries. Deliberately
-- separate from organization_members: platform operations (ClouDonna
-- running its own business) and customer tenancy (an org using the
-- product) are different concerns, and conflating them would mean
-- "founder views leads" and "customer manages their org" share one
-- privilege model for no good reason. Empty on creation — seeding the
-- first row is a manual, one-time founder action (documented in
-- docs/operations/01-business-operations.md), not something this
-- migration can do without inventing a real user id.

create table platform_staff (
  user_id uuid primary key references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table platform_staff is
  'Grants Founder Dashboard access. Empty until a founder is manually added — see docs/operations/01-business-operations.md, "Seeding the first platform staff member."';

create or replace function is_platform_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from platform_staff s where s.user_id = auth.uid()
  );
$$;

comment on function is_platform_staff() is
  'RLS predicate: true if the current auth.uid() is a seeded platform staff member. Mirrors is_org_admin()''s shape exactly, for a platform-level rather than org-level privilege.';

-- ---------------------------------------------------------------------------
-- Row level security

alter table inquiries enable row level security;
alter table platform_staff enable row level security;

-- Public write, staff-only read/manage. No DELETE policy for any role —
-- inquiries are closed, never removed.
create policy inquiries_insert_public on inquiries
  for insert to anon, authenticated
  with check (true);

create policy inquiries_select_staff on inquiries
  for select using (is_platform_staff());

create policy inquiries_update_staff on inquiries
  for update using (is_platform_staff());

-- platform_staff: no policy for any role — RLS-closed by default, same
-- pattern as billing_webhook_events. is_platform_staff() reads it via
-- security definer regardless; nothing else needs to.

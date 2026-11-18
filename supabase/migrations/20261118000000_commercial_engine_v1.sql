-- ClouDonna Platform — Commercial Engine V1
--
-- Audit finding: the existing `inquiries` table is deliberately an
-- inbox, nothing more ("this is an inbox, nothing more" — its own
-- comment history) — no stage, no value, no owner, no link to a
-- product decision. That is correct for what it is: the first-party
-- capture point for every public contact surface. It is NOT a revenue
-- model, and this migration does not turn it into one. Instead it adds
-- a minimal, genuinely new commercial layer alongside it:
--
--   inquiries (public lead capture, unchanged in spirit)
--        -> commercial_opportunities (internal, staff-only, the
--           actual sales/pipeline record — created by staff once a
--           lead is qualified, optionally referencing the inquiry
--           that originated it)
--
-- Reused without modification: is_platform_staff() (the same RLS
-- predicate gating `inquiries`/`platform_staff`), organizations/
-- decisions (FK targets, never altered), set_updated_at().
--
-- Deliberately NOT built: no CRM activity/task/email-log tables, no
-- quote/contract generation, no revenue recognition ledger — "the
-- minimum internal revenue model ClouDonna genuinely needs" per this
-- brief's own instruction, not a Salesforce rebuild.

-- ---------------------------------------------------------------------------
-- 1. Lead qualification fields on the existing public inquiry inbox.
-- Additive, nullable, optional on every inquiry type — a general or
-- partner inquiry has no reason to fill these. Only decision_sprint/
-- team/enterprise inquiries show them in the UI (InquiryForm's own
-- progressive logic), but the column set itself does not enforce that
-- — a looser, honest constraint, consistent with every other optional
-- field already on this table.

alter table inquiries add column decision_type text;
alter table inquiries add column decision_timeframe text;
alter table inquiries add column investment_at_stake_chf numeric;
alter table inquiries add column current_platforms text;

comment on column inquiries.decision_type is 'Free-text, self-reported — e.g. "Data Platform", "AI Platform", "Cloud Migration". Never inferred.';
comment on column inquiries.decision_timeframe is 'Self-reported urgency band — e.g. "this_quarter", "this_year", "exploring". Free text, not an enum, so new phrasing never needs a migration.';
comment on column inquiries.investment_at_stake_chf is 'The lead''s own rough estimate of what is economically at stake in the decision they are bringing (brief §9''s "Decision Value", captured at first contact — never automatically inferred from company size, industry, or any other signal).';
comment on column inquiries.current_platforms is 'Free-text, self-reported current technology landscape relevant to the decision. Never used to influence any Decision Engine output — see commercial-neutrality firewall tests.';

-- ---------------------------------------------------------------------------
-- 2. inquiry_type gains two new values for the two new commercial
-- entry points this sprint adds to the website. Postgres enum values
-- can only be added, never removed in place — consistent with how
-- 20260809120000_inquiries_taxonomy_refinement.sql already changed
-- this exact enum once before.

alter type inquiry_type add value 'decision_sprint';
alter type inquiry_type add value 'team';

-- ---------------------------------------------------------------------------
-- 3. business_event_name gains the commercial funnel events (brief
-- §30). Additive only — no existing event name changes meaning.

alter type business_event_name add value 'commercial_section_viewed';
alter type business_event_name add value 'decision_sprint_clicked';
alter type business_event_name add value 'team_clicked';
alter type business_event_name add value 'enterprise_clicked';
alter type business_event_name add value 'commercial_form_started';
alter type business_event_name add value 'commercial_form_submitted';

-- ---------------------------------------------------------------------------
-- 4. Commercial data model (brief §10/§11) — Account, Contact,
-- Opportunity, kept to exactly three tables. CommercialPackage,
-- OpportunityStage, Source are enums/text, not separate tables — they
-- have no attributes of their own beyond a name, so a lookup table
-- would be pure overhead. DecisionValue/ExpectedACV/ExpectedTCV/
-- Probability/NextAction/TargetCloseDate are columns on
-- commercial_opportunities, not entities — none of them has an
-- identity or a lifecycle independent of the opportunity they
-- describe.

create type commercial_package as enum ('decision_sprint', 'team', 'enterprise', 'strategic_decision_program');

create type opportunity_stage as enum (
  'inquiry',
  'qualified',
  'discovery',
  'sprint_proposed',
  'sprint_committed',
  'sprint_active',
  'team_expansion',
  'enterprise_evaluation',
  'commercial_negotiation',
  'closed_won',
  'closed_lost'
);

-- Account — the prospect/customer COMPANY, independent of
-- `organizations` (which is live product tenancy: auth, RLS, decision
-- storage). A prospect company that has never signed up has no
-- `organizations` row at all; `organization_id` here is nullable and
-- is only ever set once/if that company becomes a real, authenticated
-- tenant, by staff, explicitly — never inferred from name matching.
create table commercial_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  organization_id uuid references organizations (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  constraint commercial_accounts_name_not_blank check (btrim(name) <> '')
);

comment on table commercial_accounts is
  'The prospect/customer company a commercial opportunity belongs to. Internal, platform-staff-only — never the same thing as `organizations` (product tenancy), though organization_id links the two once/if a prospect becomes a real, signed-up tenant.';

create index commercial_accounts_organization_idx on commercial_accounts (organization_id) where organization_id is not null;
create trigger commercial_accounts_set_updated_at before update on commercial_accounts for each row execute function set_updated_at();

-- Contact — a person at that account.
create table commercial_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references commercial_accounts (id) on delete cascade,
  name text not null,
  email text,
  role text,
  phone text,
  created_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  constraint commercial_contacts_name_not_blank check (btrim(name) <> '')
);

comment on table commercial_contacts is 'A person at a commercial_accounts company — buyer-persona role (CIO, CFO, Enterprise Architect, ...) lives in `role` as free text, not a closed enum, since the real list (brief §26) is long and growing.';

create index commercial_contacts_account_idx on commercial_contacts (account_id);

-- Opportunity — the actual pipeline record.
create table commercial_opportunities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references commercial_accounts (id) on delete cascade,
  primary_contact_id uuid references commercial_contacts (id) on delete set null,
  inquiry_id uuid references inquiries (id) on delete set null,
  -- The actual ClouDonna decision this opportunity is about, once one
  -- exists (brief §17's product-led-sales link) — nullable, since an
  -- opportunity usually exists before any decision is ever started in
  -- the product, and some opportunities (pure Enterprise contract
  -- renewals, say) may never reference one at all.
  decision_id uuid references decisions (id) on delete set null,
  commercial_package commercial_package not null,
  stage opportunity_stage not null default 'inquiry',
  use_case text,
  -- Decision Value (brief §9) — the economic value/investment at
  -- stake in the CUSTOMER's decision, not ClouDonna's own deal size.
  -- Always explicit sales/customer input, never inferred.
  decision_value_chf numeric,
  expected_acv_chf numeric,
  expected_tcv_chf numeric,
  -- Explicit only — null unless a real stage-based probability has
  -- been configured for this opportunity (brief §14: "allow simple
  -- sales-stage probabilities if explicitly configured", never a
  -- fabricated scientific percentage computed automatically).
  probability_percent numeric check (probability_percent is null or (probability_percent >= 0 and probability_percent <= 100)),
  source text,
  next_action text,
  next_action_due_at date,
  target_close_date date,
  notes text,
  owner uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null
);

comment on table commercial_opportunities is
  'The pipeline record (brief §10/§16). Internal, platform-staff-only — commercial data is never tenant-visible and never read by anything in the Decision Engine/scoring path (see the commercial-neutrality firewall tests). decision_id links an opportunity to the real ClouDonna decision it is about, when one exists, for product-led-sales history — this link is read-only context for sales, never a scoring input, and nothing on this table (or any join to it) is ever consulted by scoring/engine.ts.';

create index commercial_opportunities_account_idx on commercial_opportunities (account_id);
create index commercial_opportunities_stage_idx on commercial_opportunities (stage);
create index commercial_opportunities_decision_idx on commercial_opportunities (decision_id) where decision_id is not null;
create index commercial_opportunities_owner_idx on commercial_opportunities (owner);
create index commercial_opportunities_created_at_idx on commercial_opportunities (created_at desc);

create trigger commercial_opportunities_set_updated_at before update on commercial_opportunities for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security — platform-staff-only, full stop. Commercial
-- pipeline data is ClouDonna's own internal business data, never
-- tenant-visible and never public (brief §34). Same posture as
-- `inquiries`/`platform_staff` (is_platform_staff()), not
-- is_org_member() — this is not tenant data.

alter table commercial_accounts enable row level security;
alter table commercial_contacts enable row level security;
alter table commercial_opportunities enable row level security;

create policy commercial_accounts_all on commercial_accounts for all using (is_platform_staff()) with check (is_platform_staff());
create policy commercial_contacts_all on commercial_contacts for all using (is_platform_staff()) with check (is_platform_staff());
create policy commercial_opportunities_all on commercial_opportunities for all using (is_platform_staff()) with check (is_platform_staff());

-- ClouDonna Platform — Revenue Operations & First Customer Engine V1
--
-- Extends Commercial Engine V1 (20261118000000) into an operational
-- system for running real enterprise deals: contract economics,
-- Decision Sprint delivery tracking, sprint/team/enterprise conversion
-- history, cash collection, customer references, and lightweight
-- commercial activity/audit notes. All of it stays platform-staff-only
-- (is_platform_staff()), same posture as commercial_accounts/
-- commercial_contacts/commercial_opportunities — this is ClouDonna's
-- own internal revenue data, never tenant-visible, never public.
--
-- A second, structurally separate group of tables (decision_outcomes,
-- business_case_actuals, assumption_validations) is tenant-scoped
-- (is_org_member()), NOT staff-only — this is the CUSTOMER's own
-- decision outcome data (brief §32-36), which must stay as private to
-- that organization as decisions/decision_versions already are. It is
-- never joined into, or readable from, any platform-staff commercial
-- table, and nothing in it is ever copied into global Vendor
-- Intelligence automatically — see docs/capabilities/
-- revenue-operations.md, "Customer-private vs. global learning".
--
-- Every new table/type name below was checked against every existing
-- migration file for a name collision before being written (the
-- lesson from 20261117180000's evidence_sources collision, which
-- silently rolled back that entire migration in production).
--
-- Reused without modification: is_platform_staff(), is_org_member(),
-- set_updated_at(), commercial_accounts/commercial_contacts/
-- commercial_opportunities/commercial_package/opportunity_stage
-- (20261118000000), decisions/organizations/profiles (tenancy
-- foundation).

-- ---------------------------------------------------------------------------
-- 1. Shared enums.

create type commercial_currency as enum ('CHF', 'EUR', 'USD', 'GBP');

create type commercial_account_status as enum (
  'prospect',
  'active_opportunity',
  'customer',
  'expansion',
  'inactive'
);

-- Buyer persona (brief §6) — GTM reporting only. Deliberately never
-- read by anything under components/donna-ai/ — see the extended
-- neutrality firewall tests.
create type commercial_buyer_persona as enum (
  'cio',
  'cto',
  'cdo',
  'chief_ai_officer',
  'cfo',
  'enterprise_architect',
  'head_of_data',
  'head_of_ai',
  'transformation_leader',
  'procurement',
  'technology_strategy',
  'other'
);

create type commercial_forecast_category as enum ('pipeline', 'upside', 'commit');

create type commercial_lost_reason as enum (
  'no_budget',
  'no_priority',
  'timing',
  'competitor',
  'internal_decision',
  'procurement',
  'no_executive_sponsor',
  'product_gap',
  'security',
  'price',
  'no_response',
  'other'
);

create type commercial_won_reason as enum (
  'decision_urgency',
  'executive_alignment',
  'vendor_neutrality',
  'business_case',
  'evidence_quality',
  'speed',
  'governance',
  'other'
);

create type commercial_billing_frequency as enum ('one_time', 'monthly', 'annual');

create type commercial_contract_status as enum ('draft', 'proposed', 'signed', 'active', 'expired', 'cancelled');

create type commercial_payment_status as enum ('not_invoiced', 'invoiced', 'partially_paid', 'paid', 'overdue');

create type decision_sprint_status as enum (
  'scoping',
  'committed',
  'active',
  'evidence_gathering',
  'analysis',
  'executive_review',
  'completed',
  'on_hold',
  'cancelled'
);

create type commercial_conversion_type as enum (
  'sprint_to_team',
  'team_to_enterprise',
  'sprint_to_enterprise',
  'no_expansion',
  'follow_up_sprint'
);

create type commercial_reference_status as enum ('private', 'anonymous_allowed', 'logo_allowed', 'case_study_allowed');

create type assumption_validation_status as enum ('confirmed', 'invalidated', 'partially_true', 'unknown');

-- ---------------------------------------------------------------------------
-- 2. commercial_accounts (brief §4) — additive enhancement, no
-- destructive column changes. `status` defaults to 'prospect', the
-- correct state for every account already in the table today.

alter table commercial_accounts add column country text;
alter table commercial_accounts add column company_size text;
alter table commercial_accounts add column source text;
alter table commercial_accounts add column icp_fit boolean;
alter table commercial_accounts add column status commercial_account_status not null default 'prospect';
alter table commercial_accounts add column owner uuid references profiles (id) on delete set null;

comment on column commercial_accounts.icp_fit is 'Explicit sales judgment call ("does this match the ICP in docs/commercial/first-million-playbook.md") — never computed from company_size/industry/country.';
comment on column commercial_accounts.status is 'PROSPECT/ACTIVE_OPPORTUNITY/CUSTOMER/EXPANSION/INACTIVE (brief §4) — set by staff, never auto-derived, so a staff member always has the final word on how an account is classified.';

create index commercial_accounts_status_idx on commercial_accounts (status);
create index commercial_accounts_owner_idx on commercial_accounts (owner);

-- ---------------------------------------------------------------------------
-- 3. commercial_contacts (brief §5/§6) — buyer persona + buying-role
-- flags, kept as booleans (a contact can honestly be both the
-- champion and the technical evaluator) rather than a single-select
-- "buying role" enum.

alter table commercial_contacts add column buyer_persona commercial_buyer_persona;
alter table commercial_contacts add column economic_buyer boolean not null default false;
alter table commercial_contacts add column decision_maker boolean not null default false;
alter table commercial_contacts add column technical_evaluator boolean not null default false;
alter table commercial_contacts add column champion boolean not null default false;
alter table commercial_contacts add column procurement boolean not null default false;

comment on column commercial_contacts.buyer_persona is 'GTM reporting only (brief §6) — never read by anything under components/donna-ai/, enforced by the neutrality firewall tests.';

create index commercial_contacts_economic_buyer_idx on commercial_contacts (account_id) where economic_buyer;

-- ---------------------------------------------------------------------------
-- 4. commercial_opportunities (brief §7/§8/§11) — contract-economics
-- and forecast fields. `expected_bookings_chf`/`expected_arr_chf` are
-- new, explicit fields alongside the existing `expected_acv_chf`
-- (kept, unmodified, for backward compatibility with the Commercial
-- Engine V1 rows already in production) — the TypeScript layer
-- (contract-economics.ts) treats expected_acv_chf as a legacy
-- synonym for expected_arr_chf on rows that predate this migration,
-- never the other way around.
--
-- `currency`/`planning_value_chf` implement brief §55: a non-CHF
-- opportunity keeps its real contract currency; `planning_value_chf`
-- is an explicit, manually-approved CHF planning figure a staff member
-- enters by hand — never a fabricated FX conversion.

alter table commercial_opportunities add column currency commercial_currency not null default 'CHF';
alter table commercial_opportunities add column planning_value_chf numeric;
alter table commercial_opportunities add column decision_title text;
alter table commercial_opportunities add column decision_deadline date;
alter table commercial_opportunities add column expected_bookings_chf numeric;
alter table commercial_opportunities add column expected_arr_chf numeric;
alter table commercial_opportunities add column forecast_category commercial_forecast_category;
alter table commercial_opportunities add column lost_reason commercial_lost_reason;
alter table commercial_opportunities add column lost_reason_note text;
alter table commercial_opportunities add column won_reason commercial_won_reason;
alter table commercial_opportunities add column won_reason_note text;
alter table commercial_opportunities add column closed_at timestamptz;
-- Set by the repository whenever `stage` actually changes (never a
-- trigger — see audit_logs' own stated reasoning against DB-side
-- business logic) — pipeline-hygiene.ts's "stale stage" check reads
-- this, not `updated_at`, since updated_at changes on ANY edit.
alter table commercial_opportunities add column stage_changed_at timestamptz not null default now();

comment on column commercial_opportunities.planning_value_chf is 'Manually-approved CHF planning equivalent for a non-CHF opportunity (brief §55) — entered by a staff member, never computed from a live or assumed FX rate.';
comment on column commercial_opportunities.decision_deadline is 'The CUSTOMER''s own decision deadline, distinct from target_close_date (ClouDonna''s own sales close-date target) — brief §21''s pipeline-hygiene "missing decision deadline" check reads this.';

create index commercial_opportunities_forecast_category_idx on commercial_opportunities (forecast_category) where forecast_category is not null;

-- ---------------------------------------------------------------------------
-- 5. commercial_contracts (brief §8/§9) — real contract economics,
-- one row per opportunity (unique FK: an opportunity has at most one
-- contract; a renewal is a new opportunity + a new contract, not an
-- amendment row, consistent with brief §8's "commercial tracking
-- only, not contract authoring").
--
-- Fee fields are denominated in `currency`, not implicitly CHF — see
-- apps/web/src/lib/commercial/contract-economics.ts for the
-- deterministic TCV/ARR/bookings computation. computed_*_chf columns
-- are written by that module at every contract create/update, never
-- hand-edited and never computed by a database trigger (same
-- discipline as decision_impacts/vendor_knowledge_changes) — present
-- here purely so dashboard aggregate queries don't need to
-- recompute every contract's economics on every read, and are null
-- whenever currency != 'CHF' and no planning_value_chf override
-- exists on the parent opportunity (never a fabricated FX figure).

create table commercial_contracts (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references commercial_opportunities (id) on delete cascade,
  contract_start date,
  contract_end date,
  term_months integer check (term_months is null or term_months > 0),
  billing_frequency commercial_billing_frequency not null default 'annual',
  one_time_fee numeric not null default 0,
  services_fee numeric not null default 0,
  recurring_annual_fee numeric not null default 0,
  discount_percent numeric not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  currency commercial_currency not null default 'CHF',
  auto_renewal boolean not null default false,
  payment_terms text,
  contract_status commercial_contract_status not null default 'draft',
  computed_bookings_chf numeric,
  computed_arr_chf numeric,
  computed_tcv_chf numeric,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  constraint commercial_contracts_fees_not_negative check (one_time_fee >= 0 and services_fee >= 0 and recurring_annual_fee >= 0)
);

comment on table commercial_contracts is
  'Real contract economics for one commercial_opportunities row (brief §8/§9). One contract per opportunity by construction (unique index below) — a renewal or expansion is tracked as its own opportunity + contract, never an edit that overwrites this one''s history.';

create unique index commercial_contracts_opportunity_key on commercial_contracts (opportunity_id);
create index commercial_contracts_status_idx on commercial_contracts (contract_status);
create trigger commercial_contracts_set_updated_at before update on commercial_contracts for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. commercial_invoices (brief §12) — minimal cash-collection
-- tracking, not a billing platform. Multiple invoices per contract
-- (milestone billing, e.g. 50% on signing / 50% on delivery) is the
-- realistic shape, hence a separate table rather than more columns on
-- commercial_contracts.

create table commercial_invoices (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references commercial_contracts (id) on delete cascade,
  invoice_amount numeric not null check (invoice_amount >= 0),
  currency commercial_currency not null default 'CHF',
  invoice_date date,
  due_date date,
  paid_amount numeric not null default 0 check (paid_amount >= 0),
  paid_date date,
  payment_status commercial_payment_status not null default 'not_invoiced',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null
);

comment on table commercial_invoices is
  'Minimal payment-status tracking (brief §12) — invoice amount, paid amount, dates, status. No Stripe/billing-platform integration; entered and updated manually by staff.';

create index commercial_invoices_contract_idx on commercial_invoices (contract_id);
create index commercial_invoices_status_idx on commercial_invoices (payment_status);
create trigger commercial_invoices_set_updated_at before update on commercial_invoices for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. decision_sprints (brief §13) — the real operational delivery
-- record for a Decision Sprint engagement. Distinct from
-- commercial_opportunities (the pipeline/sales record, which exists
-- before a sprint is ever scoped) and from `decisions` (the product
-- artifact a sprint produces, once a Decision Workspace is created) —
-- a sprint is the delivery engagement connecting the two.

create table decision_sprints (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references commercial_accounts (id) on delete cascade,
  opportunity_id uuid references commercial_opportunities (id) on delete set null,
  decision_id uuid references decisions (id) on delete set null,
  scope text,
  start_date date,
  target_completion_date date,
  status decision_sprint_status not null default 'scoping',
  executive_sponsor_contact_id uuid references commercial_contacts (id) on delete set null,
  -- Free text, deliberately not a join to a team-member table (brief
  -- §13: "do not create unnecessary project-management complexity") —
  -- e.g. "Jane Doe (ClouDonna lead), 2 analysts".
  working_team text,
  commercial_value_chf numeric,
  outputs text,
  follow_up_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null
);

comment on table decision_sprints is
  'A real Decision Sprint delivery engagement (brief §13) — scope, dates, status, executive sponsor, outputs. Links to commercial_opportunities (the sale) and decisions (the product artifact) without being either.';

create index decision_sprints_account_idx on decision_sprints (account_id);
create index decision_sprints_opportunity_idx on decision_sprints (opportunity_id) where opportunity_id is not null;
create index decision_sprints_decision_idx on decision_sprints (decision_id) where decision_id is not null;
create index decision_sprints_status_idx on decision_sprints (status);
create trigger decision_sprints_set_updated_at before update on decision_sprints for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. decision_sprint_outcomes (brief §14) — captured once, at
-- completion. One row per sprint (unique FK) — a re-opened/extended
-- sprint updates this row rather than accumulating duplicates.
-- Customer disagreement is modeled as a normal, valid outcome
-- (customer_selected_different_option), never as a failure flag.

create table decision_sprint_outcomes (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references decision_sprints (id) on delete cascade,
  recommendation_delivered text,
  final_human_decision text,
  estimated_decision_value_chf numeric,
  business_case_value_chf numeric,
  customer_accepted_recommendation boolean,
  customer_selected_different_option boolean,
  reasons text,
  next_step text,
  expansion_potential text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null
);

comment on table decision_sprint_outcomes is
  'Captured at Decision Sprint completion (brief §14). customer_selected_different_option is a normal, valuable outcome — Decision Memory, not a failure signal.';

create unique index decision_sprint_outcomes_sprint_key on decision_sprint_outcomes (sprint_id);
create trigger decision_sprint_outcomes_set_updated_at before update on decision_sprint_outcomes for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. commercial_conversions (brief §17/§18) — the recorded outcome of
-- a Sprint->Team or Team->Enterprise conversion opportunity, entered
-- by staff once a real outcome is known. Deliberately NOT how
-- Team->Enterprise *candidates* are surfaced (brief §18: "do not
-- automatically create opportunities, surface... for human review") —
-- that surfacing is computed, read-only, in
-- expansion-signals.ts from existing data, with nothing persisted
-- until a human records a real conversion here.

create table commercial_conversions (
  id uuid primary key default gen_random_uuid(),
  from_account_id uuid not null references commercial_accounts (id) on delete cascade,
  from_sprint_id uuid references decision_sprints (id) on delete set null,
  from_opportunity_id uuid references commercial_opportunities (id) on delete set null,
  to_opportunity_id uuid references commercial_opportunities (id) on delete set null,
  conversion_type commercial_conversion_type not null,
  conversion_outcome text,
  conversion_date date,
  conversion_value_chf numeric,
  created_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null
);

comment on table commercial_conversions is
  'Recorded Sprint->Team / Team->Enterprise conversion outcomes (brief §17/§18) — written by staff once a real outcome is known, never auto-generated.';

create index commercial_conversions_account_idx on commercial_conversions (from_account_id);
create index commercial_conversions_type_idx on commercial_conversions (conversion_type);

-- ---------------------------------------------------------------------------
-- 10. commercial_customer_references (brief §46/§47) — one row per
-- account, defaulting to the most conservative posture possible: no
-- public use of any kind until a staff member explicitly records
-- otherwise.

create table commercial_customer_references (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references commercial_accounts (id) on delete cascade,
  reference_status commercial_reference_status not null default 'private',
  allow_anonymous_stats boolean not null default false,
  allow_public_reference boolean not null default false,
  allow_logo_use boolean not null default false,
  allow_case_study boolean not null default false,
  allow_quote boolean not null default false,
  quote_text text,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles (id) on delete set null
);

comment on table commercial_customer_references is
  'Customer reference permission (brief §46/§47). Default is PRIVATE with every allow_* flag false — "no public use" until a staff member explicitly records the customer''s consent. Never used to auto-publish anything; a human still decides what to actually put on the website.';

create unique index commercial_customer_references_account_key on commercial_customer_references (account_id);

-- ---------------------------------------------------------------------------
-- 11. commercial_activities (brief §40/§54) — lightweight commercial
-- notes AND the auditability trail for important commercial field
-- changes (stage, value, won/lost, contract signed, package changed),
-- in one append-only table. Deliberately NOT a reuse of the existing
-- `audit_logs` table: that table's actor_user_id references the
-- legacy pre-auth `users` table, not the auth-linked `profiles` table
-- every commercial write actually has an identity in — joining
-- through it would require a `users` row that commercial staff
-- actions have no reason to have. This table follows the same
-- append-only shape and intent (action/before_data/after_data,
-- write-once, no update/delete policy) without that FK mismatch.

create table commercial_activities (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references commercial_opportunities (id) on delete cascade,
  account_id uuid references commercial_accounts (id) on delete cascade,
  activity_type text not null,
  note text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  constraint commercial_activities_activity_type_not_blank check (btrim(activity_type) <> ''),
  constraint commercial_activities_has_subject check (opportunity_id is not null or account_id is not null)
);

comment on table commercial_activities is
  'Append-only commercial notes + change trail (brief §40/§54) — e.g. activity_type=''stage_changed'', before_data/after_data holding the old/new stage. No update or delete policy for any role, same discipline as audit_logs.';

create index commercial_activities_opportunity_idx on commercial_activities (opportunity_id, created_at desc) where opportunity_id is not null;
create index commercial_activities_account_idx on commercial_activities (account_id, created_at desc) where account_id is not null;

-- ---------------------------------------------------------------------------
-- 12. Row level security — platform-staff-only, matching every table
-- added by 20261118000000. No insert/update/delete policy for any
-- other role; commercial_activities additionally has no update/delete
-- policy for ANY role including staff, keeping it genuinely
-- append-only.

alter table commercial_contracts enable row level security;
alter table commercial_invoices enable row level security;
alter table decision_sprints enable row level security;
alter table decision_sprint_outcomes enable row level security;
alter table commercial_conversions enable row level security;
alter table commercial_customer_references enable row level security;
alter table commercial_activities enable row level security;

create policy commercial_contracts_all on commercial_contracts for all using (is_platform_staff()) with check (is_platform_staff());
create policy commercial_invoices_all on commercial_invoices for all using (is_platform_staff()) with check (is_platform_staff());
create policy decision_sprints_all on decision_sprints for all using (is_platform_staff()) with check (is_platform_staff());
create policy decision_sprint_outcomes_all on decision_sprint_outcomes for all using (is_platform_staff()) with check (is_platform_staff());
create policy commercial_conversions_all on commercial_conversions for all using (is_platform_staff()) with check (is_platform_staff());
create policy commercial_customer_references_all on commercial_customer_references for all using (is_platform_staff()) with check (is_platform_staff());

create policy commercial_activities_select on commercial_activities for select using (is_platform_staff());
create policy commercial_activities_insert on commercial_activities for insert with check (is_platform_staff());

-- ---------------------------------------------------------------------------
-- 13. Customer Outcome Learning foundation (brief §32-36) — tenant-
-- scoped (is_org_member()), structurally separate from every staff-
-- only table above. This is the CUSTOMER's own private decision
-- outcome data, not ClouDonna's commercial/sales data, and never
-- global Vendor Intelligence — see docs/capabilities/
-- revenue-operations.md.

create table decision_outcomes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  recommendation text,
  final_decision text,
  implementation_started boolean not null default false,
  realized_outcome_known boolean not null default false,
  business_case_variance_percent numeric,
  customer_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null
);

comment on table decision_outcomes is
  'DecisionOutcome (brief §32). One row per decision, tenant-private. Does not duplicate per-assumption validation state (see assumption_validations) — "assumptions validated/invalidated" is a derived count, computed from that table, not stored twice here.';

create unique index decision_outcomes_decision_key on decision_outcomes (decision_id);
create index decision_outcomes_org_idx on decision_outcomes (organization_id);
create trigger decision_outcomes_set_updated_at before update on decision_outcomes for each row execute function set_updated_at();

create table business_case_actuals (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  currency commercial_currency not null default 'CHF',
  estimated_cost numeric,
  actual_cost numeric,
  estimated_benefit numeric,
  actual_benefit numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null
);

comment on table business_case_actuals is
  'Business case actuals (brief §33) — estimated vs. actual cost/benefit, entered by the customer''s own organization once real data exists. Never pre-filled or invented; every actual_* column stays null until a tenant user records it.';

create unique index business_case_actuals_decision_key on business_case_actuals (decision_id);
create index business_case_actuals_org_idx on business_case_actuals (organization_id);
create trigger business_case_actuals_set_updated_at before update on business_case_actuals for each row execute function set_updated_at();

create table assumption_validations (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  assumption_text text not null,
  validation_status assumption_validation_status not null default 'unknown',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  constraint assumption_validations_text_not_blank check (btrim(assumption_text) <> '')
);

comment on table assumption_validations is
  'Per-assumption validation record (brief §34) — many rows per decision, one per assumption. Becomes Decision Memory once marked CONFIRMED/INVALIDATED/PARTIALLY_TRUE.';

create index assumption_validations_decision_idx on assumption_validations (decision_id);
create index assumption_validations_org_idx on assumption_validations (organization_id);
create trigger assumption_validations_set_updated_at before update on assumption_validations for each row execute function set_updated_at();

alter table decision_outcomes enable row level security;
alter table business_case_actuals enable row level security;
alter table assumption_validations enable row level security;

create policy decision_outcomes_select on decision_outcomes for select using (is_org_member(organization_id));
create policy decision_outcomes_insert on decision_outcomes for insert with check (is_org_member(organization_id));
create policy decision_outcomes_update on decision_outcomes for update using (is_org_member(organization_id)) with check (is_org_member(organization_id));

create policy business_case_actuals_select on business_case_actuals for select using (is_org_member(organization_id));
create policy business_case_actuals_insert on business_case_actuals for insert with check (is_org_member(organization_id));
create policy business_case_actuals_update on business_case_actuals for update using (is_org_member(organization_id)) with check (is_org_member(organization_id));

create policy assumption_validations_select on assumption_validations for select using (is_org_member(organization_id));
create policy assumption_validations_insert on assumption_validations for insert with check (is_org_member(organization_id));
create policy assumption_validations_update on assumption_validations for update using (is_org_member(organization_id)) with check (is_org_member(organization_id));

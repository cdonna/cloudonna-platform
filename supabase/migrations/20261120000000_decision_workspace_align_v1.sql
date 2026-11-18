-- ClouDonna Platform — Decision Workspace & Agentic Experience V1
-- Align stage (brief §36-39): stakeholder alignment + a minimal
-- decision action plan. The only genuinely new schema this sprint
-- needs — every other lifecycle stage (Understand, Evidence, Compare,
-- Simulate, Challenge, Decide, Remember) is built entirely from
-- already-persisted data (decisions/decision_versions, research_*,
-- vendor-intelligence, decision_outcomes/business_case_actuals/
-- assumption_validations). No equivalent of "who is aligned on this
-- decision" or "what follow-up actions exist" is persisted anywhere
-- today.
--
-- Tenant-scoped (is_org_member()), same posture as decisions/
-- decision_versions — this is the customer's own stakeholder/action
-- data, never platform-staff commercial data and never global vendor
-- knowledge.
--
-- Both table/type names checked against every existing migration
-- file AND directly against production's information_schema before
-- writing this file — no collision (the standing lesson from the
-- evidence_sources collision in 20261117180000, which silently rolled
-- back that entire migration).

create type decision_alignment_status as enum ('not_reviewed', 'aligned', 'conditional', 'objected', 'approved');
create type decision_action_status as enum ('open', 'done');

create table decision_stakeholders (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  -- Free text, not a profile_id FK: a stakeholder relevant to an
  -- enterprise technology decision (Finance, Security, an external
  -- Economic Buyer) is very often not a ClouDonna product user at
  -- all. Email is optional, for the same reason.
  name text not null,
  role text,
  email text,
  alignment_status decision_alignment_status not null default 'not_reviewed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  constraint decision_stakeholders_name_not_blank check (btrim(name) <> '')
);

comment on table decision_stakeholders is
  'Align stage (brief §37/§38) — who needs to know, who supports, who objects. alignment_status is set explicitly by a human reviewing on the stakeholder''s behalf; never inferred from inactivity (brief §38''s own "do not infer alignment from inactivity").';

create index decision_stakeholders_decision_idx on decision_stakeholders (decision_id);
create index decision_stakeholders_org_idx on decision_stakeholders (organization_id);
create trigger decision_stakeholders_set_updated_at before update on decision_stakeholders for each row execute function set_updated_at();

create table decision_action_items (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  action text not null,
  -- Free text, same reasoning as decision_stakeholders.name — an
  -- action owner is frequently a named person who is not a ClouDonna
  -- user (e.g. "Procurement", "Jane Doe, Security").
  owner text,
  target_date date,
  status decision_action_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  constraint decision_action_items_action_not_blank check (btrim(action) <> '')
);

comment on table decision_action_items is
  'Minimal decision action plan (brief §39) — deliberately not a project-management system: action/owner/target date/status and nothing else.';

create index decision_action_items_decision_idx on decision_action_items (decision_id);
create index decision_action_items_org_idx on decision_action_items (organization_id);
create trigger decision_action_items_set_updated_at before update on decision_action_items for each row execute function set_updated_at();

alter table decision_stakeholders enable row level security;
alter table decision_action_items enable row level security;

create policy decision_stakeholders_select on decision_stakeholders for select using (is_org_member(organization_id));
create policy decision_stakeholders_insert on decision_stakeholders for insert with check (is_org_member(organization_id));
create policy decision_stakeholders_update on decision_stakeholders for update using (is_org_member(organization_id)) with check (is_org_member(organization_id));

create policy decision_action_items_select on decision_action_items for select using (is_org_member(organization_id));
create policy decision_action_items_insert on decision_action_items for insert with check (is_org_member(organization_id));
create policy decision_action_items_update on decision_action_items for update using (is_org_member(organization_id)) with check (is_org_member(organization_id));

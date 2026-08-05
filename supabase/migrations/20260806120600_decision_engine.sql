-- ClouDonna Platform — Database Foundation
-- Migration 07: the decision engine core (tenant-scoped)
--
-- This is the persistence layer for the ClouDonna Decision Framework:
--   Business Goal -> Capabilities -> Requirements -> Constraints
--   -> Solution/Technology (Recommendations + Decision Scores)
--   -> Decision Report
-- Every table here belongs to exactly one organization. organization_id is
-- denormalized onto every table (not just derived via decision_session_id)
-- for single-join RLS, per the tenancy migration's stated design.
--
-- decision_frameworks/decision_framework_dimensions is the persistence
-- target for the Sprint 3 SCORE_WEIGHTS / SCORE_DIMENSION_LABELS constants
-- (apps/web/.../scoring/weights.ts) — today those are a hardcoded
-- TypeScript record; here they become data, and organizations get the
-- option to define their own weighting in the future without a code change.

create table decision_frameworks (
  id uuid primary key default gen_random_uuid(),
  -- null = a platform-wide default framework, visible to every org.
  -- not null = an org-specific customization. See docs, "Hybrid global/
  -- tenant tables".
  organization_id uuid references organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  version integer not null default 1,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint decision_frameworks_name_not_blank check (btrim(name) <> '')
);

comment on table decision_frameworks is
  'A named, versioned scoring methodology — which dimensions exist and how they''re weighted (decision_framework_dimensions). The seeded platform default corresponds exactly to today''s Donna Score v2 model (10 dimensions, weights summing to 1.0).';

create unique index decision_frameworks_org_slug_key
  on decision_frameworks (coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), slug)
  where deleted_at is null;
create index decision_frameworks_org_idx on decision_frameworks (organization_id) where deleted_at is null;
create index decision_frameworks_created_by_idx on decision_frameworks (created_by);
create trigger decision_frameworks_set_updated_at before update on decision_frameworks for each row execute function set_updated_at();

create table decision_framework_dimensions (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references decision_frameworks (id) on delete cascade,
  dimension_key score_dimension_key not null,
  label text not null,
  weight numeric(4,3) not null check (weight >= 0 and weight <= 1),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null
);

comment on table decision_framework_dimensions is
  'One row per scoring dimension within a framework. The application layer, not the database, is responsible for checking that weights sum to 1.0 for a given framework — see docs, "No business logic inside the database".';

create unique index decision_framework_dimensions_key
  on decision_framework_dimensions (framework_id, dimension_key);
create index decision_framework_dimensions_created_by_idx on decision_framework_dimensions (created_by);
create trigger decision_framework_dimensions_set_updated_at before update on decision_framework_dimensions for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table decision_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  workspace_id uuid not null references workspaces (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  framework_id uuid references decision_frameworks (id) on delete set null,
  title text not null,
  status decision_session_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint decision_sessions_title_not_blank check (btrim(title) <> '')
);

comment on table decision_sessions is
  'One run of the Discovery -> Recommendation flow for a specific project — the aggregate root that business_goals, requirements, constraints, recommendations, decision_scores and decision_reports all hang off. Corresponds to a single completed Donna AI assessment today, generalized beyond the current single-form UI.';

create index decision_sessions_project_idx on decision_sessions (project_id) where deleted_at is null;
create index decision_sessions_org_idx on decision_sessions (organization_id) where deleted_at is null;
create index decision_sessions_status_idx on decision_sessions (status) where deleted_at is null;
create index decision_sessions_workspace_idx on decision_sessions (workspace_id) where deleted_at is null;
create index decision_sessions_framework_idx on decision_sessions (framework_id) where deleted_at is null;
create index decision_sessions_created_by_idx on decision_sessions (created_by);
-- Supports "recent sessions for this project" — a genuinely common list
-- view — as an index-only sort instead of a sort-after-scan.
create index decision_sessions_project_created_at_idx
  on decision_sessions (project_id, created_at desc) where deleted_at is null;
create trigger decision_sessions_set_updated_at before update on decision_sessions for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table business_goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  decision_session_id uuid not null references decision_sessions (id) on delete cascade,
  goal_tag goal_tag,
  custom_goal_text text,
  priority smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint business_goals_has_content check (goal_tag is not null or custom_goal_text is not null)
);

comment on table business_goals is
  'The starting point of every session, deliberately first in the schema''s dependency chain, mirroring the framework''s "goal first" principle. Supports both the fixed goal_tag vocabulary (today''s wizard) and free-text goals (custom_goal_text), since a business-first platform cannot limit real customers to 8 pre-set tags.';

create index business_goals_session_idx on business_goals (decision_session_id) where deleted_at is null;
create index business_goals_org_idx on business_goals (organization_id) where deleted_at is null;
create index business_goals_created_by_idx on business_goals (created_by);
create trigger business_goals_set_updated_at before update on business_goals for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table decision_session_capabilities (
  decision_session_id uuid not null references decision_sessions (id) on delete cascade,
  capability_id uuid not null references capabilities (id) on delete cascade,
  priority text not null default 'must-have' check (priority in ('must-have', 'nice-to-have')),
  created_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null,
  primary key (decision_session_id, capability_id)
);

comment on table decision_session_capabilities is
  'The required capabilities implied by a session''s business goal(s) — pure junction/current-state table, not independently soft-deletable: a capability requirement is either part of the session right now or it isn''t. The session''s eventual decision_report is the durable historical record, not this table.';

create index decision_session_capabilities_capability_idx on decision_session_capabilities (capability_id);
create index decision_session_capabilities_created_by_idx on decision_session_capabilities (created_by);

alter table decision_session_capabilities enable row level security;
create policy decision_session_capabilities_all on decision_session_capabilities
  for all using (
    exists (
      select 1 from decision_sessions s
      where s.id = decision_session_capabilities.decision_session_id
        and s.deleted_at is null
        and is_org_member(s.organization_id)
    )
  );

-- ---------------------------------------------------------------------------

create table requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  decision_session_id uuid not null references decision_sessions (id) on delete cascade,
  capability_id uuid references capabilities (id) on delete set null,
  title text not null,
  description text,
  is_mandatory boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint requirements_title_not_blank check (btrim(title) <> '')
);

comment on table requirements is
  'A specific, session-authored requirement (e.g. "Must support row-level security for EU entities"), optionally traced back to a capability from the shared taxonomy. Distinct from decision_session_capabilities: capabilities are which capability areas matter; requirements are the concrete, often free-text specifics within them.';

create index requirements_session_idx on requirements (decision_session_id) where deleted_at is null;
create index requirements_org_idx on requirements (organization_id) where deleted_at is null;
create index requirements_capability_idx on requirements (capability_id) where deleted_at is null;
create index requirements_created_by_idx on requirements (created_by);
create trigger requirements_set_updated_at before update on requirements for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table session_constraints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  decision_session_id uuid not null references decision_sessions (id) on delete cascade,
  constraint_type constraint_type not null,
  value text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint session_constraints_value_not_blank check (btrim(value) <> '')
);

comment on table session_constraints is
  'Budget, timeline, risk appetite, and similar bounding factors for a session. `value` is free text rather than one SQL enum per constraint_type (today''s wizard uses small fixed vocabularies like BudgetLevel/RiskAppetite per type, but those belong to the application layer''s validation, not a database-level type per row).';

create index session_constraints_session_idx on session_constraints (decision_session_id) where deleted_at is null;
create index session_constraints_org_idx on session_constraints (organization_id) where deleted_at is null;
create index session_constraints_created_by_idx on session_constraints (created_by);
create trigger session_constraints_set_updated_at before update on session_constraints for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  decision_session_id uuid not null references decision_sessions (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  rank smallint not null,
  overall_score numeric(5,2) not null check (overall_score between 0 and 100),
  summary text,
  is_primary boolean not null default false,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null
);

comment on table recommendations is
  'One ranked platform option for a session (the "Recommended Platforms" and "Alternatives" of today''s executive report are both rows here, distinguished by rank/is_primary). product_id uses ON DELETE RESTRICT, not CASCADE: a catalog product must not silently vanish from a customer''s historical recommendation record.';

create unique index recommendations_session_product_key
  on recommendations (decision_session_id, product_id) where deleted_at is null;
create index recommendations_session_idx on recommendations (decision_session_id) where deleted_at is null;
create index recommendations_product_idx on recommendations (product_id) where deleted_at is null;
create index recommendations_org_idx on recommendations (organization_id) where deleted_at is null;
create index recommendations_created_by_idx on recommendations (created_by);
create trigger recommendations_set_updated_at before update on recommendations for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table decision_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  recommendation_id uuid not null references recommendations (id) on delete cascade,
  dimension_key score_dimension_key not null,
  score numeric(5,2) not null check (score between 0 and 100),
  weight numeric(4,3) not null check (weight between 0 and 1),
  positive_evidence text[] not null default '{}',
  negative_evidence text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null
);

comment on table decision_scores is
  'The per-dimension breakdown behind one recommendation''s overall_score — the persistence target for scoring/types.ts DimensionResult. weight is copied from decision_framework_dimensions at generation time (not looked up live), so a later change to a framework''s weights never silently rewrites the meaning of a past report.';

create unique index decision_scores_recommendation_dimension_key
  on decision_scores (recommendation_id, dimension_key) where deleted_at is null;
create index decision_scores_recommendation_idx on decision_scores (recommendation_id) where deleted_at is null;
create index decision_scores_org_idx on decision_scores (organization_id) where deleted_at is null;
create index decision_scores_created_by_idx on decision_scores (created_by);
create trigger decision_scores_set_updated_at before update on decision_scores for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table decision_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  decision_session_id uuid not null references decision_sessions (id) on delete cascade,
  executive_summary text,
  -- Structured report body (current situation, decision drivers, risks,
  -- next steps, etc.) kept as jsonb rather than a fixed set of columns: the
  -- report's section list is still evolving (see docs/sprint-3.md,
  -- "Executive Report v2") and jsonb lets it keep evolving without a
  -- migration for every new section.
  full_report jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null
);

comment on table decision_reports is
  'The final, shareable artifact for a session. A session can accumulate more than one report row over time (e.g. regenerated after new requirements are added) — this table is an append-only history of report versions, not a single mutable "current report" field on decision_sessions.';

create index decision_reports_session_idx on decision_reports (decision_session_id) where deleted_at is null;
create index decision_reports_org_idx on decision_reports (organization_id) where deleted_at is null;
create index decision_reports_created_by_idx on decision_reports (created_by);
create trigger decision_reports_set_updated_at before update on decision_reports for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

-- Evidence is global reference data (the same citation can support scores
-- across many organizations' sessions), same pattern as analyst_reports.
create table evidence_sources (
  id uuid primary key default gen_random_uuid(),
  analyst_report_id uuid references analyst_reports (id) on delete set null,
  title text not null,
  publisher text,
  url text,
  reliability_tier evidence_reliability_tier not null default 'internal_review',
  retrieved_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint evidence_sources_title_not_blank check (btrim(title) <> '')
);

comment on table evidence_sources is
  'A reusable citation. Most decision_scores evidence today is generated narrative text (positive_evidence/negative_evidence arrays); this table is for when a specific external source backs a score, and the same source is very likely cited again elsewhere.';

create index evidence_sources_analyst_report_idx on evidence_sources (analyst_report_id) where deleted_at is null;
create index evidence_sources_created_by_idx on evidence_sources (created_by);
create trigger evidence_sources_set_updated_at before update on evidence_sources for each row execute function set_updated_at();

alter table evidence_sources enable row level security;
create policy evidence_sources_public_select on evidence_sources for select using (deleted_at is null);

create table decision_score_evidence_sources (
  decision_score_id uuid not null references decision_scores (id) on delete cascade,
  evidence_source_id uuid not null references evidence_sources (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (decision_score_id, evidence_source_id)
);

comment on table decision_score_evidence_sources is
  'Junction linking a specific dimension score to the external evidence_sources that support it. Pure junction table (see decision_session_capabilities for the same reasoning).';

create index decision_score_evidence_sources_evidence_idx on decision_score_evidence_sources (evidence_source_id);

alter table decision_score_evidence_sources enable row level security;
create policy decision_score_evidence_sources_select on decision_score_evidence_sources
  for select using (
    exists (
      select 1 from decision_scores sc
      where sc.id = decision_score_evidence_sources.decision_score_id
        and sc.deleted_at is null
        and is_org_member(sc.organization_id)
    )
  );

-- ---------------------------------------------------------------------------

create table saved_comparisons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  workspace_id uuid references workspaces (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  decision_session_id uuid references decision_sessions (id) on delete set null,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint saved_comparisons_name_not_blank check (btrim(name) <> '')
);

comment on table saved_comparisons is
  'A user-curated side-by-side product comparison (the ComparisonMatrix component''s persisted form), optionally but not necessarily tied to a decision_session — a user can compare products speculatively before or outside a formal session.';

create index saved_comparisons_org_idx on saved_comparisons (organization_id) where deleted_at is null;
create index saved_comparisons_session_idx on saved_comparisons (decision_session_id) where deleted_at is null;
create index saved_comparisons_workspace_idx on saved_comparisons (workspace_id) where deleted_at is null;
create index saved_comparisons_project_idx on saved_comparisons (project_id) where deleted_at is null;
create index saved_comparisons_created_by_idx on saved_comparisons (created_by);
create trigger saved_comparisons_set_updated_at before update on saved_comparisons for each row execute function set_updated_at();

create table saved_comparison_products (
  saved_comparison_id uuid not null references saved_comparisons (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (saved_comparison_id, product_id)
);

comment on table saved_comparison_products is
  'The (up to four, enforced by the application layer to match ComparisonMatrix''s UI limit, not by the database) products in a saved comparison.';

create index saved_comparison_products_product_idx on saved_comparison_products (product_id);

alter table saved_comparison_products enable row level security;
create policy saved_comparison_products_all on saved_comparison_products
  for all using (
    exists (
      select 1 from saved_comparisons c
      where c.id = saved_comparison_products.saved_comparison_id
        and c.deleted_at is null
        and is_org_member(c.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Uniform tenant-scoped RLS for the tables above whose policy shape is
-- identical: members of the owning organization can read/write non-deleted
-- rows, scoped through the denormalized organization_id column.
do $$
declare
  t text;
begin
  foreach t in array array[
    'decision_frameworks', 'decision_sessions', 'business_goals',
    'requirements', 'session_constraints', 'recommendations', 'decision_scores',
    'decision_reports', 'saved_comparisons'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_select on %I for select using (deleted_at is null and is_org_member(organization_id))',
      t, t
    );
    execute format(
      'create policy %I_insert on %I for insert with check (is_org_member(organization_id))',
      t, t
    );
    execute format(
      'create policy %I_update on %I for update using (deleted_at is null and is_org_member(organization_id))',
      t, t
    );
  end loop;
end $$;

-- decision_frameworks additionally needs to expose the platform-wide
-- default (organization_id is null) to every organization, on top of the
-- org-scoped policy the loop above already created.
create policy decision_frameworks_select_global on decision_frameworks
  for select using (deleted_at is null and organization_id is null);

create policy decision_framework_dimensions_select on decision_framework_dimensions
  for select using (
    exists (
      select 1 from decision_frameworks f
      where f.id = decision_framework_dimensions.framework_id
        and f.deleted_at is null
        and (f.organization_id is null or is_org_member(f.organization_id))
    )
  );

alter table decision_framework_dimensions enable row level security;

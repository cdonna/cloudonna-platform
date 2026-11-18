-- ClouDonna Platform — Vendor Intelligence & Evidence Graph V1
--
-- AUDIT FINDING (see docs/capabilities/vendor-intelligence-and-evidence-graph.md
-- §A for the full writeup): this codebase already has TWO parallel,
-- disconnected vendor data models:
--
--  1. The Sprint 3/4 Enterprise Intelligence Graph (`vendors`, `products`,
--     `capabilities`, `vendor_sources`, `vendor_evidence`, ...) — real
--     tables, but unpopulated (no seed migration ever ran) and read by
--     nothing in the live Decision Engine.
--  2. The live Decision Engine's `VendorPlatformProfile` catalog
--     (apps/web/.../vendor-intelligence/catalog.ts) — 10 hardcoded
--     TypeScript objects with stable string ids ("sap-bdc", "databricks",
--     ...), read by scoring/engine.ts on every request, with zero
--     database presence and zero provenance.
--
-- This migration deliberately does NOT try to unify them in one sprint —
-- that is a larger, riskier migration than this brief asks for, and the
-- legacy EIG tables are not "genuinely missing" infrastructure this brief
-- needs (they serve the public Compare tool, a different surface). What
-- IS genuinely missing — and what this migration adds — is a provenance
-- graph for the catalog the live, already-shipped Decision Engine,
-- Research Agent, Business Case Engine and Challenger Agent actually use
-- today. Every new table below keys vendor/product identity by the exact
-- same stable text slugs already used throughout research_evidence.option_id
-- and the TypeScript catalog's own `id` field — no new identity space,
-- no FK to the legacy `vendors`/`products` tables, additive only.
--
-- Reused without modification: is_org_member(), is_platform_staff(),
-- set_updated_at(), the organizations/decisions/profiles tables, and the
-- six-type EvidenceType vocabulary's naming discipline (kept distinct
-- from the new source-category enum below per this brief's own §6
-- instruction not to conflate the two taxonomies).

-- ---------------------------------------------------------------------------
-- 1. Capability taxonomy — vendor-neutral, bounded, a lookup table (not a
-- pg enum) specifically so a future category can be added without an
-- ALTER TYPE migration. Seeded with the brief's own §25 list; group is
-- purely organizational (UI section headers), not a scoring input.

create table capability_categories (
  key text primary key,
  label text not null,
  category_group text not null,
  description text not null,
  created_at timestamptz not null default now()
);

comment on table capability_categories is
  'Canonical, vendor-neutral capability taxonomy (brief §25/§26). Modeled at the level of what a capability structurally IS ("Unified Data Storage Architecture"), never at the level of one vendor''s product name for it ("OneLake") — a vendor-specific name is evidence/implementation detail attached to a claim against one of these categories, never a category of its own. Platform-staff-maintained; not org-writable.';

alter table capability_categories enable row level security;
create policy capability_categories_select on capability_categories for select using (auth.uid() is not null);
create policy capability_categories_write on capability_categories for all using (is_platform_staff()) with check (is_platform_staff());

insert into capability_categories (key, label, category_group, description) values
  ('architecture', 'Architecture', 'Foundation', 'Overall structural approach — monolith vs. composable, layered data/compute separation, open vs. proprietary formats.'),
  ('data_integration', 'Data Integration', 'Foundation', 'Moving and connecting data across systems — batch, CDC, API-based.'),
  ('data_engineering', 'Data Engineering', 'Foundation', 'Pipeline authoring, orchestration, transformation tooling.'),
  ('data_warehouse', 'Data Warehouse', 'Foundation', 'Structured, SQL-first analytical storage and query engines.'),
  ('lakehouse', 'Lakehouse', 'Foundation', 'Open-table-format storage unifying warehouse and lake workloads.'),
  ('streaming', 'Streaming', 'Foundation', 'Real-time/event-driven data ingestion and processing.'),
  ('governance', 'Governance', 'Trust', 'Cataloging, lineage, access policy and stewardship over data assets.'),
  ('data_quality', 'Data Quality', 'Trust', 'Validation, profiling, and quality-rule enforcement.'),
  ('master_data', 'Master Data', 'Trust', 'Golden-record and reference-data management.'),
  ('semantic_layer', 'Semantic Layer', 'Trust', 'A shared, governed business-metric/definition layer above raw data.'),
  ('analytics', 'Analytics', 'Insight', 'BI, dashboarding and ad hoc query capability.'),
  ('planning', 'Planning', 'Insight', 'Forecasting, budgeting and enterprise planning workflows.'),
  ('ai_ml', 'AI / ML', 'Intelligence', 'Classical machine learning model development and serving.'),
  ('genai', 'GenAI', 'Intelligence', 'Generative AI / LLM-based capability, including retrieval-augmented generation.'),
  ('agentic_ai', 'Agentic AI', 'Intelligence', 'Autonomous or semi-autonomous multi-step AI agents acting on data/systems.'),
  ('security', 'Security', 'Trust', 'Authentication, encryption, network isolation and platform security posture.'),
  ('compliance', 'Compliance', 'Trust', 'Formal certifications and regulatory attestations (e.g. ISO, SOC, FedRAMP).'),
  ('data_sovereignty', 'Data Sovereignty', 'Trust', 'Data residency guarantees and sovereign-cloud operating models.'),
  ('observability', 'Observability', 'Operations', 'Monitoring, cost/usage visibility and operational telemetry.'),
  ('developer_experience', 'Developer Experience', 'Operations', 'SDKs, CLIs, local development and API ergonomics.'),
  ('operations', 'Operations', 'Operations', 'Day-to-day platform operability — patching, scaling, SRE surface.'),
  ('cost_management', 'Cost Management', 'Operations', 'Consumption visibility, budgeting and cost-control tooling.'),
  ('hybrid_multicloud', 'Hybrid / Multi-cloud', 'Foundation', 'Operating across more than one cloud or on-prem plus cloud.'),
  ('sap_integration', 'SAP Integration', 'Ecosystem', 'Native or certified integration with SAP transactional systems.'),
  ('microsoft_integration', 'Microsoft Integration', 'Ecosystem', 'Native or certified integration with the Microsoft/Azure ecosystem.'),
  ('google_integration', 'Google Integration', 'Ecosystem', 'Native or certified integration with the Google Cloud ecosystem.'),
  ('aws_integration', 'AWS Integration', 'Ecosystem', 'Native or certified integration with the AWS ecosystem.'),
  ('open_ecosystem', 'Open Ecosystem', 'Ecosystem', 'Support for open standards/formats not owned by any single vendor (e.g. Iceberg, Delta, Parquet).');

-- ---------------------------------------------------------------------------
-- 2. Canonical sources — one row per real document, reused across every
-- piece of evidence it backs (brief §6/§9). Deliberately a DIFFERENT
-- enum from research_evidence's inline evidence_type check and from the
-- legacy vendor_source_type (brief §6: source taxonomy answers "what
-- kind of document is this", not "what kind of evidence relationship is
-- this"). Values mirror research/types.ts's existing SourceType exactly
-- — the same vocabulary Research Agent V1 already uses, not a second one.

create type evidence_source_category as enum (
  'official_vendor_documentation',
  'official_product_documentation',
  'official_security_compliance',
  'official_architecture',
  'official_pricing_licensing',
  'official_release_notes',
  'standards_body',
  'independent_analysis',
  'unknown'
);

create table vendor_evidence_sources (
  id uuid primary key default gen_random_uuid(),
  canonical_url text not null,
  retrieved_url text not null,
  title text not null,
  publisher text not null,
  source_category evidence_source_category not null default 'unknown',
  published_at date,
  retrieved_at timestamptz not null default now(),
  last_verified_at timestamptz,
  language text,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  constraint vendor_evidence_sources_canonical_url_not_blank check (btrim(canonical_url) <> '')
);

comment on table vendor_evidence_sources is
  'The canonical document registry (brief §6). canonical_url is the deduplication key (fragment/trailing-slash/tracking-param normalized by the application layer before insert — see vendor-intelligence/source-normalization.ts); retrieved_url preserves the exact URL actually fetched, which can legitimately differ (redirect target, retrieved with a query string) without being a different source. Global knowledge: readable by any authenticated user, writable only by platform staff — see RLS below.';

create unique index vendor_evidence_sources_canonical_url_key on vendor_evidence_sources (canonical_url);
create index vendor_evidence_sources_category_idx on vendor_evidence_sources (source_category);
create index vendor_evidence_sources_created_by_idx on vendor_evidence_sources (created_by);
create trigger vendor_evidence_sources_set_updated_at before update on vendor_evidence_sources for each row execute function set_updated_at();

alter table vendor_evidence_sources enable row level security;
create policy vendor_evidence_sources_select on vendor_evidence_sources for select using (auth.uid() is not null);
create policy vendor_evidence_sources_write on vendor_evidence_sources for all using (is_platform_staff()) with check (is_platform_staff());

-- ---------------------------------------------------------------------------
-- 3. Capability claims — the canonical CapabilityClaim (brief §5/§12).
-- `verification_status` answers "how well is this backed by evidence
-- right now" (recomputed as evidence changes); `lifecycle_status`
-- answers "is this claim currently operative" (set by human review /
-- supersession, never recomputed automatically). Two different
-- questions, two columns — forcing one enum to answer both is exactly
-- the kind of conflation brief §6 warns against for sources, and the
-- same reasoning applies here.

create type claim_verification_status as enum (
  'verified', 'partially_verified', 'conflicted', 'stale', 'unknown'
);

create type claim_lifecycle_status as enum (
  'proposed', 'active', 'superseded', 'rejected'
);

create type evidence_scope as enum ('global', 'organization_private');

create table vendor_capability_claims (
  id uuid primary key default gen_random_uuid(),
  -- Stable text slugs from the live VendorPlatformProfile catalog
  -- (vendor-intelligence/catalog.ts) — never a new identity space, and
  -- deliberately not an FK to the legacy, unpopulated `products` table.
  -- Validated against the real catalog at the application layer
  -- (vendor-intelligence/claims/validate-product-slug.ts), the same way
  -- research_evidence.option_id already is.
  vendor_slug text not null,
  product_slug text not null,
  capability_key text not null references capability_categories (key),
  claim text not null,
  verification_status claim_verification_status not null default 'unknown',
  lifecycle_status claim_lifecycle_status not null default 'proposed',
  -- Evidence Quality Score (brief §40) — HIGH/MEDIUM/LOW, never a
  -- fabricated percentage. Recomputed deterministically from this
  -- claim's own evidence rows (source authority, freshness, directness,
  -- corroboration, conflicts) — see vendor-intelligence/claims/quality.ts.
  evidence_quality text check (evidence_quality in ('high', 'medium', 'low')),
  valid_from date,
  valid_to date,
  last_verified_at timestamptz,
  version integer not null default 1,
  superseded_by uuid references vendor_capability_claims (id) on delete set null,
  scope evidence_scope not null default 'global',
  -- Required and FK'd only when scope = 'organization_private'; enforced
  -- by the check constraint below rather than two separate tables, so a
  -- promotion from private to global (brief §49, via promote_vendor_claim
  -- below) is a single, auditable UPDATE rather than a copy across tables.
  organization_id uuid references organizations (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  constraint vendor_capability_claims_claim_not_blank check (btrim(claim) <> ''),
  constraint vendor_capability_claims_vendor_slug_not_blank check (btrim(vendor_slug) <> ''),
  constraint vendor_capability_claims_product_slug_not_blank check (btrim(product_slug) <> ''),
  constraint vendor_capability_claims_scope_org_consistency check (
    (scope = 'global' and organization_id is null) or
    (scope = 'organization_private' and organization_id is not null)
  ),
  constraint vendor_capability_claims_valid_range check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

comment on table vendor_capability_claims is
  'CapabilityClaim (brief §3/§5). UNKNOWN is the default verification_status and PROPOSED the default lifecycle_status — a claim must be explicitly earned into VERIFIED/ACTIVE by real evidence and (for global claims) human review, never defaulted into looking authoritative. scope=organization_private rows are one tenant''s own context about a vendor (brief §32) and are never readable by another organization; they are never auto-merged into scope=global rows (see promote_vendor_claim below for the only path that creates a new global claim informed by one, which still requires platform-staff review).';

create index vendor_capability_claims_product_idx on vendor_capability_claims (product_slug, capability_key);
create index vendor_capability_claims_vendor_idx on vendor_capability_claims (vendor_slug);
create index vendor_capability_claims_org_idx on vendor_capability_claims (organization_id) where organization_id is not null;
create index vendor_capability_claims_status_idx on vendor_capability_claims (verification_status, lifecycle_status);
create index vendor_capability_claims_superseded_by_idx on vendor_capability_claims (superseded_by) where superseded_by is not null;
create trigger vendor_capability_claims_set_updated_at before update on vendor_capability_claims for each row execute function set_updated_at();

alter table vendor_capability_claims enable row level security;

create policy vendor_capability_claims_select on vendor_capability_claims
  for select using (
    scope = 'global' or (scope = 'organization_private' and is_org_member(organization_id))
  );

create policy vendor_capability_claims_insert on vendor_capability_claims
  for insert with check (
    (scope = 'organization_private' and is_org_member(organization_id) and created_by = auth.uid())
    or (scope = 'global' and is_platform_staff())
  );

create policy vendor_capability_claims_update on vendor_capability_claims
  for update using (
    (scope = 'organization_private' and is_org_member(organization_id))
    or (scope = 'global' and is_platform_staff())
  );

-- No DELETE policy for any role — a claim is retired via lifecycle_status
-- ('rejected'/'superseded'), never removed, so Decision Memory can always
-- answer "what did we believe when this decision was made" (brief §34).

-- ---------------------------------------------------------------------------
-- 4. Evidence — one extracted assertion from exactly one source, backing
-- exactly one claim (brief §7/§8). Multiple Evidence rows with different
-- source_id values backing the same claim_id is how "multiple sources
-- per claim" is represented — never three duplicate claims.

create type evidence_polarity as enum ('supports', 'contradicts');

create table vendor_capability_evidence (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references vendor_capability_claims (id) on delete cascade,
  source_id uuid not null references vendor_evidence_sources (id) on delete cascade,
  polarity evidence_polarity not null default 'supports',
  excerpt text,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  research_session_id uuid references research_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null
);

comment on table vendor_capability_evidence is
  'Evidence (brief §7): Source → Evidence → Claim, with polarity distinguishing SUPPORTS from CONTRADICTS (brief §3''s two separate relationships, modeled as one column rather than two edge tables). research_session_id is set only when this evidence originated from a Research Agent run (brief §49) — null for evidence entered by direct human curation. No UPDATE policy: evidence is immutable once recorded — a correction is a new row, not an edit, so the claim''s history of what was believed and why never silently changes.';

create index vendor_capability_evidence_claim_idx on vendor_capability_evidence (claim_id);
create index vendor_capability_evidence_source_idx on vendor_capability_evidence (source_id);
create index vendor_capability_evidence_session_idx on vendor_capability_evidence (research_session_id) where research_session_id is not null;

alter table vendor_capability_evidence enable row level security;

create policy vendor_capability_evidence_select on vendor_capability_evidence
  for select using (
    exists (
      select 1 from vendor_capability_claims c
      where c.id = vendor_capability_evidence.claim_id
        and (c.scope = 'global' or is_org_member(c.organization_id))
    )
  );

create policy vendor_capability_evidence_insert on vendor_capability_evidence
  for insert with check (
    exists (
      select 1 from vendor_capability_claims c
      where c.id = vendor_capability_evidence.claim_id
        and (
          (c.scope = 'organization_private' and is_org_member(c.organization_id))
          or (c.scope = 'global' and is_platform_staff())
        )
    )
  );

-- Invariant (brief §55): no VERIFIED claim may exist with zero supporting
-- evidence. Enforced with a trigger rather than a CHECK constraint
-- because it is a cross-table, cross-row invariant (a CHECK cannot see
-- other rows) — this fires on the claim write, catching both "set to
-- verified with no evidence yet" and "the last supporting evidence row
-- would be deleted while the claim is still marked verified" (the delete
-- side is enforced by vendor_capability_evidence having no DELETE policy
-- at all, so only the insert/update side needs checking here).
create function enforce_verified_claim_has_evidence()
returns trigger
language plpgsql
as $$
begin
  if new.verification_status = 'verified' and not exists (
    select 1 from vendor_capability_evidence e
    where e.claim_id = new.id and e.polarity = 'supports'
  ) then
    raise exception 'A claim cannot be marked verified without at least one supporting evidence row (claim %).', new.id;
  end if;
  return new;
end;
$$;

create trigger vendor_capability_claims_enforce_verified_has_evidence
  after insert or update on vendor_capability_claims
  for each row execute function enforce_verified_claim_has_evidence();

comment on function enforce_verified_claim_has_evidence is
  'Database-level invariant for brief §55: "No source-less VERIFIED claim." AFTER trigger (not BEFORE) specifically so the common real sequence — insert the claim as unknown/proposed, then insert its evidence, then update verification_status to verified — works; a claim is checked at the moment it is actually marked verified, not at the moment it is first created.';

-- ---------------------------------------------------------------------------
-- 5. Vendor knowledge change events (brief §36).

create type vendor_knowledge_change_type as enum (
  'capability_changed',
  'pricing_model_changed',
  'region_availability_changed',
  'security_certification_changed',
  'product_status_changed',
  'integration_changed'
);

create table vendor_knowledge_changes (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references vendor_capability_claims (id) on delete cascade,
  previous_claim_id uuid references vendor_capability_claims (id) on delete set null,
  change_type vendor_knowledge_change_type not null,
  summary text not null,
  detected_at timestamptz not null default now(),
  detected_by_source_id uuid references vendor_evidence_sources (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint vendor_knowledge_changes_summary_not_blank check (btrim(summary) <> '')
);

comment on table vendor_knowledge_changes is
  'A structured record that a canonical vendor fact materially changed (brief §36) — e.g. a refreshed official release note moved a claim from "generally available" to "preview in EU region." Always global-scope (change events are about vendor knowledge, never about a tenant''s private evidence). Read-only to regular users; write restricted to platform staff / the vendor-refresh workflow.';

create index vendor_knowledge_changes_claim_idx on vendor_knowledge_changes (claim_id);
create index vendor_knowledge_changes_detected_at_idx on vendor_knowledge_changes (detected_at desc);

alter table vendor_knowledge_changes enable row level security;
create policy vendor_knowledge_changes_select on vendor_knowledge_changes for select using (auth.uid() is not null);
create policy vendor_knowledge_changes_write on vendor_knowledge_changes for all using (is_platform_staff()) with check (is_platform_staff());

-- ---------------------------------------------------------------------------
-- 6. Decision-time knowledge snapshot + revalidation usage tracking
-- (brief §15/§34). One row per (decision, claim) pair referenced when a
-- decision was computed or a business case was built against it —
-- answers "what did we know when this decision was made" and doubles as
-- the exact usage-count signal the Revalidation Queue (brief §15) needs
-- ("used by five high-value decisions") without a second tracking
-- mechanism.

create table decision_vendor_claim_refs (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  claim_id uuid not null references vendor_capability_claims (id) on delete cascade,
  claim_version_at_reference integer not null,
  referenced_at timestamptz not null default now(),
  constraint decision_vendor_claim_refs_unique unique (decision_id, claim_id, claim_version_at_reference)
);

comment on table decision_vendor_claim_refs is
  'Pins the exact claim version a decision relied on (brief §34) — a later edit to vendor_capability_claims.version never silently changes what a historical decision is understood to have used. Also the usage-count input for the Revalidation Queue (brief §15): count(*) group by claim_id, joined to decisions.status, is "how many decisions, how many of them saved/active, used this claim."';

create index decision_vendor_claim_refs_decision_idx on decision_vendor_claim_refs (decision_id);
create index decision_vendor_claim_refs_claim_idx on decision_vendor_claim_refs (claim_id);
create index decision_vendor_claim_refs_org_idx on decision_vendor_claim_refs (organization_id);

alter table decision_vendor_claim_refs enable row level security;
create policy decision_vendor_claim_refs_select on decision_vendor_claim_refs for select using (is_org_member(organization_id));
create policy decision_vendor_claim_refs_insert on decision_vendor_claim_refs for insert with check (is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- 7. Decision impact analysis (brief §37/§39) — tenant-scoped records of
-- "this canonical change might matter to this decision." Never
-- auto-applied to the decision itself (decisions/decision_versions stay
-- untouched; a human still decides whether to reopen).

create table decision_impacts (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  change_id uuid not null references vendor_knowledge_changes (id) on delete cascade,
  affected_option text not null,
  affected_criterion text,
  materiality text not null check (materiality in ('low', 'medium', 'high')),
  recommendation_impact text not null,
  review_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  constraint decision_impacts_affected_option_not_blank check (btrim(affected_option) <> '')
);

comment on table decision_impacts is
  'DecisionImpact (brief §37). One row per (decision, change) pair a materiality check found relevant — see engine/vendor-intelligence/impact-analysis.ts for the deterministic rules (brief §39) that decide materiality and review_recommended. Generating a row here never mutates decisions/decision_versions; it is strictly an advisory, inspectable-by-the-org record.';

create index decision_impacts_decision_idx on decision_impacts (decision_id);
create index decision_impacts_org_idx on decision_impacts (organization_id);
create index decision_impacts_change_idx on decision_impacts (change_id);

alter table decision_impacts enable row level security;
create policy decision_impacts_select on decision_impacts for select using (is_org_member(organization_id));
create policy decision_impacts_insert on decision_impacts for insert with check (is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- 8. Promotion function (brief §19/§49) — the only path that creates a
-- GLOBAL claim informed by private research, and the only path that
-- flips an existing global claim's lifecycle_status toward 'active'.
-- security invoker (RLS above still applies; this only adds the
-- atomicity a multi-statement promotion needs), restricted to platform
-- staff via the same RLS the direct INSERT/UPDATE policies already
-- enforce — this function does not elevate privilege, it only makes a
-- multi-row operation atomic.

create function promote_vendor_claim(p_claim_id uuid, p_new_status claim_lifecycle_status)
returns table (out_id uuid, out_lifecycle_status claim_lifecycle_status)
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_status claim_lifecycle_status;
begin
  if p_new_status not in ('active', 'rejected') then
    raise exception 'promote_vendor_claim only accepts active or rejected, not %', p_new_status;
  end if;

  update vendor_capability_claims
  set lifecycle_status = p_new_status
  where id = p_claim_id and scope = 'global'
  returning id, lifecycle_status into v_id, v_status;

  if v_id is null then
    raise exception 'Global claim not found, not accessible, or not eligible for promotion.';
  end if;

  return query select v_id, v_status;
end;
$$;

comment on function promote_vendor_claim is
  'Human review boundary for global vendor knowledge (brief §19/§48): PROPOSED → ACTIVE or PROPOSED → REJECTED. Only succeeds for scope=global rows, and only for a caller the UPDATE RLS policy above already lets through (is_platform_staff()) — this function adds no privilege of its own, only atomicity and a narrower, auditable API than a raw UPDATE.';

-- ---------------------------------------------------------------------------
-- 9. Decision-time snapshot column (brief §34/§35) — additive, nullable,
-- on the already-append-only decision_versions table. Distinct from the
-- pre-existing `knowledge_base_version` text column (a single version
-- tag for the whole TypeScript catalog, unchanged by this migration);
-- this column is the specific list of (claimId, version) pairs actually
-- referenced, which decision_vendor_claim_refs above also records
-- relationally — kept here too, denormalized, so a historical version's
-- own row answers "what vendor knowledge was this based on" without a
-- join, even if decision_vendor_claim_refs rows were ever pruned.

alter table decision_versions add column vendor_knowledge_snapshot_json jsonb;

comment on column decision_versions.vendor_knowledge_snapshot_json is
  'Nullable, additive (brief §34). An array of {claimId, version, verificationStatus} for every canonical vendor_capability_claims row this version''s engine result or business case actually referenced at generation time. Null for every version generated before this column existed — absence here means "not captured," never "no vendor knowledge was used."';

-- ClouDonna Platform — Database Foundation
-- Migration 11: gaps surfaced by the Enterprise Intelligence Graph exercise
--
-- See docs/platform/enterprise-intelligence-graph.md. Designing the domain
-- as nodes and named edges before this migration existed surfaced four
-- missing relationships and three missing node types that migrations 01-10
-- did not have. This migration adds exactly those — nothing else.

-- IMPLEMENTS: a product realizes a technology pattern. Missing entirely
-- until now — technology_patterns existed as pure taxonomy with no link
-- back to the catalog it's meant to classify.
create table product_technology_patterns (
  product_id uuid not null references products (id) on delete cascade,
  technology_pattern_id uuid not null references technology_patterns (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, technology_pattern_id)
);

comment on table product_technology_patterns is
  'IMPLEMENTS edge: which technology patterns a product realizes. Junction, hard-delete (see decision_session_capabilities for the same reasoning).';

create index product_technology_patterns_pattern_idx on product_technology_patterns (technology_pattern_id);

alter table product_technology_patterns enable row level security;
create policy product_technology_patterns_public_select on product_technology_patterns for select using (true);

-- INTEGRATES_WITH: symmetric product-to-product relationship.
create table product_integrations (
  product_id uuid not null references products (id) on delete cascade,
  integrates_with_product_id uuid not null references products (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null,
  primary key (product_id, integrates_with_product_id),
  constraint product_integrations_not_self check (product_id <> integrates_with_product_id)
);

comment on table product_integrations is
  'INTEGRATES_WITH edge. Symmetric in meaning but stored as a directed pair — the application layer is responsible for writing/reading both directions if a UI wants a symmetric listing, the same way it would for any symmetric graph edge stored in a directed table.';

create index product_integrations_target_idx on product_integrations (integrates_with_product_id);
create index product_integrations_created_by_idx on product_integrations (created_by);

alter table product_integrations enable row level security;
create policy product_integrations_public_select on product_integrations for select using (true);

-- COMPETES_WITH: symmetric vendor-to-vendor relationship.
create table vendor_competitors (
  vendor_id uuid not null references vendors (id) on delete cascade,
  competitor_vendor_id uuid not null references vendors (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null,
  primary key (vendor_id, competitor_vendor_id),
  constraint vendor_competitors_not_self check (vendor_id <> competitor_vendor_id)
);

comment on table vendor_competitors is
  'COMPETES_WITH edge, same directed-pair convention as product_integrations.';

create index vendor_competitors_target_idx on vendor_competitors (competitor_vendor_id);
create index vendor_competitors_created_by_idx on vendor_competitors (created_by);

alter table vendor_competitors enable row level security;
create policy vendor_competitors_public_select on vendor_competitors for select using (true);

-- FITS: a product's typical use-case fit, distinct from customer_references
-- (an actual customer) — this is the general "typically a good fit for".
create table product_use_cases (
  product_id uuid not null references products (id) on delete cascade,
  use_case_id uuid not null references use_cases (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, use_case_id)
);

comment on table product_use_cases is
  'FITS edge (product to use case). Junction, hard-delete.';

create index product_use_cases_use_case_idx on product_use_cases (use_case_id);

alter table product_use_cases enable row level security;
create policy product_use_cases_public_select on product_use_cases for select using (true);

-- ---------------------------------------------------------------------------
-- New node type: Regulation (global taxonomy, same pattern as industries).

create table regulations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  jurisdiction text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint regulations_name_not_blank check (btrim(name) <> '')
);

comment on table regulations is
  'A named regulatory regime (e.g. "GDPR", "DORA"). jurisdiction is free text ("EU", "Switzerland") rather than a link to a country table — no country/jurisdiction taxonomy exists elsewhere in this schema, and adding one for this alone would be exactly the over-modeling this migration otherwise avoids.';

create unique index regulations_slug_key on regulations (slug) where deleted_at is null;
create index regulations_created_by_idx on regulations (created_by);
create trigger regulations_set_updated_at before update on regulations for each row execute function set_updated_at();

alter table regulations enable row level security;
create policy regulations_public_select on regulations for select using (deleted_at is null);

-- COMPLIES_WITH: product/requirement to regulation.
create table product_regulations (
  product_id uuid not null references products (id) on delete cascade,
  regulation_id uuid not null references regulations (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  primary key (product_id, regulation_id)
);

comment on table product_regulations is
  'COMPLIES_WITH edge (product to regulation). Junction, hard-delete.';

create index product_regulations_regulation_idx on product_regulations (regulation_id);

alter table product_regulations enable row level security;
create policy product_regulations_public_select on product_regulations for select using (true);

create table requirement_regulations (
  requirement_id uuid not null references requirements (id) on delete cascade,
  regulation_id uuid not null references regulations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (requirement_id, regulation_id)
);

comment on table requirement_regulations is
  'COMPLIES_WITH edge (requirement to regulation) — why a specific session requirement exists. Tenant-scoped indirectly through requirement_id.';

create index requirement_regulations_regulation_idx on requirement_regulations (regulation_id);

alter table requirement_regulations enable row level security;
create policy requirement_regulations_select on requirement_regulations
  for select using (
    exists (
      select 1 from requirements r
      where r.id = requirement_regulations.requirement_id
        and r.deleted_at is null
        and is_org_member(r.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- New node types: Risk, Opportunity — CARRIES edges from a recommendation.

create type risk_severity as enum ('low', 'medium', 'high');
create type opportunity_impact as enum ('low', 'medium', 'high');

create table risks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  recommendation_id uuid not null references recommendations (id) on delete cascade,
  title text not null,
  description text,
  severity risk_severity not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint risks_title_not_blank check (btrim(title) <> '')
);

comment on table risks is
  'CARRIES edge target: a specific risk associated with choosing a given recommendation (e.g. "vendor lock-in given single-cloud dependency"). Tenant-scoped and soft-deletable — unlike the junction tables above, a risk is independently editable content, not a pure selection.';

create index risks_recommendation_idx on risks (recommendation_id) where deleted_at is null;
create index risks_org_idx on risks (organization_id) where deleted_at is null;
create index risks_created_by_idx on risks (created_by);
create trigger risks_set_updated_at before update on risks for each row execute function set_updated_at();

alter table risks enable row level security;
create policy risks_select on risks for select using (deleted_at is null and is_org_member(organization_id));
create policy risks_insert on risks for insert with check (is_org_member(organization_id));
create policy risks_update on risks for update using (deleted_at is null and is_org_member(organization_id));

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  recommendation_id uuid not null references recommendations (id) on delete cascade,
  title text not null,
  description text,
  impact opportunity_impact not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint opportunities_title_not_blank check (btrim(title) <> '')
);

comment on table opportunities is
  'CARRIES edge target, mirror of risks: a specific upside associated with a recommendation (e.g. "consolidation reduces integration overhead").';

create index opportunities_recommendation_idx on opportunities (recommendation_id) where deleted_at is null;
create index opportunities_org_idx on opportunities (organization_id) where deleted_at is null;
create index opportunities_created_by_idx on opportunities (created_by);
create trigger opportunities_set_updated_at before update on opportunities for each row execute function set_updated_at();

alter table opportunities enable row level security;
create policy opportunities_select on opportunities for select using (deleted_at is null and is_org_member(organization_id));
create policy opportunities_insert on opportunities for insert with check (is_org_member(organization_id));
create policy opportunities_update on opportunities for update using (deleted_at is null and is_org_member(organization_id));

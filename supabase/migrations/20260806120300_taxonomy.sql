-- ClouDonna Platform — Database Foundation
-- Migration 04: shared taxonomy (global reference data, not tenant-scoped)
--
-- Every table in this migration is platform-wide, curated by ClouDonna, and
-- shared by every organization — deliberately with NO organization_id
-- column. This is the first of several migrations that intentionally
-- deviate from "every table gets organization_id": a vendor category or an
-- industry definition is not owned by one tenant, the same way a country
-- list isn't. See docs/platform/database-architecture.md, "Global reference
-- data vs. tenant-scoped data", for the full rationale.
--
-- RLS on these tables is read-open (anyone, including unauthenticated
-- `anon`, can SELECT non-deleted rows — this is public catalog data) and
-- write-closed (no INSERT/UPDATE policy for any role, so only the
-- `service_role` key, used by the curation/repository layer, can write).

create table vendor_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint vendor_categories_name_not_blank check (btrim(name) <> '')
);

comment on table vendor_categories is
  'Top-level market category a product competes in, e.g. "Data Cloud Platform", "ERP". Coarser than platform_category (the SQL enum used for architecture-level comparability); this is the label shown to a human browsing the catalog.';

create unique index vendor_categories_slug_key on vendor_categories (slug) where deleted_at is null;
create trigger vendor_categories_set_updated_at before update on vendor_categories for each row execute function set_updated_at();

create table industries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint industries_name_not_blank check (btrim(name) <> '')
);

comment on table industries is
  'Controlled vocabulary of industries, e.g. "Financial Services", "Manufacturing". Referenced by decision sessions (as business context), products (as industry fit), and customer references.';

create unique index industries_slug_key on industries (slug) where deleted_at is null;
create trigger industries_set_updated_at before update on industries for each row execute function set_updated_at();

create table use_cases (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid references industries (id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint use_cases_name_not_blank check (btrim(name) <> '')
);

comment on table use_cases is
  'A named, concrete scenario (e.g. "Real-time fraud detection"), optionally tied to one industry. Used to connect a business goal to the technology and architecture patterns that typically serve it.';

create unique index use_cases_slug_key on use_cases (slug) where deleted_at is null;
create index use_cases_industry_idx on use_cases (industry_id) where deleted_at is null;
create trigger use_cases_set_updated_at before update on use_cases for each row execute function set_updated_at();

create table architecture_patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint architecture_patterns_name_not_blank check (btrim(name) <> '')
);

comment on table architecture_patterns is
  'A named structural approach (e.g. "Data Mesh", "Centralized Lakehouse", "Hub-and-Spoke Integration"), independent of any specific vendor. Solution Approaches in the Discovery flow are architecture patterns before a technology is named.';

create unique index architecture_patterns_slug_key on architecture_patterns (slug) where deleted_at is null;
create trigger architecture_patterns_set_updated_at before update on architecture_patterns for each row execute function set_updated_at();

create table technology_patterns (
  id uuid primary key default gen_random_uuid(),
  architecture_pattern_id uuid references architecture_patterns (id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint technology_patterns_name_not_blank check (btrim(name) <> '')
);

comment on table technology_patterns is
  'A named technology-level approach that implements an architecture pattern (e.g. "Event streaming with CDC" implementing "Data Mesh"), still independent of any specific vendor product. Products are matched to technology patterns, not the other way around.';

create unique index technology_patterns_slug_key on technology_patterns (slug) where deleted_at is null;
create index technology_patterns_arch_pattern_idx on technology_patterns (architecture_pattern_id) where deleted_at is null;
create trigger technology_patterns_set_updated_at before update on technology_patterns for each row execute function set_updated_at();

create table capabilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint capabilities_name_not_blank check (btrim(name) <> '')
);

comment on table capabilities is
  'Controlled vocabulary of capabilities a solution might need to provide (e.g. "Real-time Governance", "Row-Level Security", "Multi-Cloud Portability"). The bridge between a business goal and a product: goals imply required capabilities, products declare which capabilities they support and how well (product_capabilities, in the vendor-catalog migration).';

create unique index capabilities_slug_key on capabilities (slug) where deleted_at is null;
create trigger capabilities_set_updated_at before update on capabilities for each row execute function set_updated_at();

-- created_by index, uniform across all six tables above — supports both
-- "everything created by this user" lookups and the ON DELETE SET NULL
-- cascade from users, which otherwise has to sequentially scan each table.
do $$
declare
  t text;
begin
  foreach t in array array[
    'vendor_categories', 'industries', 'use_cases',
    'architecture_patterns', 'technology_patterns', 'capabilities'
  ]
  loop
    execute format('create index %I_created_by_idx on %I (created_by)', t, t);
  end loop;
end $$;

-- RLS: uniform read-open / write-closed policy across all six tables above.
do $$
declare
  t text;
begin
  foreach t in array array[
    'vendor_categories', 'industries', 'use_cases',
    'architecture_patterns', 'technology_patterns', 'capabilities'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_public_select on %I for select using (deleted_at is null)',
      t, t
    );
  end loop;
end $$;

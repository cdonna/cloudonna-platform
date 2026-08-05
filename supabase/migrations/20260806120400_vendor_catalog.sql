-- ClouDonna Platform — Database Foundation
-- Migration 05: vendor catalog (global reference data)
--
-- `products` is the persistence target for the Sprint 3 in-memory
-- VendorPlatformProfile catalog (apps/web/.../vendor-intelligence/catalog.ts,
-- currently 10 hardcoded TypeScript objects). Column names and enum types
-- mirror that type field-for-field so a future migration script can move
-- the data across with no reshaping. Nothing in this migration reads from
-- or writes to that TypeScript file — the alignment is a naming discipline,
-- not a runtime dependency.
--
-- Like taxonomy, this migration is global reference data: no
-- organization_id, read-open RLS, write-closed to service_role only.

create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  founded_year smallint,
  headquarters_country text,
  website_url text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint vendors_name_not_blank check (btrim(name) <> '')
);

comment on table vendors is
  'The company behind one or more products, e.g. "Snowflake Inc.". Kept separate from products because one vendor can offer several distinct products (SAP is both "SAP Business Data Cloud" and, eventually, other SAP products in this catalog).';

create unique index vendors_slug_key on vendors (slug) where deleted_at is null;
create index vendors_created_by_idx on vendors (created_by);
create trigger vendors_set_updated_at before update on vendors for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  vendor_category_id uuid references vendor_categories (id) on delete set null,
  platform_category platform_category not null,
  name text not null,
  slug text not null,

  short_description text,
  executive_positioning text,
  ideal_customer_profile text,
  executive_summary text,

  ideal_use_cases text[] not null default '{}',
  anti_patterns text[] not null default '{}',
  typical_strengths text[] not null default '{}',
  typical_weaknesses text[] not null default '{}',
  migration_scenarios text[] not null default '{}',
  architecture_characteristics text[] not null default '{}',

  cloud_model cloud_model not null,
  deployment_models deployment_model[] not null default '{}',

  governance maturity_band,
  security maturity_band,
  compliance maturity_band,
  ai_capabilities maturity_band,
  machine_learning maturity_band,
  generative_ai maturity_band,
  ecosystem_strength maturity_band,
  partner_network maturity_band,
  sap_integration maturity_band,
  erp_integration maturity_band,
  crm_integration maturity_band,
  data_warehouse_integration maturity_band,
  multi_cloud_support maturity_band,
  lakehouse_capabilities maturity_band,
  data_virtualization maturity_band,
  data_sharing maturity_band,
  metadata_management maturity_band,
  master_data_management maturity_band,
  streaming maturity_band,

  implementation_complexity implementation_complexity,
  time_to_value time_to_value_band,
  vendor_lock_in_risk lock_in_risk,

  pricing_model text,
  cost_tier cost_tier,
  cost_characteristics text,

  company_size_fit employee_band[] not null default '{}',
  integration_strengths text[] not null default '{}',
  traits trait[] not null default '{}',

  source_notes text,
  last_reviewed_date date,

  -- text-embedding-3-small dimensionality (1536). Populated by a future
  -- ingestion job, not by this migration — see docs, "AI-readiness".
  embedding vector(1536),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint products_name_not_blank check (btrim(name) <> '')
);

comment on table products is
  'One evaluable platform/product in the catalog, e.g. "Snowflake" or "SAP Business Data Cloud". All maturity_band columns are curated editorial judgments, never fabricated numbers, market share, or live pricing — see source_notes and last_reviewed_date. Numeric scores are never stored here; they are computed per decision_session into decision_scores.';

create unique index products_slug_key on products (slug) where deleted_at is null;
create index products_vendor_idx on products (vendor_id) where deleted_at is null;
create index products_vendor_category_idx on products (vendor_category_id) where deleted_at is null;
create index products_platform_category_idx on products (platform_category) where deleted_at is null;
create index products_traits_idx on products using gin (traits) where deleted_at is null;
create index products_embedding_idx on products using hnsw (embedding vector_cosine_ops);
create index products_created_by_idx on products (created_by);

create trigger products_set_updated_at before update on products for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table product_industries (
  product_id uuid not null references products (id) on delete cascade,
  industry_id uuid not null references industries (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, industry_id)
);

comment on table product_industries is
  'Which industries a product is a typical fit for (VendorPlatformProfile.industryFit). A join table against the industries reference table rather than an array column, since industries is itself an extensible catalog, not a closed enum.';

create index product_industries_industry_idx on product_industries (industry_id);

alter table product_industries enable row level security;
create policy product_industries_public_select on product_industries for select using (true);

-- ---------------------------------------------------------------------------

create table product_capabilities (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  capability_id uuid not null references capabilities (id) on delete cascade,
  maturity_band maturity_band not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null
);

comment on table product_capabilities is
  'How well a product supports a given capability from the shared capabilities taxonomy, and why. This is what business_goals ultimately get matched against, one level removed from a raw product-to-goal comparison: goal -> required capability -> product_capabilities.maturity_band.';

create unique index product_capabilities_product_capability_key
  on product_capabilities (product_id, capability_id) where deleted_at is null;
create index product_capabilities_capability_idx on product_capabilities (capability_id) where deleted_at is null;
create index product_capabilities_created_by_idx on product_capabilities (created_by);

create trigger product_capabilities_set_updated_at before update on product_capabilities for each row execute function set_updated_at();

alter table product_capabilities enable row level security;
create policy product_capabilities_public_select on product_capabilities for select using (deleted_at is null);

-- ---------------------------------------------------------------------------

create table analyst_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text not null,
  published_at date,
  url text,
  summary text,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint analyst_reports_title_not_blank check (btrim(title) <> '')
);

comment on table analyst_reports is
  'Citation metadata for a third-party analyst report (e.g. a named Gartner or Forrester publication) used as evidence. Stores only bibliographic metadata and an optional summary written by ClouDonna — never a reproduced rating, quadrant position, or score, which would be fabricated/licensed data this platform does not have rights to restate.';

create index analyst_reports_embedding_idx on analyst_reports using hnsw (embedding vector_cosine_ops);
create index analyst_reports_created_by_idx on analyst_reports (created_by);
create trigger analyst_reports_set_updated_at before update on analyst_reports for each row execute function set_updated_at();

alter table analyst_reports enable row level security;
create policy analyst_reports_public_select on analyst_reports for select using (deleted_at is null);

-- ---------------------------------------------------------------------------

create table customer_references (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  industry_id uuid references industries (id) on delete set null,
  use_case_id uuid references use_cases (id) on delete set null,
  company_name text,
  is_public boolean not null default false,
  summary text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null
);

comment on table customer_references is
  'A case study or reference customer for a product. `is_public` false + null company_name supports anonymized references ("a global manufacturer") when a named case study is not available/permitted — the UI must never display a company name that was not explicitly marked public.';

create index customer_references_product_idx on customer_references (product_id) where deleted_at is null;
create index customer_references_industry_idx on customer_references (industry_id) where deleted_at is null;
create index customer_references_use_case_idx on customer_references (use_case_id) where deleted_at is null;
create index customer_references_created_by_idx on customer_references (created_by);

create trigger customer_references_set_updated_at before update on customer_references for each row execute function set_updated_at();

alter table customer_references enable row level security;
create policy customer_references_public_select on customer_references
  for select using (deleted_at is null and is_public = true);

alter table vendors enable row level security;
create policy vendors_public_select on vendors for select using (deleted_at is null);

alter table products enable row level security;
create policy products_public_select on products for select using (deleted_at is null);

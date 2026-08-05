-- ClouDonna Platform — Database Foundation
-- Migration 06: partner ecosystem (global reference data)
--
-- Backs the /for-partners journey (apps/web, Web Presence Sprint): a
-- consultancy or systems integrator surfaces against a specific product
-- they're certified/experienced in, not as a generic directory listing.

create table partner_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  website_url text,
  regions text[] not null default '{}',
  specialties text[] not null default '{}',
  verification_status verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint partner_companies_name_not_blank check (btrim(name) <> '')
);

comment on table partner_companies is
  'A consultancy or systems integrator, independent of which specific products they implement (that link is implementation_partners). verification_status gates whether the company is shown publicly — see docs/platform/database-architecture.md, "Verification status".';

create unique index partner_companies_slug_key on partner_companies (slug) where deleted_at is null;
create index partner_companies_created_by_idx on partner_companies (created_by);
create trigger partner_companies_set_updated_at before update on partner_companies for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table implementation_partners (
  id uuid primary key default gen_random_uuid(),
  partner_company_id uuid not null references partner_companies (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  certification_level text,
  verification_status verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null
);

comment on table implementation_partners is
  'Join between a partner company and a specific product they deliver, e.g. "Acme Consulting implements Snowflake". certification_level is free text because certification tiers/names are vendor-defined (Snowflake''s tiers are not SAP''s), not a shared cross-vendor vocabulary.';

create unique index implementation_partners_company_product_key
  on implementation_partners (partner_company_id, product_id) where deleted_at is null;
create index implementation_partners_product_idx on implementation_partners (product_id) where deleted_at is null;
create index implementation_partners_created_by_idx on implementation_partners (created_by);

create trigger implementation_partners_set_updated_at before update on implementation_partners for each row execute function set_updated_at();

alter table partner_companies enable row level security;
create policy partner_companies_public_select on partner_companies
  for select using (deleted_at is null and verification_status = 'verified');

alter table implementation_partners enable row level security;
create policy implementation_partners_public_select on implementation_partners
  for select using (deleted_at is null and verification_status = 'verified');

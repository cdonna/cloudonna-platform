-- ClouDonna Platform — Database Foundation
-- Migration 01: extensions and shared helper functions
--
-- Every later migration depends on this one. It sets up:
--   1. UUID generation and vector (embedding) support.
--   2. A single, reusable `set_updated_at()` trigger function so `updated_at`
--      maintenance is never duplicated per-table.
--   3. `organization_members` comes later (tenancy migration), but the RLS
--      helper functions that depend on it are declared there, not here —
--      kept next to the table they query for discoverability.

-- pgcrypto gives us gen_random_uuid(); it is enabled by default on Supabase
-- projects, but declared explicitly so this migration set is portable to any
-- plain Postgres instance.
create extension if not exists pgcrypto;

-- pgvector — required for every `embedding` column added in later
-- migrations (semantic search / RAG). Enabled here, once, platform-wide.
create extension if not exists vector;

-- Generic updated_at maintenance. Attached per-table via
-- `create trigger ... before update ... execute function set_updated_at()`.
-- Kept intentionally dumb: it only touches updated_at, never any other
-- column, so it can never become a place business logic accretes.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function set_updated_at() is
  'Shared BEFORE UPDATE trigger: stamps updated_at = now(). Attached to every mutable table. No business logic — see docs/platform/database-architecture.md.';

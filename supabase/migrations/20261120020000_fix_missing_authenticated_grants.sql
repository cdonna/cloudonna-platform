-- ClouDonna Platform — production defect fix: the authenticated/anon
-- roles were missing the base PostgreSQL privilege grants (SELECT/
-- INSERT/UPDATE/DELETE on tables, EXECUTE on functions, USAGE on
-- sequences) that Row Level Security depends on as its prerequisite
-- layer, across the ENTIRE public schema.
--
-- Found while diagnosing "I can create a Decision in the UI but
-- cannot save it" during Decision Workspace V1 QA (the first ever
-- real, authenticated save attempt against production — sign-up
-- itself was broken until 20261120010000, so no authenticated write
-- had ever been exercised before now).
--
-- Root cause, confirmed directly against production:
--
--   select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema='public' and grantee in ('anon','authenticated');
--
-- returned only REFERENCES/TRIGGER/TRUNCATE for `authenticated` on
-- every single table (old and new, e.g. `projects` from the very
-- first tenancy migration through `decision_stakeholders` from
-- yesterday) — SELECT/INSERT/UPDATE/DELETE were never granted.
-- Reproduced the exact failure directly: running as role
-- `authenticated` inside a rolled-back transaction, `select * from
-- projects` returned `permission denied for table projects`, the
-- same class of error `save_decision()` (called via supabase.rpc,
-- which itself has no EXECUTE grant either) would hit.
--
-- The two tables that DID work in production (`inquiries`,
-- `business_events`, both with an explicit anon INSERT grant) were
-- evidently patched by hand at some point (no migration file in this
-- repository has ever contained a GRANT statement — confirmed by
-- grep across every migration) — a one-off fix for the first two
-- public-facing tables that obviously needed it, never generalized,
-- and never caught since every other table's real, authenticated
-- code path was never genuinely exercised until this QA pass: every
-- prior production smoke test in this project checked only
-- *unauthenticated* rejection (401/307, enforced entirely at the
-- application layer via getCurrentUser(), before any query reaches
-- Postgres) — never a real authenticated read or write, because no
-- real sign-up had ever succeeded before 20261120010000.
--
-- This migration restores the standard Supabase/Postgres baseline:
-- broad GRANTs at the role level are the first, coarse gate ("can
-- this role ever touch this kind of object at all"); Row Level
-- Security — already correctly configured on every table in this
-- schema, verified extensively across every prior sprint — remains
-- the real, row-level enforcement. Granting the base privilege here
-- changes nothing about which ROWS anon/authenticated can see or
-- write; it only lets the RLS policies that were already written
-- correctly actually get evaluated in the first place. No RLS policy
-- is touched, added, or removed by this migration.
--
-- Also sets ALTER DEFAULT PRIVILEGES for the public schema so this
-- exact class of defect cannot silently recur for a table, function,
-- or sequence created by a future migration — the gap this migration
-- closes for existing objects would otherwise reopen for every new
-- one.

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to anon;

grant execute on all functions in schema public to authenticated;
grant execute on all functions in schema public to anon;

grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to anon;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon;

alter default privileges in schema public grant execute on functions to authenticated;
alter default privileges in schema public grant execute on functions to anon;

alter default privileges in schema public grant usage, select on sequences to authenticated;
alter default privileges in schema public grant usage, select on sequences to anon;

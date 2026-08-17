-- P0 Production Diagnostic — Inquiry Flow
--
-- Run this in the Supabase SQL Editor against the REAL production
-- project (Settings -> whichever project backs NEXT_PUBLIC_SUPABASE_URL
-- in Vercel's environment variables). Read-only — nothing here writes,
-- alters, or drops anything in the actual production schema. Paste the
-- whole file, run once, read the output top to bottom.
--
-- This exists because the agent that wrote it has no Supabase CLI, no
-- project credentials, and no way to run this itself in this
-- environment — every migration this schema needed was written and
-- disclosed as "not executed, no local Postgres available" in every
-- release note this session. This script answers the one question
-- that matters most: does Production's actual schema match what the
-- application code assumes?
--
-- Every check below is safe against a completely empty, freshly
-- created Supabase project — no query here throws merely because a
-- table, type, function, policy, or column does not exist yet; each
-- one explicitly reports MISSING instead. A prior version of this
-- script threw `ERROR: 42704: type "inquiry_type" does not exist` on
-- an empty project, because `'inquiry_type'::regtype` is a *casting*
-- operator that raises an error for an unknown type name — unlike
-- to_regclass()/to_regprocedure(), which already returned NULL instead
-- of throwing (queries 1, 6, 7 below were never affected). This
-- version replaces every such unsafe cast with a catalog lookup by
-- name (pg_type.typname, a plain text comparison — text equality never
-- throws, no matter what it does or doesn't match) and, for the two
-- row-count checks that must reference a table that might not exist in
-- a FROM clause, a short-lived helper function created in pg_temp —
-- this session's own private, non-persistent schema, explicitly
-- dropped again at the very end of this script (and auto-dropped by
-- Postgres at session end regardless, even if the script is aborted
-- partway). Nothing survives this script's execution; nothing in the
-- public/production schema is created, altered, or dropped by it.

-- ---------------------------------------------------------------------------
-- Helper: safe row count for a table that may not exist yet. Needed
-- because `select count(*) from x` cannot be made conditionally safe
-- with a plain CASE/WHERE guard — Postgres resolves every table named
-- in a FROM clause at parse time, before any runtime branching
-- happens, regardless of whether that branch is ever taken. Wrapping
-- the reference in dynamic SQL (EXECUTE, inside a function) defers
-- resolution to runtime, which is what actually makes this safe. Lives
-- only in pg_temp; dropped again at the end of this script.
create or replace function pg_temp.safe_row_count(p_table text)
returns text
language plpgsql
as $$
declare
  v_count bigint;
begin
  if to_regclass(p_table) is null then
    return 'MISSING — table does not exist';
  end if;
  execute format('select count(*) from %s', p_table) into v_count;
  return v_count::text;
end;
$$;

-- 1. Does `inquiries` exist at all?
select
  case when to_regclass('public.inquiries') is null
    then 'MISSING — migration 20260809090000_inquiries.sql was never applied'
    else 'exists'
  end as inquiries_table_status;

-- 2. What values does inquiry_type actually have in Production?
-- Expected (post-refinement): founding_tester, enterprise, partner, vendor, general
-- If you see enterprise_pilot/customer instead of enterprise, migration
-- 20260809120000_inquiries_taxonomy_refinement.sql was never applied —
-- and every submission with inquiry_type='enterprise' (which is what
-- every current InquiryForm sends) is failing with a Postgres enum
-- error right now. Looked up by name via pg_type (a plain text match —
-- never throws), not via `::regtype` (which throws if the type doesn't
-- exist yet — the exact bug that broke the prior version of this
-- script).
select
  case when exists (select 1 from pg_type where typname = 'inquiry_type')
    then 'exists — see inquiry_type_value rows below'
    else 'MISSING — migration 20260809090000_inquiries.sql was never applied'
  end as inquiry_type_status;

select e.enumlabel as inquiry_type_value
from pg_type t
join pg_enum e on e.enumtypid = t.oid
where t.typname = 'inquiry_type'
order by e.enumsortorder;

-- 3. What values does inquiry_status actually have?
-- Expected (post-refinement): new, reviewing, contacted, qualified, closed
select
  case when exists (select 1 from pg_type where typname = 'inquiry_status')
    then 'exists — see inquiry_status_value rows below'
    else 'MISSING — migration 20260809090000_inquiries.sql was never applied'
  end as inquiry_status_status;

select e.enumlabel as inquiry_status_value
from pg_type t
join pg_enum e on e.enumtypid = t.oid
where t.typname = 'inquiry_status'
order by e.enumsortorder;

-- 4. Does the utm_medium column exist? (added in the refinement migration)
-- information_schema.columns is a catalog view filtered by plain text
-- columns — already safe; returns zero rows rather than throwing when
-- the table itself doesn't exist yet.
select
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inquiries' and column_name = 'utm_medium'
  ) then 'present' else 'MISSING' end as utm_medium_column_status;

-- 5. Do owner/notes still exist? They should NOT — dropped in the
-- refinement migration. Their presence means the refinement migration
-- ran partially or a different schema history exists. Also already
-- safe on an empty database: simply returns zero rows.
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'inquiries' and column_name in ('owner', 'notes');
-- Expect zero rows back either way (empty database, or a correctly
-- migrated one). Any row returned here is itself a finding.

-- 6. Does the rate-limit function exist?
-- to_regprocedure() is already safe — returns NULL instead of throwing
-- for an unknown function signature.
select
  case when to_regprocedure('public.count_recent_inquiries_by_email(text, interval)') is null
    then 'MISSING — the rate-limit RPC the handler calls does not exist; every submission is failing here'
    else 'exists'
  end as rate_limit_function_status;

-- 7. Does business_events exist?
select
  case when to_regclass('public.business_events') is null
    then 'MISSING — migration 20260809130000_business_events.sql was never applied'
    else 'exists'
  end as business_events_table_status;

-- 8. RLS policies actually active on inquiries — confirm the security
-- model matches what the code assumes (public INSERT, staff-only
-- SELECT/UPDATE, no DELETE). pg_policies is a catalog view filtered by
-- plain text columns — already safe; returns zero rows on a missing
-- table rather than throwing.
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'inquiries'
order by cmd;
-- Zero rows on an empty database is expected, not an error.

-- 9. Is platform_staff seeded? (Not a P0 blocker for submission itself,
-- but /app/inquiries is useless without at least one row here.)
select pg_temp.safe_row_count('public.platform_staff') as platform_staff_row_count;

-- 10. Any inquiries actually landed, ever? If migrations are fine and
-- this is still zero, the failure is elsewhere (env vars, RLS, or a
-- code path) — re-focus the investigation away from schema.
select pg_temp.safe_row_count('public.inquiries') as total_inquiries_ever_inserted;

-- ---------------------------------------------------------------------------
-- Cleanup — this script leaves nothing behind. pg_temp is already
-- session-private and auto-dropped at session end regardless; this
-- makes that explicit rather than relying on it silently.
drop function if exists pg_temp.safe_row_count(text);

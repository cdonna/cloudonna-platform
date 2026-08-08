-- P0 Production Diagnostic — Inquiry Flow
--
-- Run this in the Supabase SQL Editor against the REAL production
-- project (Settings -> whichever project backs NEXT_PUBLIC_SUPABASE_URL
-- in Vercel's environment variables). Read-only — nothing here writes,
-- alters, or drops anything. Paste the whole file, run once, read the
-- output top to bottom.
--
-- This exists because the agent that wrote it has no Supabase CLI, no
-- project credentials, and no way to run this itself in this
-- environment — every migration this schema needed was written and
-- disclosed as "not executed, no local Postgres available" in every
-- release note this session. This script answers the one question
-- that matters most: does Production's actual schema match what the
-- application code assumes?

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
-- error right now.
select enumlabel as inquiry_type_value
from pg_enum
where enumtypid = 'inquiry_type'::regtype
order by enumsortorder;

-- 3. What values does inquiry_status actually have?
-- Expected (post-refinement): new, reviewing, contacted, qualified, closed
select enumlabel as inquiry_status_value
from pg_enum
where enumtypid = 'inquiry_status'::regtype
order by enumsortorder;

-- 4. Does the utm_medium column exist? (added in the refinement migration)
select
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inquiries' and column_name = 'utm_medium'
  ) then 'present' else 'MISSING' end as utm_medium_column_status;

-- 5. Do owner/notes still exist? They should NOT — dropped in the
-- refinement migration. Their presence means the refinement migration
-- ran partially or a different schema history exists.
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'inquiries' and column_name in ('owner', 'notes');
-- Expect zero rows back. Any row returned here is itself a finding.

-- 6. Does the rate-limit function exist?
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
-- SELECT/UPDATE, no DELETE).
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'inquiries'
order by cmd;

-- 9. Is platform_staff seeded? (Not a P0 blocker for submission itself,
-- but /app/inquiries is useless without at least one row here.)
select count(*) as platform_staff_row_count from platform_staff;

-- 10. Any inquiries actually landed, ever? If migrations are fine and
-- this is still zero, the failure is elsewhere (env vars, RLS, or a
-- code path) — re-focus the investigation away from schema.
select count(*) as total_inquiries_ever_inserted from inquiries;

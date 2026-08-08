-- ClouDonna Platform — Business Operations refinement
--
-- Aligns the inquiries table built in 20260809090000_inquiries.sql with
-- the finalized taxonomy: inquiry_type collapses enterprise_pilot/
-- customer into a single `enterprise`; status moves from the original
-- new/in_review/responded/closed/spam vocabulary to
-- new/reviewing/contacted/qualified/closed. Postgres cannot remove enum
-- values in place, so this recreates both enums and migrates the
-- column via USING — safe here because the original migration has
-- never been applied to a live database (no local Postgres available
-- all sprint, disclosed since Sprint 6.2 Slice C), so there is no real
-- data to actually migrate, only the shape to correct before it ever
-- is applied.
--
-- Also: adds utm_medium (present in the finalized field list, missing
-- before), and drops owner/notes — the finalized field list doesn't
-- include them, and carrying columns the current spec doesn't call for
-- is clutter, not a hedge. Status changes are now the only staff
-- mutation this table supports, matching Phase 10's "this is an inbox,
-- nothing more."

alter table inquiries alter column status drop default;

alter type inquiry_type rename to inquiry_type_old;
create type inquiry_type as enum ('founding_tester', 'enterprise', 'partner', 'vendor', 'general');

alter type inquiry_status rename to inquiry_status_old;
create type inquiry_status as enum ('new', 'reviewing', 'contacted', 'qualified', 'closed');

alter table inquiries
  alter column inquiry_type type inquiry_type using (
    case inquiry_type::text
      when 'enterprise_pilot' then 'enterprise'
      when 'customer' then 'enterprise'
      else inquiry_type::text
    end
  )::inquiry_type,
  alter column status type inquiry_status using (
    case status::text
      when 'in_review' then 'reviewing'
      when 'responded' then 'contacted'
      when 'spam' then 'closed'
      else status::text
    end
  )::inquiry_status;

alter table inquiries alter column status set default 'new';

drop type inquiry_type_old;
drop type inquiry_status_old;

alter table inquiries add column utm_medium text;

alter table inquiries drop column owner;
alter table inquiries drop column notes;

comment on table inquiries is
  'The one first-party inquiry backend for every public contact surface. Public INSERT (anon + authenticated), staff-only SELECT/UPDATE, no DELETE policy at all. Field list and taxonomy finalized in docs/operations/05-inquiry-system-v2.md — this is the authoritative shape going forward.';

-- ---------------------------------------------------------------------------
-- Rate limiting — a narrow, count-only security-definer function so an
-- anonymous caller can be rate-limited WITHOUT being granted any SELECT
-- access to the inquiries table itself (RLS still denies that
-- completely). Returns a count only, never rows, never other
-- submitters' data.

create or replace function count_recent_inquiries_by_email(p_email text, p_window interval default interval '1 hour')
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::integer
  from inquiries
  where business_email = p_email
    and created_at > now() - p_window;
$$;

comment on function count_recent_inquiries_by_email(text, interval) is
  'The one narrow read an anonymous caller is allowed against inquiries — a count for its own submitted email, over a window, nothing else. Backs the application-level rate limit in apps/web/src/lib/inquiries/handler.ts; RLS on the table itself still denies every other read for anon.';

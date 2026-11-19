-- ClouDonna Platform — production defect fix: real sign-up was
-- completely broken.
--
-- Found during Decision Workspace V1 QA (creating a real account to
-- validate the workspace against real data, not a DB insert).
-- handle_new_auth_user() — the trigger that bootstraps a brand-new
-- auth.users row into profile + personal organization + membership +
-- workspace + project — inserts into organizations/organization_members/
-- workspaces/projects using new.id as created_by/user_id. Every one of
-- those columns has a foreign key to the LEGACY Sprint-4 `users` table
-- (20260806120200_tenancy.sql), not to `profiles` or `auth.users`. The
-- `users` table is empty in production (0 rows) and nothing populates
-- it on real sign-up — this function inserts into `profiles`, never
-- `users`. The result: every single real sign-up attempt has been
-- failing at the very first insert (organizations_created_by_fkey),
-- rolling back the whole trigger transaction. Confirmed directly:
-- production had 0 rows in organizations/profiles/decisions before
-- this fix, consistent with sign-up having never once succeeded.
--
-- This was a disclosed, known architectural gap (see
-- 20260806130000_sprint6_1_profiles_and_bootstrap.sql's own comment:
-- "reconciling or retiring `users` is a real, disclosed follow-up
-- decision ... NOT resolved here") that had not yet caused visible
-- failure because no real sign-up had been attempted against it until
-- now.
--
-- Fix: `users` gets exactly the same on-conflict-safe row the
-- function already writes to `profiles`, keyed on the same new.id, so
-- every downstream FK the bootstrap transaction needs is satisfied.
-- No column, type, or constraint changes of any kind — a pure
-- `create or replace function`, re-registering under the identical
-- trigger that already exists (auth_user_created on auth.users, from
-- the same original migration), so no trigger changes are needed
-- either.

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_org_id uuid;
  v_workspace_id uuid;
  v_org_slug text;
begin
  v_full_name := new.raw_user_meta_data->>'full_name';

  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, v_full_name)
  on conflict (id) do nothing;

  -- The fix: without this, every insert below fails its foreign key
  -- to users(id) — see this migration's own header comment.
  insert into public.users (id, email, full_name)
  values (new.id, new.email, v_full_name)
  on conflict (id) do nothing;

  v_org_slug := 'org-' || substr(new.id::text, 1, 8);

  insert into public.organizations (name, slug, created_by)
  values (coalesce(v_full_name, split_part(new.email, '@', 1)) || '''s Organization', v_org_slug, new.id)
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role, created_by)
  values (v_org_id, new.id, 'owner', new.id);

  insert into public.workspaces (organization_id, name, slug, created_by)
  values (v_org_id, 'Default Workspace', 'default', new.id)
  returning id into v_workspace_id;

  insert into public.projects (organization_id, workspace_id, name, slug, created_by)
  values (v_org_id, v_workspace_id, 'My Decisions', 'my-decisions', new.id);

  return new;
end;
$$;

comment on function handle_new_auth_user() is
  'Runs once, after a new auth.users row is inserted (real sign-up, any method). Creates the minimum tenant scaffold — profile, LEGACY users row (satisfies organizations/organization_members/workspaces/projects'' foreign keys, all of which still point at the pre-auth `users` table), personal organization, owner membership, one workspace, one project — so a brand-new user can save a decision immediately. security definer because the inserting session has not yet passed any RLS check as an org member (it cannot have — the organization does not exist yet); every insert here is fully controlled by this function''s own fixed logic, never influenced by caller-supplied data beyond the new user''s own id/email/name.';

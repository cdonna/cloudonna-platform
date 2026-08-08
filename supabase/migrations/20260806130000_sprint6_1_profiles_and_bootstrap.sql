-- ClouDonna Platform — Sprint 6.1
-- Migration 12: profiles (auth-linked) and new-user tenant bootstrap
--
-- `profiles` is a deliberately new, minimal table — NOT a rename or
-- reuse of Sprint 4's `users` table. Sprint 4's `users` predates
-- authentication and was explicitly built with a documented, unbuilt
-- auth-sync seam ("in production this row's id is expected to equal
-- auth.users.id ... no such trigger exists yet, by design"). `profiles`
-- is that seam, finally wired, with exactly the columns Sprint 6.1
-- needs (id, email, full_name, timestamps) — no avatar_url, no
-- deleted_at, no self-referential created_by, none of which this slice
-- uses. This intentionally creates a temporary overlap with the unused
-- `users` table: reconciling or retiring `users` is a real, disclosed
-- follow-up decision (see docs/sprint-6/18-persistence-schema.md,
-- "profiles vs. users"), not resolved here, and NOT a redesign of
-- anything Sprint 4 already shipped — `users` is untouched.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_not_blank check (btrim(email) <> '')
);

comment on table profiles is
  'One row per authenticated user, id = auth.users.id by construction (never a separately generated UUID) — the join key every RLS policy in this schema keys on via is_org_member()/is_org_admin(). Created automatically by handle_new_auth_user() below; never inserted into directly by application code.';

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;

-- A user can always read/update their own profile. No policy allows
-- reading another user's profile via this table — organization_members
-- is where "who else is in my org" is answered, deliberately not here.
create policy profiles_select_self on profiles
  for select using (id = auth.uid());

create policy profiles_update_self on profiles
  for update using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- New-user bootstrap: profile + a personal organization + owner
-- membership + a default workspace + a default project, atomically, so
-- Save Decision works immediately after sign-up with no separate
-- organization-creation UI. Full self-service org creation/switching
-- (a user creating a SECOND organization, joining an existing one via
-- invitation) is explicitly out of scope for Sprint 6.1 — see
-- docs/sprint-6/16-implementation-slice-6-1.md, "What Sprint 6.1
-- deliberately does not build." This trigger is the entire tenant
-- surface this slice ships.

create function handle_new_auth_user()
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

  -- Slug derived from the fresh auth user id, not user input — cheap,
  -- collision-safe in practice, and never exposed as anything more than
  -- a URL segment. organizations.slug's existing unique index is the
  -- real guarantee; this is just a sensible default value.
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
  'Runs once, after a new auth.users row is inserted (real sign-up, any method). Creates the minimum tenant scaffold — profile, personal organization, owner membership, one workspace, one project — so a brand-new user can save a decision immediately. security definer because the inserting session has not yet passed any RLS check as an org member (it cannot have — the organization does not exist yet); every insert here is fully controlled by this function''s own fixed logic, never influenced by caller-supplied data beyond the new user''s own id/email/name.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

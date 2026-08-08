-- Sprint 6.1 — RLS verification script
--
-- NOT EXECUTED as part of this task. No local Postgres/Supabase instance
-- was available in the implementation environment (verified: no
-- `supabase`, `docker`, or `psql` binary present) — this is disclosed
-- explicitly in docs/sprint-6/19-rls-verification.md and the final
-- report, not glossed over. Written to run cleanly against a real
-- `supabase start` local instance, or any Postgres with the migrations
-- in supabase/migrations/ already applied:
--
--   supabase start
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" \
--     -f supabase/tests/sprint6_1_rls_verification.sql
--
-- Pattern: simulate a specific authenticated user by setting the same
-- `request.jwt.claims` GUC Supabase's own PostgREST/GoTrue layer sets
-- for a real request — this is what auth.uid() actually reads, so a
-- test written this way exercises the exact same code path a real
-- request does, not an approximation of it.
--
-- Every assertion either passes silently or RAISEs, so a CI run of this
-- script can gate on exit code alone.

begin;

-- ── Fixtures ────────────────────────────────────────────────────────────
-- Two independent users, each bootstrapped via handle_new_auth_user()
-- (inserting into auth.users directly, exactly as GoTrue would on a real
-- sign-up) so their personal org/workspace/project/profile exist with
-- zero test-only special-casing.

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'user-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'user-b@example.com');

-- handle_new_auth_user() fires automatically via the on_auth_user_created
-- trigger — no manual profile/org/workspace/project inserts needed here.

do $$
declare
  v_org_a uuid;
  v_project_a uuid;
begin
  select organization_id into v_org_a
    from organization_members where user_id = '11111111-1111-1111-1111-111111111111';
  select id into v_project_a from projects where organization_id = v_org_a;

  -- User A saves one decision, one version, as themselves.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

  insert into decisions (id, human_readable_id, organization_id, workspace_id, project_id, title, created_by)
  values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'CDD-2026-TEST01',
    v_org_a,
    (select workspace_id from projects where id = v_project_a),
    v_project_a,
    'Test decision (user A)',
    '11111111-1111-1111-1111-111111111111'
  );

  insert into decision_versions (
    decision_id, organization_id, version_number, decision_input_json, deterministic_output_json,
    provider_metadata_json, fallback_metadata_json, schema_version, scoring_engine_version,
    knowledge_base_version, generated_at, created_by
  ) values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_org_a, 1, '{}'::jsonb, '{}'::jsonb,
    '{"providerId":"deterministic-v1","model":null}'::jsonb, '{"status":"ok","reason":null}'::jsonb,
    'decision-report/1', 'donna-score-v2', 'catalog-v1', now(), '11111111-1111-1111-1111-111111111111'
  );

  reset role;
end $$;

-- ── Test 1: cross-tenant SELECT returns zero rows, not an error ────────
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count from decisions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  if v_count <> 0 then
    raise exception 'FAIL: user B could read user A''s decision (RLS leak)';
  end if;
  raise notice 'PASS: cross-tenant decisions SELECT correctly returns zero rows';
end $$;

do $$
declare
  v_count int;
begin
  select count(*) into v_count from decision_versions where decision_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  if v_count <> 0 then
    raise exception 'FAIL: user B could read user A''s decision_versions (RLS leak)';
  end if;
  raise notice 'PASS: cross-tenant decision_versions SELECT correctly returns zero rows';
end $$;

-- ── Test 2: cross-tenant INSERT is rejected ──────────────────────────────
do $$
begin
  begin
    insert into decisions (id, human_readable_id, organization_id, workspace_id, project_id, title, created_by)
    select
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CDD-2026-TEST02',
      organization_id, workspace_id, id, 'Attempted cross-tenant write',
      '22222222-2222-2222-2222-222222222222'
    from projects where id = (select project_id from decisions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    raise exception 'FAIL: user B was able to insert a decision into user A''s organization';
  exception
    when insufficient_privilege or others then
      raise notice 'PASS: cross-tenant decisions INSERT correctly rejected';
  end;
end $$;

-- ── Test 3: same-tenant access succeeds ─────────────────────────────────
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count from decisions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  if v_count <> 1 then
    raise exception 'FAIL: user A could not read their own decision';
  end if;
  raise notice 'PASS: same-tenant decisions SELECT succeeds';
end $$;

-- ── Test 4: decision_versions has no UPDATE/DELETE policy for a regular role ──
do $$
begin
  begin
    update decision_versions set change_reason = 'tampered' where decision_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    raise exception 'FAIL: decision_versions accepted an UPDATE from an authenticated, same-org user';
  exception
    when insufficient_privilege or others then
      raise notice 'PASS: decision_versions correctly rejects UPDATE for any regular role (append-only holds)';
  end;
end $$;

-- ── Test 5: profiles — a user can read their own row, not another's ─────
do $$
declare
  v_count int;
begin
  select count(*) into v_count from profiles where id = '11111111-1111-1111-1111-111111111111';
  if v_count <> 1 then
    raise exception 'FAIL: user A could not read their own profile';
  end if;

  select count(*) into v_count from profiles where id = '22222222-2222-2222-2222-222222222222';
  if v_count <> 0 then
    raise exception 'FAIL: user A could read user B''s profile';
  end if;
  raise notice 'PASS: profiles RLS correctly scopes to self only';
end $$;

-- ── Test 6: current_version_id cannot be pointed at an unrelated decision's version ──
-- Regression test for the integrity trigger added alongside this test —
-- see docs/architecture/sprint-6.1-freeze.md, "current_version_id integrity."
do $$
declare
  v_org_a uuid;
  v_project_a uuid;
  v_other_decision_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_other_version_id uuid;
begin
  select organization_id into v_org_a
    from organization_members where user_id = '11111111-1111-1111-1111-111111111111';
  select id into v_project_a from projects where organization_id = v_org_a;

  -- A second, unrelated decision + version, same org, same user — the
  -- trigger must reject cross-DECISION pointers even within one org,
  -- not just cross-org ones (RLS alone would not catch this, since both
  -- rows are visible to this user).
  insert into decisions (id, human_readable_id, organization_id, workspace_id, project_id, title, created_by)
  values (
    v_other_decision_id, 'CDD-2026-TEST03', v_org_a,
    (select workspace_id from projects where id = v_project_a), v_project_a,
    'Unrelated decision', '11111111-1111-1111-1111-111111111111'
  );

  insert into decision_versions (
    decision_id, organization_id, version_number, decision_input_json, deterministic_output_json,
    provider_metadata_json, fallback_metadata_json, schema_version, scoring_engine_version,
    knowledge_base_version, generated_at, created_by
  ) values (
    v_other_decision_id, v_org_a, 1, '{}'::jsonb, '{}'::jsonb,
    '{"providerId":"deterministic-v1","model":null}'::jsonb, '{"status":"ok","reason":null}'::jsonb,
    'decision-report/1', 'donna-score-v2', 'catalog-v1', now(), '11111111-1111-1111-1111-111111111111'
  ) returning id into v_other_version_id;

  begin
    update decisions set current_version_id = v_other_version_id
      where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    raise exception 'FAIL: decisions accepted a current_version_id pointing at a different decision''s version';
  exception
    when others then
      raise notice 'PASS: current_version_id mismatch correctly rejected';
  end;
end $$;

reset role;
rollback; -- never commits test fixtures against a real database

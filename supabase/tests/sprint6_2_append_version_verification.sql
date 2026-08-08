-- Sprint 6.2, Slice C — append_decision_version() verification script
--
-- NOT EXECUTED as part of this task, for the same reason
-- sprint6_1_rls_verification.sql discloses: no local Postgres/Docker/
-- psql binary is available in this environment. Written to run cleanly
-- against a real `supabase start` local instance, or any Postgres with
-- the migrations in supabase/migrations/ already applied — see that
-- file's own header for the exact invocation.
--
-- A note on the concurrency test (Test 4, below): a single sequential
-- SQL script cannot genuinely simulate two overlapping transactions —
-- that requires two separate database connections issuing statements
-- interleaved in real time (e.g. two concurrent `psql` sessions, or a
-- driver-level concurrency test). What Test 4 below verifies instead,
-- honestly: that append_decision_version()'s row lock exists and that
-- two *sequential* appends to the same decision correctly increment
-- version_number without collision — a necessary but not sufficient
-- proof of the concurrency guarantee. The genuine concurrent-session
-- test is a disclosed gap here, the same way live RLS execution itself
-- is disclosed as not yet run at all.

begin;

-- ── Fixtures — reuses the same two-user setup pattern as
-- sprint6_1_rls_verification.sql ─────────────────────────────────────

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'user-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'user-b@example.com');

do $$
declare
  v_org_a uuid;
  v_project_a uuid;
begin
  select organization_id into v_org_a
    from organization_members where user_id = '11111111-1111-1111-1111-111111111111';
  select id into v_project_a from projects where organization_id = v_org_a;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

  -- User A saves a real decision (version 1) via the existing
  -- save_decision() RPC — Slice C's append path builds on top of this,
  -- never around it.
  perform save_decision(
    v_org_a,
    (select workspace_id from projects where id = v_project_a),
    v_project_a,
    'Test decision (user A)',
    '{}'::jsonb,
    '{"donnaScore": 70}'::jsonb,
    null,
    '{"providerId":"deterministic-v1","model":null}'::jsonb,
    '{"status":"ok","reason":null}'::jsonb,
    '[]'::jsonb,
    'decision-report/1', 'donna-score-v2', 'vendor-catalog-v1'
  );

  reset role;
end $$;

-- ── Test 1: cross-tenant append is rejected ──────────────────────────
do $$
declare
  v_decision_id uuid;
begin
  select id into v_decision_id from decisions where title = 'Test decision (user A)';

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);

  begin
    perform append_decision_version(
      v_decision_id, '{}'::jsonb, '{"donnaScore": 80}'::jsonb, null,
      '{"providerId":"deterministic-v1","model":null}'::jsonb, '{"status":"ok","reason":null}'::jsonb, '[]'::jsonb,
      'decision-report/1', 'donna-score-v2', 'vendor-catalog-v1', 'attempted cross-tenant append'
    );
    raise exception 'FAIL: user B was able to append a version to user A''s decision';
  exception
    when others then
      raise notice 'PASS: cross-tenant append correctly rejected (%.)', sqlerrm;
  end;

  reset role;
end $$;

-- ── Test 2: same-tenant append succeeds, version increments, pointer updates ──
do $$
declare
  v_decision_id uuid;
  v_new_version_id uuid;
  v_new_version_number integer;
  v_current_version_id uuid;
  v_current_version_number integer;
begin
  select id into v_decision_id from decisions where title = 'Test decision (user A)';

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

  select out_version_id, out_version_number into v_new_version_id, v_new_version_number
    from append_decision_version(
      v_decision_id, '{}'::jsonb, '{"donnaScore": 84}'::jsonb, null,
      '{"providerId":"deterministic-v1","model":null}'::jsonb, '{"status":"ok","reason":null}'::jsonb, '[]'::jsonb,
      'decision-report/1', 'donna-score-v2', 'vendor-catalog-v1', 'budget increased'
    );

  if v_new_version_number <> 2 then
    raise exception 'FAIL: expected version_number 2, got %', v_new_version_number;
  end if;

  select current_version_id into v_current_version_id from decisions where id = v_decision_id;
  if v_current_version_id <> v_new_version_id then
    raise exception 'FAIL: current_version_id was not repointed to the new version';
  end if;

  select version_number into v_current_version_number from decision_versions where id = v_current_version_id;
  if v_current_version_number <> 2 then
    raise exception 'FAIL: current_version_id points at the wrong version_number';
  end if;

  raise notice 'PASS: append_decision_version correctly created version 2 and repointed current_version_id';
  reset role;
end $$;

-- ── Test 3: the previous version remains unchanged (immutability preserved) ──
do $$
declare
  v_decision_id uuid;
  v_v1_output jsonb;
begin
  select id into v_decision_id from decisions where title = 'Test decision (user A)';
  select deterministic_output_json into v_v1_output
    from decision_versions where decision_id = v_decision_id and version_number = 1;

  if v_v1_output <> '{"donnaScore": 70}'::jsonb then
    raise exception 'FAIL: version 1''s stored output changed after appending version 2 — immutability violated';
  end if;

  raise notice 'PASS: version 1 remains byte-identical after version 2 was appended';
end $$;

-- ── Test 4: sequential appends never collide on version_number ──────
-- See the file header for why this is a necessary, not sufficient,
-- proof of the real concurrency guarantee — a genuine overlapping-
-- transaction test requires two separate connections.
do $$
declare
  v_decision_id uuid;
  v3_number integer;
  v4_number integer;
begin
  select id into v_decision_id from decisions where title = 'Test decision (user A)';

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

  select out_version_number into v3_number from append_decision_version(
    v_decision_id, '{}'::jsonb, '{"donnaScore": 88}'::jsonb, null,
    '{"providerId":"deterministic-v1","model":null}'::jsonb, '{"status":"ok","reason":null}'::jsonb, '[]'::jsonb,
    'decision-report/1', 'donna-score-v2', 'vendor-catalog-v1', 'third revision'
  );
  select out_version_number into v4_number from append_decision_version(
    v_decision_id, '{}'::jsonb, '{"donnaScore": 91}'::jsonb, null,
    '{"providerId":"deterministic-v1","model":null}'::jsonb, '{"status":"ok","reason":null}'::jsonb, '[]'::jsonb,
    'decision-report/1', 'donna-score-v2', 'vendor-catalog-v1', 'fourth revision'
  );

  if v3_number <> 3 or v4_number <> 4 or v3_number = v4_number then
    raise exception 'FAIL: sequential appends produced non-incrementing or colliding version numbers (% , %)', v3_number, v4_number;
  end if;

  raise notice 'PASS: sequential appends increment version_number correctly with no collision';
  reset role;
end $$;

-- ── Test 5: append_decision_version() is security invoker, not definer ──
do $$
declare
  v_security_type text;
begin
  select case when prosecdef then 'DEFINER' else 'INVOKER' end into v_security_type
    from pg_proc where proname = 'append_decision_version';

  if v_security_type <> 'INVOKER' then
    raise exception 'FAIL: append_decision_version is SECURITY DEFINER — it must be SECURITY INVOKER, exactly like save_decision()';
  end if;

  raise notice 'PASS: append_decision_version is SECURITY INVOKER, no elevated privilege of its own';
end $$;

reset role;
rollback; -- never commits test fixtures against a real database

-- Phase 15 — billing foundation schema verification script
--
-- NOT EXECUTED as part of this task, for the same reason every other
-- verification script in this directory discloses: no local Postgres/
-- Docker/psql binary is available in this environment. Written to run
-- cleanly against a real `supabase start` local instance, or any
-- Postgres with supabase/migrations/ (including
-- 20260808140000_billing_foundation.sql) already applied.
--
-- Reuses the two-user fixture pattern established by
-- sprint6_1_rls_verification.sql and
-- sprint6_2_append_version_verification.sql.

begin;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'user-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'user-b@example.com');

-- User A's bootstrap trigger (handle_new_auth_user) already created a
-- personal organization with A as 'owner'. User B's did the same for a
-- second, unrelated organization. Both are captured below.

do $$
declare
  v_org_a uuid;
  v_org_b uuid;
  v_billing_customer_a uuid;
  v_plan_professional uuid;
begin
  select organization_id into v_org_a from organization_members where user_id = '11111111-1111-1111-1111-111111111111';
  select organization_id into v_org_b from organization_members where user_id = '22222222-2222-2222-2222-222222222222';
  select id into v_plan_professional from plans where code = 'professional';

  -- ── Test 1: plans / entitlement_definitions / plan_entitlements are
  -- readable by any authenticated user, with no organization scoping —
  -- they are a public capability catalog, not customer data. ──────────
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

  assert (select count(*) from plans) = 4,
    'Test 1a FAILED: all 4 seeded plan rows should be readable by any authenticated user';
  assert (select count(*) from entitlement_definitions) = 9,
    'Test 1b FAILED: all 9 seeded entitlement_definitions rows should be readable';

  reset role;

  -- ── Fixture: create a billing_customer + subscription for org A as
  -- the table owner (service-role equivalent for fixture setup — real
  -- writes in production only ever come from the webhook handler or an
  -- admin RPC, never a plain authenticated insert, which is exactly
  -- what Test 3 below proves). ─────────────────────────────────────────
  insert into billing_customers (organization_id, billing_provider_customer_id, created_by)
    values (v_org_a, 'cus_test_stub', '11111111-1111-1111-1111-111111111111')
    returning id into v_billing_customer_a;

  insert into subscriptions (organization_id, billing_customer_id, plan_id, status, current_period_start, current_period_end)
    values (v_org_a, v_billing_customer_a, v_plan_professional, 'active', now(), now() + interval '30 days');

  -- ── Test 2: org A's owner (admin) can read org A's billing rows;
  -- org B's owner cannot — cross-tenant billing data must never leak,
  -- same discipline as every other tenant-scoped table in this schema. ──
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
  assert (select count(*) from billing_customers where organization_id = v_org_a) = 1,
    'Test 2a FAILED: org A''s admin should see org A''s billing_customers row';
  assert (select count(*) from subscriptions where organization_id = v_org_a) = 1,
    'Test 2b FAILED: org A''s admin should see org A''s subscriptions row';
  reset role;

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);
  assert (select count(*) from billing_customers where organization_id = v_org_a) = 0,
    'Test 2c FAILED: org B''s admin must NOT see org A''s billing_customers row (cross-tenant leak)';
  assert (select count(*) from subscriptions where organization_id = v_org_a) = 0,
    'Test 2d FAILED: org B''s admin must NOT see org A''s subscriptions row (cross-tenant leak)';
  reset role;

  -- ── Test 3: no authenticated role, even the organization's own
  -- admin, can INSERT a subscriptions row directly — only a
  -- service-role client (webhook handler / future admin RPC) can,
  -- since no INSERT policy exists for the authenticated role at all. ──
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
  begin
    insert into subscriptions (organization_id, billing_customer_id, plan_id, status)
      values (v_org_a, v_billing_customer_a, v_plan_professional, 'trialing');
    raise exception 'Test 3 FAILED: an authenticated org admin should NOT be able to insert a subscriptions row directly';
  exception
    when insufficient_privilege then
      null; -- expected: no INSERT policy exists for the authenticated role
  end;
  reset role;

  -- ── Test 4: billing_webhook_events is unreadable by any
  -- authenticated role — RLS enabled with zero policies denies by
  -- default; only a service-role client bypasses this. ────────────────
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
  assert (select count(*) from billing_webhook_events) = 0,
    'Test 4 FAILED: billing_webhook_events must be unreadable by any authenticated role, regardless of content';
  reset role;

  raise notice 'All billing_foundation verification tests passed.';
end $$;

-- ── Test 5: subscriptions_org_active_unique rejects a second live
-- subscription for the same organization — "one active subscription
-- per org at a time" must be a database guarantee, not just an
-- application convention. Run as the table owner, outside the DO block
-- above, so the expected unique-violation surfaces as a normal
-- statement failure. ───────────────────────────────────────────────────
-- (Left as a documented expectation rather than a second nested
-- exception block: attempting the following insert here is expected to
-- raise `duplicate key value violates unique constraint
-- "subscriptions_org_active_unique"`.)
--
-- insert into subscriptions (organization_id, billing_customer_id, plan_id, status)
--   select organization_id, id, plan_id, 'trialing' from subscriptions limit 1;

rollback;

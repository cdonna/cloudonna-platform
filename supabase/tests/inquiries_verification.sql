-- Inquiry System — verification script
--
-- NOT EXECUTED as part of this task, for the same disclosed reason as
-- every other verification script in this directory: no local
-- Postgres/Docker/psql binary is available in this environment.

begin;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'user-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'staff@example.com');

do $$
declare
  v_inquiry_id uuid;
begin
  -- ── Test 1: an anonymous visitor can submit an inquiry. ──────────────
  set local role anon;
  insert into inquiries (inquiry_type, name, business_email, company, message, source_page)
    values ('founding_tester', 'Jane Buyer', 'jane@example.com', 'Example Corp', 'Interested.', '/contact')
    returning id into v_inquiry_id;
  reset role;

  assert v_inquiry_id is not null, 'Test 1 FAILED: anon should be able to insert an inquiry';

  -- ── Test 2: an anonymous visitor cannot read inquiries back — only
  -- staff can. ──────────────────────────────────────────────────────────
  set local role anon;
  assert (select count(*) from inquiries) = 0,
    'Test 2 FAILED: anon must not be able to SELECT any inquiry, including one they just submitted';
  reset role;

  -- ── Test 3: a plain authenticated, non-staff user also cannot read
  -- inquiries. ──────────────────────────────────────────────────────────
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
  assert (select count(*) from inquiries) = 0,
    'Test 3 FAILED: a non-staff authenticated user must not see any inquiry';
  reset role;

  -- ── Test 4: seed staff, confirm they CAN read and update. ────────────
  insert into platform_staff (user_id) values ('22222222-2222-2222-2222-222222222222');

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);
  assert (select count(*) from inquiries) = 1,
    'Test 4a FAILED: seeded platform staff should see the inquiry';

  update inquiries set status = 'in_review', owner = '22222222-2222-2222-2222-222222222222' where id = v_inquiry_id;
  assert (select status from inquiries where id = v_inquiry_id) = 'in_review',
    'Test 4b FAILED: platform staff should be able to update status/owner';
  reset role;

  -- ── Test 5: no DELETE policy exists for any role — even staff cannot
  -- delete an inquiry, only close it. ──────────────────────────────────
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);
  begin
    delete from inquiries where id = v_inquiry_id;
    raise exception 'Test 5 FAILED: no role should be able to delete an inquiry';
  exception
    when insufficient_privilege then
      null; -- expected: no DELETE policy exists for any role
  end;
  reset role;

  -- ── Test 6: DB-level constraint rejects a blank name / malformed
  -- email even if application-level Zod validation were bypassed. ──────
  set local role anon;
  begin
    insert into inquiries (inquiry_type, name, business_email) values ('general', '', 'not-an-email');
    raise exception 'Test 6 FAILED: blank name / malformed email should violate a CHECK constraint';
  exception
    when check_violation then
      null; -- expected
  end;
  reset role;

  raise notice 'All inquiries verification tests passed.';
end $$;

rollback;

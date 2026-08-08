-- Vendor Intelligence Registry — verification script
--
-- NOT EXECUTED, same disclosed reason as every other script in this
-- directory: no local Postgres available in this environment.

begin;

do $$
declare
  v_vendor_id uuid;
  v_product_id uuid;
  v_capability_id uuid;
  v_source_id uuid;
begin
  select id into v_vendor_id from vendors limit 1;
  select id into v_product_id from products where vendor_id = v_vendor_id limit 1;
  select id into v_capability_id from capabilities limit 1;

  -- ── Test 1: register an official source for an existing vendor. ─────
  insert into vendor_sources (vendor_id, source_type, url, title)
    values (v_vendor_id, 'official_documentation', 'https://example.com/docs', 'Example Docs')
    returning id into v_source_id;

  assert v_source_id is not null, 'Test 1 FAILED: should be able to register a vendor source';

  -- ── Test 2: the same (vendor, url) pair cannot be registered twice. ──
  begin
    insert into vendor_sources (vendor_id, source_type, url) values (v_vendor_id, 'official_documentation', 'https://example.com/docs');
    raise exception 'Test 2 FAILED: duplicate (vendor_id, url) should violate vendor_sources_vendor_url_key';
  exception
    when unique_violation then null; -- expected
  end;

  -- ── Test 3: record a piece of evidence with full provenance, linked
  -- to the source, product, and capability. ───────────────────────────
  insert into vendor_evidence (
    vendor_id, product_id, capability_id, source_id, signal_type, fact,
    source_url, source_title, published_at, reliability, verification_status, confidence
  ) values (
    v_vendor_id, v_product_id, v_capability_id, v_source_id, 'documentation',
    'Supports horizontal autoscaling up to 64 nodes.',
    'https://example.com/docs/scaling', 'Scaling Guide', now() - interval '10 days',
    'vendor_published', 'unverified', 0.8
  );

  assert (select count(*) from vendor_evidence where source_id = v_source_id) = 1,
    'Test 3 FAILED: evidence row with full provenance should be readable';

  -- ── Test 4: confidence is bounded to [0, 1]. ──────────────────────────
  begin
    insert into vendor_evidence (vendor_id, fact, reliability, confidence)
      values (v_vendor_id, 'Bad confidence value.', 'community', 1.5);
    raise exception 'Test 4 FAILED: confidence > 1 should violate the CHECK constraint';
  exception
    when check_violation then null; -- expected
  end;

  -- ── Test 5: public (anon) read access on catalog-style tables. ───────
  set local role anon;
  assert (select count(*) from vendor_sources) >= 1, 'Test 5a FAILED: vendor_sources should be publicly readable';
  assert (select count(*) from vendor_evidence) >= 1, 'Test 5b FAILED: vendor_evidence should be publicly readable';

  -- ── Test 6: no anon write access — populating the registry is an
  -- internal/reviewed operation, not a public one. ─────────────────────
  begin
    insert into vendor_sources (vendor_id, source_type, url) values (v_vendor_id, 'rss_feed', 'https://example.com/rss');
    raise exception 'Test 6 FAILED: anon should not be able to insert a vendor_sources row';
  exception
    when insufficient_privilege then null; -- expected: no INSERT policy for anon
  end;
  reset role;

  raise notice 'All vendor_intelligence_registry verification tests passed.';
end $$;

rollback;

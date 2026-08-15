# FOUNDER SQL ACTION REQUIRED

This environment has no Supabase CLI or project credentials, so this
step must be run manually, once, in the Supabase Dashboard. Nothing
below touches Vercel, Git, or application code — it only creates the
database schema the application already assumes exists.

## Step 1 — confirm the project is actually empty

1. **Open:** Supabase Dashboard → the `cloudonna-platform` project
   (Frankfurt/EU Central) → **SQL Editor**.
2. **Paste and run:** the full contents of
   `supabase/tests/production_diagnostic_p0.sql` (read-only — creates,
   alters, or drops nothing).
3. **What success looks like:** query 1 (`inquiries_table_status`)
   returns `MISSING — migration 20260809090000_inquiries.sql was never
   applied`, and queries 2, 3, 6, 7 are empty or show the same
   `MISSING` pattern. This confirms the project is genuinely empty and
   Step 2 is safe to run.
4. **What a different result means:** if query 1 instead returns
   `exists`, **STOP — do not run Step 2.** Some or all of the schema is
   already present, and blindly running the bootstrap script would fail
   on the first `create table`/`create type` collision (safe — nothing
   partially applies, see Step 2's transaction note — but it means the
   real state needs to be reconciled by hand instead of bootstrapped
   fresh). Return the full output of `production_diagnostic_p0.sql` and
   this will be re-assessed rather than guessed at.
5. **Return:** a screenshot or pasted text of the full result set for
   all 10 queries in `production_diagnostic_p0.sql`.

## Step 2 — apply the schema (only if Step 1 confirmed empty)

1. **Open:** the same SQL Editor, new query.
2. **Paste and run:** the full contents of
   `supabase/bootstrap/production_initial_schema.sql` — this is every
   file in `supabase/migrations/` concatenated verbatim, in exact
   filename order, wrapped in one transaction (`begin` ... `commit`).
3. **What success looks like:** the editor reports `Success. No rows
   returned` (or similar) with no red error banner. Because the whole
   script runs as one transaction, this is all-or-nothing — there is no
   possible state where "some of it worked."
4. **What an error means:**
   - `permission denied to create extension "vector"` → the `vector`
     extension needs to be enabled first via **Database → Extensions**
     in the dashboard UI, then re-run this script.
   - Any other error → the transaction rolled back automatically,
     nothing was committed, and the project is exactly as empty as it
     was before this step. Safe to return the exact error text here for
     diagnosis before retrying — do not retry blindly.
5. **Return:** the exact success message, or the exact error text if
   one occurred.

## Step 3 — re-run the diagnostic to confirm

1. Run `supabase/tests/production_diagnostic_p0.sql` again.
2. **Expected now:** `inquiries_table_status: exists`; `inquiry_type_value`
   rows = `founding_tester, enterprise, partner, vendor, general`;
   `inquiry_status_value` rows = `new, reviewing, contacted, qualified,
   closed`; `utm_medium_column_status: present`; the owner/notes query
   returns zero rows; `rate_limit_function_status: exists`;
   `business_events_table_status: exists`; three policies on
   `inquiries` (`select`/`insert`/`update`); `platform_staff_row_count`
   and `total_inquiries_ever_inserted` both `0` (expected — nobody has
   signed up or submitted anything against this project yet).
3. **Return:** this second result set. Once it matches the above, the
   application-level verification (`GET /api/health`, then one real
   test inquiry submission) can proceed.

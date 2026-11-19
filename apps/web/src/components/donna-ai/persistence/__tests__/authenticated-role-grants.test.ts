import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Regression guard for the "I can create a Decision in the UI but
 * cannot save it" production defect (brief: Decision Workspace V1 QA).
 *
 * Root cause: the `authenticated`/`anon` roles never had the base
 * PostgreSQL privilege grants (SELECT/INSERT/UPDATE/DELETE on tables,
 * EXECUTE on functions, USAGE on sequences) that Row Level Security
 * depends on as its prerequisite layer — confirmed directly against
 * production via information_schema.role_table_grants, and by
 * reproducing `permission denied for table projects` running as role
 * `authenticated` inside a rolled-back transaction. This is a
 * different failure mode from a wrong RLS policy (which this
 * codebase already has good static-isolation tests for elsewhere) —
 * no unit test with a mocked Supabase client can catch a *missing
 * GRANT*, since the mock never enforces real Postgres privileges.
 *
 * This test cannot re-verify the grants are actually live in
 * production (this suite has no database connection) — it only
 * guards against the migration that restores them, and the
 * forward-looking ALTER DEFAULT PRIVILEGES statements that prevent
 * the gap from reopening for a future table/function/sequence, ever
 * being silently deleted or weakened from the repository.
 */
const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "..", "..", "..", "..", "..", "supabase", "migrations");

function readGrantsMigration(): string {
  const files = fs.readdirSync(MIGRATIONS_DIR);
  const match = files.find((f) => f.includes("fix_missing_authenticated_grants"));
  expect(match, "the authenticated-role-grants fix migration must exist in supabase/migrations/").toBeDefined();
  return fs.readFileSync(path.join(MIGRATIONS_DIR, match!), "utf-8");
}

describe("authenticated/anon role grants fix migration", () => {
  it("grants SELECT/INSERT/UPDATE/DELETE on all existing public tables to both authenticated and anon", () => {
    const sql = readGrantsMigration().toLowerCase();
    expect(sql).toContain("grant select, insert, update, delete on all tables in schema public to authenticated");
    expect(sql).toContain("grant select, insert, update, delete on all tables in schema public to anon");
  });

  it("grants EXECUTE on all existing public functions to both roles — required for every supabase.rpc() call in this codebase", () => {
    const sql = readGrantsMigration().toLowerCase();
    expect(sql).toContain("grant execute on all functions in schema public to authenticated");
    expect(sql).toContain("grant execute on all functions in schema public to anon");
  });

  it("grants USAGE on all existing public sequences to both roles — required by decisions' human_readable_id trigger", () => {
    const sql = readGrantsMigration().toLowerCase();
    expect(sql).toContain("grant usage, select on all sequences in schema public to authenticated");
    expect(sql).toContain("grant usage, select on all sequences in schema public to anon");
  });

  it("sets ALTER DEFAULT PRIVILEGES for tables, functions, and sequences, so this gap cannot reopen for a future migration's new objects", () => {
    const sql = readGrantsMigration().toLowerCase();
    expect(sql).toContain("alter default privileges in schema public grant select, insert, update, delete on tables to authenticated");
    expect(sql).toContain("alter default privileges in schema public grant select, insert, update, delete on tables to anon");
    expect(sql).toContain("alter default privileges in schema public grant execute on functions to authenticated");
    expect(sql).toContain("alter default privileges in schema public grant execute on functions to anon");
    expect(sql).toContain("alter default privileges in schema public grant usage, select on sequences to authenticated");
    expect(sql).toContain("alter default privileges in schema public grant usage, select on sequences to anon");
  });

  it("never touches, drops, or recreates any Row Level Security policy — this fix is purely additive at the grant layer, RLS remains the real per-row enforcement", () => {
    const sql = readGrantsMigration().toLowerCase();
    expect(sql).not.toContain("drop policy");
    expect(sql).not.toContain("create policy");
    expect(sql).not.toContain("alter table") ;
    expect(sql).not.toContain("disable row level security");
  });
});

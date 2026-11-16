# ADR-0009 — Founder Control reuses `platform_staff`, not a new table

**Status:** Accepted and implemented
(`supabase/migrations/20261116090000_founder_agent.sql`).

**Date:** 2026-11-16

## Context

The brief requires that "only authorized founder/admin users may:
create tasks, approve tasks, merge, deploy," and that access never
rely on a hidden URL. This repository already has exactly this
privilege model: `platform_staff` (a table of `profiles.id`s) and
`is_platform_staff()` (a `security definer` RPC predicate), introduced
to gate `/app/inquiries` — "Grants Founder Dashboard access," per that
table's own comment.

The question was whether Founder Control is the same privilege as
Inquiries access, or a different one that happens to look similar.

## Decision

The same privilege. `founder_tasks` and its three companion tables are
gated by the identical `is_platform_staff()` predicate Inquiries
already uses, via new RLS policies in the same migration style — no
`founder_agent_staff` table, no new RPC.

`apps/web/src/app/(default)/founder/layout.tsx` checks it the same way
`/app/inquiries/page.tsx` does: `supabase.rpc("is_platform_staff")`,
checked server-side, at the layout level so every route under
`/founder` inherits the gate.

## Consequences

**Gained.** One privilege to grant, not two. A founder who can see
leads can see and run development tasks, which matches the brief's
own framing ("I want to be able to continue developing ClouDonna") —
this is the same person wearing the same hat, not two different roles
that happen to be the same individual today. No second seeding step
beyond the one `docs/operations/01-business-operations.md` already
documents ("Seeding the first platform staff member").

**Cost / accepted scope.** If ClouDonna ever has staff who should see
inquiries but not trigger remote code changes (or vice versa), this
decision would need revisiting — a second, narrower predicate
(`is_founder_agent_operator()`, say) layered on top of
`is_platform_staff()`. Not needed for V0.1: today's platform staff is
the founder alone.

**Explicitly rejected.** A new `founder_agent_staff` table. It would
have meant seeding a second privilege table for the same person on day
one, and a future reviewer asking "why are there two," with no better
answer than "no reason."

## Related

`supabase/migrations/20260809090000_inquiries.sql` (where
`is_platform_staff()` was introduced),
`docs/founder-agent/security.md` §1–2.

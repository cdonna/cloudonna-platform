# ADR-0008 — Pull-based sync; no worker-to-application webhook

**Status:** Accepted and implemented in the control plane (the sync
path is real code, currently exercised only against an unconfigured
GitHub token — see `docs/founder-agent/operations.md`).

**Date:** 2026-11-16

## Context

Once a remote worker (ADR-0007) is running, this application needs to
learn what it did: did the run start, finish, pass its quality gate,
open a pull request? The obvious shape is a webhook — the GitHub
Actions job calls `POST /api/founder/tasks/[id]/events` as it
progresses.

That shape was drafted and rejected, for a reason specific to this
codebase rather than a generic one: every RLS-gated table in this
schema (`inquiries`, `decision_versions`, `audit_logs`, ...) is written
only by a request running *as* the authenticated principal the policy
checks. A worker has no Supabase session. Making a worker-authenticated
webhook write into `founder_task_events` would require either:

- a new RLS policy admitting an anonymous, secret-bearing request —
  which the public `anon` key could then also reach, since Supabase
  exposes security-definer RPCs to `anon`/`authenticated` by default
  unless explicitly revoked; or
- a service-role client for that one route, bypassing RLS entirely —
  a credential class this codebase has deliberately never introduced
  (see `.env.example`'s note on `SUPABASE_SERVICE_ROLE_KEY`).

Either option weakens the one enforcement mechanism
(`docs/platform/database-architecture.md` already commits to: "RLS is
the real boundary, the repository is just a typed surface over it") for
the convenience of one feature.

## Decision

The control plane pulls, instead of the worker pushing. A founder's own
authenticated request — `POST /api/founder/tasks/[id]/sync`, called
either by the Task Detail screen's "Refresh progress" button or (later)
a scheduled poll — reads the GitHub Actions run for the task's branch
using the GitHub token this domain already needs for dispatch, and
writes whatever it finds into Postgres **as the founder**, under the
same `is_platform_staff()` RLS every other write in this domain uses.

The worker has no network path into this application at all.

## Consequences

**Gained.** No new secret class, no service-role client, and the
"worker cannot write directly to this database" invariant is
structural rather than policy — there is no code anywhere that accepts
a write request not attributable to an authenticated founder session.
One GitHub credential instead of two (a dispatch token and a separate
webhook-auth secret). The existing RLS model is extended, not weakened.

**Cost.** Progress is only as fresh as the last sync — there is no
real-time push the instant something happens on GitHub. Accepted: a
founder on a phone tapping "Refresh" (or a future lightweight poll
while a task's detail screen is open) is a reasonable cost for the
security property gained, and nothing in the brief requires
sub-second updates.

**A naming consequence worth stating plainly.** `founder_task_events`
rows with `actor_kind = 'worker'` are, mechanically, inserted by the
founder's own session relaying what GitHub reported — not literally by
the worker. `docs/founder-agent/security.md` §3 states this explicitly
rather than letting the column name imply otherwise.

## Related

[ADR-0007](./0007-claude-code-github-action-as-remote-worker.md),
`apps/web/src/lib/founder-agent/handle-sync-task-request.ts`.

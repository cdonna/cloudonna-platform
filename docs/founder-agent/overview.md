# Founder Agent — Overview

**Status:** V0.1 of the control plane is implemented and tested. Remote
*execution* is designed and real, but unconfigured in this environment —
no task in this repository has ever actually run on a remote worker.
See [`operations.md`](./operations.md) for exactly what is missing and
why.

---

## 1. What this is

A private, mobile-first web application at `/founder` that lets the
founder continue developing ClouDonna without a Mac: create a task in
plain language, watch a remote worker implement it on an isolated
branch, review what it produced, and explicitly approve each
irreversible step — merge, then (designed, not yet enabled) deploy.

```
Founder phone/browser
        │
/founder  (Next.js, this repository, Server Actions + a REST API)
        │
founder_tasks / founder_task_events / founder_task_artifacts /
founder_task_approvals   (Supabase/Postgres, RLS = is_platform_staff())
        │
GitHub Actions workflow_dispatch
        │
.github/workflows/founder-agent-task.yml
        │
anthropics/claude-code-action@v1  (official, runs in the Actions runner)
        │
agent/<task-id>-<slug> branch → quality gate → pull request
        │
Founder reviews, approves, merges — all from /founder
```

GitHub remains the source of truth for code, exactly as the brief
requires: the worker never writes to this application's database, and
this application never holds a copy of the repository.

## 2. Why this shape

Three decisions carry the whole design, each with its own ADR:

- **The remote worker is the official `anthropics/claude-code-action@v1`
  inside GitHub Actions**, not a hand-rolled container orchestrator —
  [ADR-0007](../adr/0007-claude-code-github-action-as-remote-worker.md).
- **The control plane never receives a push from the worker.** The
  founder's own authenticated session pulls status from GitHub instead —
  [ADR-0008](../adr/0008-pull-based-sync-no-worker-webhook.md).
- **Founder Control reuses `platform_staff` / `is_platform_staff()`
  exactly as it already gates `/app/inquiries`** — one privilege table
  for "can see ClouDonna's own operations," not a second one —
  [ADR-0009](../adr/0009-founder-agent-reuses-platform-staff.md).

## 3. What V0.1 actually does today

Real, tested, and exercised by 76 passing tests:

- Create a task in plain language from `/founder/new`.
- Persist it, with RLS restricting every read and write to platform
  staff — the same enforcement `/app/inquiries` already relies on.
- A pure, fully-tested state machine
  (`apps/web/src/lib/founder-agent/state-machine.ts`) that is the only
  code path allowed to move a task between its 13 named states, and
  that structurally cannot let a worker approve, merge, or deploy.
- A real GitHub API client and a real execution adapter that will
  dispatch `.github/workflows/founder-agent-task.yml`, sync a task's
  progress, check merge preconditions, and merge an approved pull
  request — honestly reporting "not configured" every time right now,
  because no credential exists in this environment for any of that to
  actually happen.
- A Review screen, a separate Merge Approval screen, and a separate
  (currently disabled) Deploy Approval screen — never combined.

## 4. What V0.1 does not do yet

No task has ever been dispatched for real. See
[`operations.md`](./operations.md) for the exact, short list of steps
that would change that — installing the Claude GitHub App, setting two
environment variables, and committing the workflow file this sprint
already wrote.

## 5. Where to read next

| Document | Covers |
|---|---|
| [`architecture.md`](./architecture.md) | Components, the research behind picking the Claude Code GitHub Action, what's deferred |
| [`security.md`](./security.md) | The safety model, every invariant and how it's enforced, secret handling |
| [`task-lifecycle.md`](./task-lifecycle.md) | The 13 states and every legal transition, in prose |
| [`operations.md`](./operations.md) | What's missing before the first real remote task, and how to verify one |

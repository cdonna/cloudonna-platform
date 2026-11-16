# Founder Agent — Security

**Status:** Describes the implemented design. Every invariant below has
a corresponding test in
`apps/web/src/lib/founder-agent/__tests__/state-machine.test.ts` or
`handlers.test.ts` — this document says *why* each rule exists; the
tests say that it actually holds.

---

## 1. The safety model, and where each rule actually lives

The brief's "Critical Safety Model" names five things the agent must
never do. Each maps to a specific, checkable mechanism — not a
convention anyone has to remember to follow:

| Rule | Mechanism | Test |
|---|---|---|
| Never push directly to `main` | `generateBranchName()` can structurally never return `"main"`/`"master"`; `.github/workflows/founder-agent-task.yml` only ever pushes to `agent/*`; the Action's own prompt forbids it | `github-client.test.ts` |
| Never force push | The workflow issues a plain `git push`, never `--force`; nothing in this domain constructs a force-push command | — (absence, by construction) |
| Never merge its own work | `transition()` has no branch that lets `actor.kind !== "founder"` produce `"merged"` | `state-machine.test.ts`, "the agent cannot merge without founder approval" |
| Never deploy without approval | Same shape, for `"deploy_ready"` | `state-machine.test.ts`, "the agent cannot deploy without founder approval" |
| Never delete production data, change env vars, rotate credentials, touch Supabase/DNS/billing config | The Action's prompt explicitly forbids editing `.github/workflows/`, Supabase production configuration, or any secret; the workflow's own GitHub token has no access to any of those systems; this sprint created no code path that could reach them even if asked | — (no capability exists) |

## 2. "The agent cannot approve itself" — the actual mechanism

`TaskActor` (`types.ts`) has three variants: `founder`, `worker`,
`system`. The state machine's `requireFounder()` guard is checked
positively (`actor.kind === "founder"`), never negatively
(`actor.kind !== "worker"`) — so a fourth actor kind added later
defaults to **rejected**, not silently allowed. This guards exactly
three transitions: `review_submitted` (approve/reject/request changes),
`merge_confirmed`, `deploy_confirmed`.

The handlers go one step further than the state machine requires:
`handle-review-task-request.ts`, `handle-merge-task-request.ts`, and
`handle-deploy-task-request.ts` each construct the actor as
`{ kind: "founder", founderId: userId }` themselves, where `userId`
comes only from `getCurrentUser()`'s resolved session. **There is no
parameter on any of these handlers by which a caller could supply a
different actor kind.** A worker literally cannot reach these code
paths with any actor shape other than "this didn't come from a
founder session," because nothing downstream of GitHub ever calls
them at all — see §3.

## 3. Why there is no worker-to-Postgres write path

The most consequential design choice in this domain: **the remote
worker never has network access to this application's database, or to
this application at all.**

An earlier draft of this design considered a webhook —
`POST /api/founder/tasks/[id]/events`, called by the GitHub Actions
job, authenticated by a shared secret. It was rejected, for a reason
specific to this codebase: every existing RLS-gated table in this
schema is written only by a request running *as* the authenticated
user the policy checks (`is_platform_staff()`, `is_org_admin()`, …).
A worker has no Supabase session, so a worker-authenticated webhook
would have needed either:

- widening RLS to let an anonymous, secret-bearing request write into
  `founder_task_events` (which the public `anon` key could then also
  reach, since Supabase's PostgREST exposes RPCs to `anon` by default
  unless explicitly revoked), or
- a service-role client that bypasses RLS entirely for that one route.

This codebase has deliberately never introduced a service-role client
— see `.env.example`'s own note on `SUPABASE_SERVICE_ROLE_KEY` — and
widening a security-definer RPC to `anon` for one feature's
convenience is exactly the kind of RLS erosion this codebase's whole
posture ("RLS is the real boundary, the repository is just a typed
surface over it") exists to prevent.

**The adopted design instead makes the founder's own authenticated
browser session do the asking.** `POST /api/founder/tasks/[id]/sync`
(and the "Refresh progress" button) reads the GitHub Actions run for a
task's branch using the one GitHub token this domain already needs for
dispatch, and writes whatever it finds into Postgres **as the
founder**, under the exact same `is_platform_staff()` RLS this schema
already enforces everywhere else. No new secret class, no service-role
key, and — structurally, not just by policy — no code path exists for
a worker to write into this database at all. See
[ADR-0008](../adr/0008-pull-based-sync-no-worker-webhook.md).

One consequence worth naming plainly: `founder_task_events` rows with
`actor_kind = 'worker'` are not literally inserted by a worker. They
are inserted by the founder's own session, *relaying* what a worker
reported. The distinction that matters for the brief's invariants is
preserved regardless — `sync-task.ts`'s worker-shaped transitions
(`workspace_started`, `enter_testing`, `quality_gate_result`) can never
produce `approved`/`merge_ready`/`merged`/`deploy_ready`/`deployed`, no
matter what GitHub reports, because `transition()` has no branch that
lets a `system`-or-`worker`-attributed event produce those (§2).

## 4. A failed quality gate cannot become `review_ready`

`handleTesting()` in `state-machine.ts` has exactly one branch that
returns `"review_ready"`, gated on `qualityGateAllPassed(gate)` — a
pure function checking all four of TypeScript/ESLint/Vitest/build. There
is no second branch, no override, and no caller-supplied flag that
reaches `review_ready` any other way. A caller cannot "lie" about this
by setting `repairAttempted: true` — that flag only ever decides
between "try again" (`running`) and "give up" (`failed`), never between
"passed" and "review_ready anyway."

The workflow (`founder-agent-task.yml`) is written so that a `success`
run conclusion is only possible if all four checks genuinely passed
(the job's final step explicitly fails if they didn't) — which is what
lets `handle-sync-task-request.ts` treat a green run as "all four
passed" honestly, without yet having built the artifact-parsing step
that would confirm it per-check (see `architecture.md` §6).

## 5. Secrets

| Secret | Held where | Used by | Never |
|---|---|---|---|
| `FOUNDER_AGENT_GITHUB_TOKEN` | Server-only env var (Vercel, once set — not set by this sprint) | `github-client.ts`, server-side only | Sent to the browser; used by the GitHub Actions workflow itself |
| `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` | GitHub Actions repository secret (not set by this sprint) | `claude-code-action@v1`, inside the runner | Read by this application at all |
| The Claude GitHub App's own installation token | Managed by GitHub/the Claude GitHub App | The workflow's commit/PR steps, if `github_token` is omitted from the Action's inputs | Held anywhere in this codebase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Already public, by design (existing) | Every Supabase call in this domain | Used to bypass RLS — it can't; that's the point of RLS |

Two credentials, two blast radii, by design: `FOUNDER_AGENT_GITHUB_TOKEN`
(fine-grained, scoped to one repository, `Actions: write` /
`Contents: read` / `Pull requests: write` — no `Administration`, no
`Secrets`) is what *this application* uses to dispatch and merge. The
Claude GitHub App's own token is what *the workflow, once running*
uses to read/write repository contents inside the sandbox. Neither can
reach the other's job. No `SUPABASE_SERVICE_ROLE_KEY` exists anywhere
in this design — see §3.

## 6. Least privilege for the coding worker

The Action's prompt (`founder-agent-task.yml`) explicitly scopes what
Claude may touch: `apps/`, `packages/`, `docs/`, and new Supabase
migrations only — never an existing migration, never
`.github/workflows/`, never a secret, never Supabase production
configuration. `--allowedTools` is scoped to `Edit`, `Read`, `Grep`,
`Glob`, and three `Bash(npm run *)`/`Bash(npx tsc*)`/`Bash(npx
eslint*)`/`Bash(npx vitest*)` patterns — no unrestricted shell, no
network tool, no infrastructure command.

This is a prompt-level and tool-permission-level restriction, not a
sandboxed filesystem boundary — the honest statement of its limits.
The GitHub Actions runner itself is ephemeral and destroyed after the
job, which is the real isolation boundary between one task and the
next.

## 7. What this sprint did not configure, and why that's a manual step

**Branch protection on `main` requiring a pull request and passing
checks** is not configured by this sprint — doing so would mean
editing live GitHub repository settings, which the brief's "Do not"
section and this sprint's own instructions both rule out. It is the
second, independent enforcement of "the worker cannot write directly
to `main`" (the first being that the workflow never attempts to), and
setting it is listed as a manual prerequisite in `operations.md`.

**The Claude GitHub App installation** and the two GitHub secrets
(`ANTHROPIC_API_KEY`, and `FOUNDER_AGENT_GITHUB_TOKEN`/
`FOUNDER_AGENT_REPO` as Vercel environment variables) are likewise not
set by this sprint, for the same reason: this is a local development
sprint, and setting live credentials is explicitly out of scope until a
founder reviews this design.

# Founder Agent — Architecture

**Status:** Control plane implemented. Execution adapter real but
unconfigured. Read [`overview.md`](./overview.md) first.

---

## 1. The research this was built from

Before writing any code, this sprint evaluated the current official
mechanisms for running Claude Code remotely:

| Mechanism | Fit for this brief |
|---|---|
| **Claude Code GitHub Action** (`anthropics/claude-code-action@v1`) | Runs the full Claude Code runtime inside a standard, ephemeral GitHub Actions runner. Supports `workflow_dispatch` with a plain-text `prompt` input (automation mode, no `@claude` mention needed) alongside its interactive `@claude`-mention mode. Authenticates via an `ANTHROPIC_API_KEY` or subscription OAuth token stored as a GitHub secret. Official, GitHub-native, no Mac dependency. **Selected.** |
| **Claude Agent SDK**, self-hosted | Headless by design (`permissionMode`, `bypassPermissions`), and as of May 2026 supports self-hosted sandboxes (Cloudflare Workers, Daytona, Modal, Vercel, your own VPC) in addition to Anthropic's managed cloud sandbox. More powerful and more general than this brief needs — it is in fact what the GitHub Action is *built on* — but adopting it directly here would mean this sprint also designing and operating the sandbox/worker infrastructure the Action already provides for free. Not selected for V0.1; named in `operations.md` as the natural next step if a task ever needs to run outside GitHub Actions' own runner limits (45 minutes, GitHub-hosted hardware). |
| **Claude Code on the web** (`code.claude.com`) | Cloud-hosted interactive sessions. No documented API for a third-party control plane to programmatically start one on a specific task and poll it — built for a human driving a browser tab, not for `/founder` to orchestrate. Not selected. |
| **A hand-rolled container orchestrator** (ECS/Fargate/Cloud Run running `claude` directly) | Would work, and would require this sprint to design and secure an entire ephemeral-compute platform — exactly the kind of "unrestricted infrastructure privilege" and "infrastructure sprawl" the brief's Agent Permissions and Do Not sections warn against — to re-implement what GitHub Actions + the official Action already provide, maintained by GitHub and Anthropic respectively. Not selected. |

**Decision:** the Claude Code GitHub Action running inside GitHub
Actions' own ephemeral runners. See
[ADR-0007](../adr/0007-claude-code-github-action-as-remote-worker.md).

## 2. Components

```
apps/web/src/lib/founder-agent/
  types.ts                        pure types: status, actor, events
  state-machine.ts                the only code path that moves .status
  schema.ts                       zod request schemas
  repository.ts                   RLS-gated reads/writes, 4 tables
  github-client.ts                typed GitHub REST wrapper
  execution-adapter.ts            ExecutionAdapter interface + the real,
                                   unconfigured GithubActionsExecutionAdapter
  handle-*-task-request.ts        one handler per action, framework-independent

apps/web/src/app/api/founder/tasks/...   thin Route Handlers over the above
apps/web/src/app/(default)/founder/...   the UI; Server Actions call the
                                          same handlers directly

.github/workflows/founder-agent-task.yml  the remote worker definition

supabase/migrations/20261116090000_founder_agent.sql
  founder_tasks / founder_task_events / founder_task_artifacts /
  founder_task_approvals — all RLS-gated by is_platform_staff()
```

Every handler takes `(input, supabase, userId, adapter?)` and returns
`{ status, body }` — the same framework-independent shape
`handle-create-inquiry-request.ts` and
`handle-append-decision-version-request.ts` already established in this
codebase, which is also exactly what makes every handler testable with
a plain mock Supabase client and a fake `ExecutionAdapter`, with no
real network or database involved (see
`apps/web/src/lib/founder-agent/__tests__/`).

## 3. The execution adapter — real code, honestly unconfigured

`ExecutionAdapter` is the seam the brief names directly: *"If a
reliable remote worker cannot yet be safely implemented in this
sprint: implement the control plane and interfaces honestly, document
the missing execution adapter, do not pretend tasks are executing
remotely."*

`GithubActionsExecutionAdapter` is not a mock. It makes real HTTP calls
to the GitHub REST API — `dispatchWorkflow`, `findLatestRunForBranch`,
`getPullRequestForBranch`, `compareBranchToBase`, `mergePullRequest` —
all in `github-client.ts`, all unit-tested against a fake `fetch` (not
shown here; see `github-client.test.ts` for the pure helpers that don't
need one). It is **unconfigured** because this repository sets neither
`FOUNDER_AGENT_GITHUB_TOKEN` nor `FOUNDER_AGENT_REPO`, and this sprint
does not set them (see `security.md`). Every method returns a typed
`{ ok: false, notConfigured: true, reason }` when that's the case, and
every handler that calls it propagates that honestly as a 503 — never
as a fabricated success.

`getExecutionAdapter()` is the one function anything in this domain
calls to obtain an adapter, so swapping the implementation later (a
different CI provider, a self-hosted Claude Agent SDK sandbox) is a
one-function change — the same replaceable-provider shape
`select-provider.ts` already uses for the Donna Intelligence Engine.

## 4. The worker — `.github/workflows/founder-agent-task.yml`

Triggered only by `workflow_dispatch`, called only by
`dispatchWorkflow()`. One job:

1. Checks out `main`, creates (or resumes) `agent/<task-id>-<slug>` —
   never `main`.
2. Runs `anthropics/claude-code-action@v1` in automation mode with a
   prompt built from the task's title, description, constraints, and
   acceptance criteria, instructing it to read `CLAUDE.md`, relevant
   docs/ADRs, and the current implementation before editing — the
   brief's "Agent Instructions" section, verbatim.
3. Runs this repository's own quality gate (TypeScript, ESLint, Vitest,
   production build) as explicit steps in the same job — not trusted
   to the Action's own judgment.
4. If the gate fails, runs **exactly one** repair pass with the actual
   failures attached, then re-checks once. Still failing → the job
   exits non-zero, which is what gives `handle-sync-task-request.ts`
   the right to treat a `success` run conclusion as "every gate
   passed" without parsing an artifact for it.
5. Commits, pushes to the task branch (never `main`), opens a pull
   request if one doesn't exist, and uploads a `founder-agent-report`
   artifact.

Never merges anything. The only code path in this entire repository
that calls GitHub's PR-merge endpoint is
`handle-merge-task-request.ts`, itself gated on a founder-only state
transition — see `task-lifecycle.md` and `security.md`.

## 5. Pull-based sync, not a worker webhook

The worker never calls back into this application. A founder-triggered
`POST /api/founder/tasks/[id]/sync` (or the UI's "Refresh progress"
button) reads the GitHub Actions run for the task's branch and relays
what it finds into `founder_task_events` / `founder_tasks.status`,
running under the founder's own RLS-protected session. See
[ADR-0008](../adr/0008-pull-based-sync-no-worker-webhook.md) for why
this was chosen over a webhook, and `security.md` for what it means for
"the worker cannot write directly to this database" to be literally
true rather than merely intended.

## 6. What's deferred, and why

| Deferred | Why | What would change it |
|---|---|---|
| Downloading and parsing the `founder-agent-report` artifact's JSON contents | The run's pass/fail conclusion already gives an honest, if coarse, quality-gate signal (§4.4); parsing the artifact for per-check detail and a real diff/files-changed list is real, additive work, not a blocker to the rest of V0.1 | Needed before the Review screen can show a real diff instead of "no artifact recorded yet" |
| Playwright screenshots | No pipeline produces one. A placeholder image would be exactly the "fake UI" the brief rules out | A follow-up task that adds a screenshot step to the workflow and an artifact type this schema already has a slot for (`screenshot_desktop`/`screenshot_mobile`) |
| Production deployment | Designed (schema, state machine, handler, UI) and deliberately disabled (`DEPLOYMENT_ENABLED = false`) — see `operations.md` | A separate, deliberate phase, per the brief's own allowance |
| A GitHub branch-protection rule requiring PR review on `main` | This sprint must not modify live GitHub repository settings | A one-time, manual repository-settings change — documented, not automated, in `security.md` |
| Self-hosted Claude Agent SDK sandboxes | GitHub Actions' own runner (45-minute limit, GitHub-hosted hardware) is enough for every task this V0.1 is designed for | A task that genuinely needs a longer-running or more customized sandbox than an Actions runner provides |

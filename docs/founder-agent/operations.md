# Founder Agent — Operations

**Status:** The honest gap between what this sprint built and what it
takes to run a real remote task. Nothing below has been done by this
sprint; it is a checklist for a founder to work through later.

---

## 1. Steps required before the first real remote task

In order:

1. **Install the Claude GitHub App** on `cdonna/cloudonna-platform` (or
   run `/install-github-app` from a local `claude` session with `gh`
   authenticated). Grants the app Contents (read/write), Issues
   (read/write), Pull requests (read/write) — see the app's own
   permission list in Anthropic's GitHub Actions docs.
2. **Add the `ANTHROPIC_API_KEY` secret** (or `CLAUDE_CODE_OAUTH_TOKEN`
   if authenticating via a Claude subscription instead) to the
   repository's GitHub Actions secrets.
3. **Commit and push `.github/workflows/founder-agent-task.yml`** to
   `main` — GitHub only recognizes `workflow_dispatch` workflows that
   already exist on the default branch. This file exists in the
   working tree right now; this sprint has deliberately not committed
   it, per this sprint's own instructions.
4. **Create a fine-grained GitHub personal access token**, scoped to
   this one repository only, with `Actions: write`, `Contents: read`,
   `Pull requests: write`. No `Administration`, no `Secrets`, no
   org-wide scope. See `security.md` §5 for why this is a distinct
   credential from the one in step 2.
5. **Set `FOUNDER_AGENT_GITHUB_TOKEN`** (the token from step 4) and
   **`FOUNDER_AGENT_REPO`** (`"cdonna/cloudonna-platform"`) as server-only
   Vercel environment variables for this project. Not `NEXT_PUBLIC_*`.
6. **(Recommended, separate from this sprint)** Add a branch protection
   rule on `main` requiring a pull request before merging, and
   requiring the quality-gate check to pass — the second, independent
   enforcement of "the worker cannot write directly to main" (the
   first being that the workflow never attempts to). This is a GitHub
   repository *settings* change, which this sprint does not make.

Once all six are done, `GithubActionsExecutionAdapter.isConfigured()`
returns `true` and the next task a founder dispatches from `/founder`
will actually run.

## 2. How to verify the first real task, once configured

1. Create a small, low-risk task from `/founder/new` — something like a
   copy fix on one page.
2. Tap **Start**. Confirm the response is `200`, not `503`. If it's
   `503` with `notConfigured: true`, re-check step 5 above — a missing
   or malformed `FOUNDER_AGENT_REPO` (wrong `"owner/repo"` shape) is the
   most likely cause.
3. Watch the run appear in the repository's **Actions** tab, named
   "Founder Agent Task."
4. Tap **Refresh progress** on the Task Detail screen once the run
   starts, and again once it completes. Confirm the task moves
   `planning → running → testing → review_ready` (or `failed`).
5. Open **Review**. Confirm the linked pull request is real and the
   branch name matches `agent/<task-id-prefix>-<slug>`.
6. Confirm the PR touched only files inside `apps/`, `packages/`,
   `docs/`, or a **new** file under `supabase/migrations/` — the
   prompt's own scope restriction (`security.md` §6). If it touched
   anything else, treat that as a real finding, not a one-off.
7. Approve, then open **Merge**, confirm it reports CI green and a
   fresh branch, and merge. Confirm on GitHub that the merge actually
   happened and that `main`'s history shows a squash-merge commit.
8. Leave **Deploy** alone — it is designed to return 501 until a
   separate, deliberate phase enables it (§3).

## 3. Enabling production deployment — a separate phase, by design

The brief explicitly allows this: *"Keep production deployment
approval designed but it may be disabled initially if safe deployment
integration requires a separate phase."* This sprint takes that option.
`handle-deploy-task-request.ts` exports a single flag,
`DEPLOYMENT_ENABLED = false`, checked before any deployment logic runs.

Enabling it for real requires, at minimum:

- A decision on the deployment mechanism: letting Vercel's own
  GitHub integration deploy `main` automatically on merge (simplest,
  but then "deploy approval" is really "merge approval already was the
  deploy approval," which may not be what a founder wants), vs. an
  explicit, separate deploy step (e.g. `vercel deploy --prod` from a
  second workflow, triggered only by the Deploy Approval screen).
- If the latter: a Vercel token, held the same way
  `FOUNDER_AGENT_GITHUB_TOKEN` is — server-only, narrowly scoped, never
  in this schema.
- Implementing the `deployment_result` event path in
  `handle-deploy-task-request.ts` (currently unreachable code, kept
  visible in the diff rather than deleted, per that file's own
  comment) with a real adapter call.
- Post-deployment verification exactly as the brief specifies:
  `/api/health`, the critical public routes, and the Donna AI API —
  none of which this sprint implements, since there is nothing to
  verify yet.
- Flipping `DEPLOYMENT_ENABLED` to `true` as its own, reviewed, named
  change — never as a side effect of an unrelated edit.

## 4. What "GitHub remains the source of truth" means operationally

This application never stores a copy of the repository, never caches
file contents beyond what an artifact explicitly uploads, and never
resolves a merge conflict — `handle-merge-task-request.ts` refuses to
merge a stale branch and routes it back through the quality gate
instead (`task-lifecycle.md` §2, the `approved → running` transition).
If `/founder`'s database and GitHub's actual state ever disagree, the
founder's own "Refresh progress" / re-opening Merge Approval always
re-reads from GitHub — there is no cached state this tool trusts over
GitHub's.

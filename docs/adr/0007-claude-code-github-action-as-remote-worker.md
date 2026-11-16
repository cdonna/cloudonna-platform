# ADR-0007 — The Claude Code GitHub Action as the remote worker

**Status:** Accepted as architectural direction. **Not deployed** — no
Claude GitHub App is installed on this repository, and this sprint does
not install it. See `docs/founder-agent/operations.md`.

**Date:** 2026-11-16

## Context

The Founder Agent needs a remote worker that can implement a task on an
isolated branch without depending on the founder's Mac. The brief asks
specifically to evaluate the Claude Agent SDK, Claude Code cloud/web
sessions, the Claude Code GitHub integration, and GitHub Actions, and
to prefer official Anthropic/GitHub-supported mechanisms.

Four options were researched (see
`docs/founder-agent/architecture.md` §1 for the full comparison):

1. The official **Claude Code GitHub Action**
   (`anthropics/claude-code-action@v1`), run inside GitHub Actions.
2. A self-hosted **Claude Agent SDK** sandbox (Cloudflare Workers,
   Daytona, Modal, Vercel, or a custom VPC worker).
3. **Claude Code on the web** (`code.claude.com`), Anthropic's own
   cloud-hosted interactive sessions.
4. A hand-rolled container orchestrator (ECS/Fargate/Cloud Run)
   running the `claude` CLI directly.

## Decision

Option 1. `.github/workflows/founder-agent-task.yml`, triggered by
`workflow_dispatch`, runs `anthropics/claude-code-action@v1` in
automation mode (a plain-text `prompt` input, no `@claude` mention
required) inside a standard GitHub-hosted runner.

## Consequences

**Gained.** Ephemeral by construction — the runner is destroyed after
the job, satisfying "the worker environment should be disposable"
without this sprint building anything to dispose of. No Mac dependency.
Maintained by GitHub (the runner) and Anthropic (the Action) rather
than by this team. The Action already handles tool-permission scoping
(`--allowedTools`), write-access checks on the triggering actor, and
bot-loop prevention — security surface this sprint did not have to
design from scratch.

**Cost.** A GitHub Actions job has a 45-minute default timeout and
runs on GitHub-hosted hardware — a genuinely long or resource-heavy
task could outgrow it. Accepted for V0.1: every task this control
plane is designed for (a scoped page/component/doc change) fits
comfortably inside that window.

**Rejected: option 2 (self-hosted Agent SDK sandbox).** More general
and more powerful, but it is in fact the layer the GitHub Action is
*built on* — choosing it directly would mean this sprint also
designing and operating the sandbox/worker infrastructure the Action
already provides. Revisit if a task's requirements genuinely exceed
an Actions runner's limits (duration, custom OS-level dependencies, a
persistent workspace across tasks).

**Rejected: option 3 (Claude Code on the web).** Built for a human
driving a browser tab; no documented API for a third-party control
plane to start a session programmatically on a specific task and poll
its result.

**Rejected: option 4 (hand-rolled orchestrator).** Would re-implement,
at higher operational cost and larger security surface, what options
1–2 already provide — exactly the "unrestricted infrastructure
privilege" and "infrastructure sprawl" this sprint's own brief warns
against.

## Related

[ADR-0008](./0008-pull-based-sync-no-worker-webhook.md) (how this
application learns what the worker did), `docs/founder-agent/`
(the full design).

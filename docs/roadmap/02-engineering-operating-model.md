# ClouDonna — Engineering Operating Model

The fifteen-step process every sprint or sub-sprint in this roadmap follows, without exception. This is not aspirational — it is a description of how Sprint 5 and Sprint 6.1 were actually executed, generalized so the pattern is explicit rather than tribal knowledge.

## The fifteen steps

1. Work in an isolated branch and worktree.
2. Start from verified `origin/main`.
3. Review current architecture before implementation.
4. Define exact scope and exclusions — written down before code, not inferred afterward.
5. Implement the smallest production-suitable vertical slice.
6. Add tests during implementation, not as a separate pass at the end.
7. Document security and privacy boundaries.
8. Run full quality gates.
9. Conduct a scope review — does what was built match what was scoped?
10. Do not commit until approved.
11. Do not merge until approved.
12. Do not push until approved.
13. Do not deploy until approved.
14. Perform production smoke tests after deployment.
15. Record known limitations honestly — every sprint's final report names what it did not solve, not just what it did.

## Required quality gates, every stage, no exceptions

```
npx tsc --noEmit
npm run lint
npm run build
npx vitest run
npm audit
```

When database code exists (`packages/database`, or any future package), its own TypeScript and validation gates run separately — a workspace-level `tsc` pass does not substitute for checking each package in isolation, since `apps/web`'s own `tsconfig.json` does not include other workspaces.

## Never

- Use `any` to bypass a contract.
- Use `@ts-ignore`/`@ts-expect-error` to bypass a defect.
- Weaken RLS for convenience.
- Expose a service-role key to client code.
- Commit real secrets.
- Persist raw provider responses.
- Persist raw prompts by default.
- Modify a production database without an explicit, separate migration approval.
- Mix unrelated sprint scopes in one implementation pass.
- Silently start the next sprint without founder approval.

## Why this list, specifically

Every rule above maps to a real incident-shaped lesson already lived in this codebase, not a generic best-practices list:

- "Add tests during implementation" — Sprint 5's own test suite caught two real bugs (`withTimeout()` conflating timeout and thrown-error outcomes; a whitespace/control-character ordering bug in `sanitize.ts`) before they shipped, specifically because tests existed alongside the code, not after it.
- "Never weaken RLS for convenience" — Sprint 6.1's `save_decision()` function is `security invoker`, explicitly stated even though it's the default, specifically because a future edit adding `security definer` "to make something easier" would silently grant it privilege it should never have.
- "Never persist raw provider responses / raw prompts" — enforced structurally in Sprint 6.1 (the persisted schema has no field for either), not by a redaction step that could be forgotten.
- "Do not mix unrelated sprint scopes" — the Platform Foundation v1 release deliberately excluded Sprint 4's database content from the first `main` merge until explicit founder approval covered it, rather than bundling three sprints' scope into one release decision by default.
- "Record known limitations honestly" — every sprint's final report in this codebase's history names what it didn't solve (no audit logging in 6.1, no historical vendor-catalog snapshot in Sprint 5's replay design, no RLS execution without a local Postgres instance) rather than presenting a clean report that omits the gaps.

## Approval gates are per-stage, not per-task

"Founder approval" in this operating model means approval of a completed, reviewed stage — not a rubber stamp on a plan. A stage that fails its own quality gates, or whose scope review reveals it drifted from its written scope, is not ready for approval regardless of how much work went into it.

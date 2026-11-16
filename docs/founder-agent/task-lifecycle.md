# Founder Agent — Task Lifecycle

**Status:** Implements exactly the 13 states the brief names, no more,
no fewer. The single source of truth is
`apps/web/src/lib/founder-agent/state-machine.ts`; this document is its
prose explanation, kept in sync with it by the test suite
(`__tests__/state-machine.test.ts`) rather than by hand-checking.

---

## 1. The states

```
queued → planning → running → testing → review_ready
                                            │        │
                              changes_requested   approved
                                   │                  │
                                 running         merge_ready
                                                       │
                                                     merged
                                                       │
                                                  deploy_ready
                                                       │
                                                    deployed

failed and cancelled are reachable from most of the above; both are terminal.
```

| Status | Who/what put it there | Meaning |
|---|---|---|
| `queued` | A founder created the task | Created, not yet dispatched |
| `planning` | Founder dispatched it | GitHub Actions run accepted, not yet running |
| `running` | Worker/system reported the run left the queue | Claude Code is working on the branch |
| `testing` | Worker/system reported the run completed | The quality gate is being evaluated |
| `review_ready` | The quality gate fully passed | Waiting for the founder's Review decision |
| `changes_requested` | Founder reviewed and asked for changes | Waiting for the founder to resume (re-dispatch) |
| `approved` | Founder approved on Review | Waiting for merge-precondition checks |
| `merge_ready` | CI confirmed green and the branch confirmed current | Waiting for the founder's explicit Merge confirmation |
| `merged` | Founder confirmed merge, and GitHub confirmed it happened | In `main`; deploy is optional from here |
| `deploy_ready` | Founder confirmed deploy (designed; currently disabled) | Waiting for the deployment pipeline |
| `deployed` | The deployment pipeline reported success | Done |
| `failed` | The quality gate failed after one repair attempt, a deployment failed, or a founder rejected the work | Terminal |
| `cancelled` | A founder cancelled, or rejected on Review | Terminal |

## 2. Every legal transition

Read as `status --event(actor)--> status`. Anything not listed is
illegal and `transition()` returns `{ ok: false, reason }` for it.

```
queued --dispatch(founder|system)--> planning
queued --dispatch_failed(any)--> queued          (adapter not configured; no-op)
queued --cancel(founder)--> cancelled

planning --plan_created(any)--> planning          (logged, no status change)
planning --workspace_started(worker|system)--> running
planning --dispatch_failed(any)--> failed
planning --cancel(founder)--> cancelled

running --branch_created(any)--> running          (logged, no status change)
running --enter_testing(any)--> testing
running --cancel(founder)--> cancelled

testing --quality_gate_result{allPassed:true}(any)--> review_ready
testing --quality_gate_result{allPassed:false, repairAttempted:true}(any)--> failed
testing --quality_gate_result{allPassed:false, repairAttempted:false}(any)--> running
testing --cancel(founder)--> cancelled

review_ready --review_submitted{approved}(founder ONLY)--> approved
review_ready --review_submitted{changes_requested}(founder ONLY)--> changes_requested
review_ready --review_submitted{rejected}(founder ONLY)--> cancelled
review_ready --cancel(founder)--> cancelled

changes_requested --workspace_started(worker|system)--> running
changes_requested --cancel(founder)--> cancelled

approved --merge_preconditions_checked{ciGreen:true, branchStale:false}(founder|system)--> merge_ready
approved --merge_preconditions_checked{otherwise}(founder|system)--> running
approved --cancel(founder)--> cancelled

merge_ready --merge_confirmed(founder ONLY)--> merged
merge_ready --cancel(founder)--> cancelled

merged --deploy_confirmed(founder ONLY)--> deploy_ready
                                            (merged has no cancel — it's in main)

deploy_ready --deployment_result{ok:true}(system)--> deployed
deploy_ready --deployment_result{ok:false}(system)--> failed
                                            (deploy_ready has no cancel — see below)

deployed, cancelled, failed: terminal. No event transitions out of any of them.
```

`merged` and `deploy_ready` are deliberately not cancellable — code
that is already in `main` (or mid-deployment) is reverted, not
"cancelled." Everything upstream of `merged` can be cancelled by a
founder at any point.

## 3. Where each step actually happens

| Transition | Who calls it | File |
|---|---|---|
| `dispatch` / `workspace_started` (resume) | Founder taps Start/Resume | `handle-dispatch-task-request.ts` |
| `workspace_started` / `enter_testing` / `quality_gate_result` | Founder's session, relaying GitHub's state | `handle-sync-task-request.ts` |
| `review_submitted` | Founder, on the Review screen | `handle-review-task-request.ts` |
| `merge_preconditions_checked` / `merge_confirmed` | Founder, on the Merge Approval screen | `handle-merge-task-request.ts` |
| `deploy_confirmed` | Founder, on the Deploy Approval screen (always returns 501 today) | `handle-deploy-task-request.ts` |
| `cancel` | Founder, from the Task Detail screen | `handle-cancel-task-request.ts` |

## 4. A worked example

The illustrative happy path exercised directly in
`state-machine.test.ts`'s "walks queued through merged" test:

1. Founder creates a task → `queued`.
2. Founder taps **Start** → dispatch succeeds → `planning`.
3. Founder (or an automatic refresh) syncs → the run has left the
   queue → `running`.
4. Sync again → the run completed → `testing` → quality gate passed →
   `review_ready`.
5. Founder taps **Approve** on the Review screen → `approved`.
6. Founder opens Merge Approval; the handler checks CI green and the
   branch fresh → `merge_ready`.
7. Founder confirms **Yes, merge** → GitHub confirms the merge →
   `merged`.

At every founder-only step above, the actor is constructed by the
handler itself from `getCurrentUser()`'s resolved session — there is no
request parameter that could make it anything else. See `security.md`
§2.

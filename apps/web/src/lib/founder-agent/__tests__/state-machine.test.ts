import { describe, expect, it } from "vitest";
import { transition } from "../state-machine";
import type { QualityGateResult, TaskActor } from "../types";

const FOUNDER: TaskActor = { kind: "founder", founderId: "founder-1" };
const WORKER: TaskActor = { kind: "worker", workerRef: "run-1" };
const SYSTEM: TaskActor = { kind: "system" };

const ALL_PASSED: QualityGateResult = { typescript: "passed", eslint: "passed", vitest: "passed", build: "passed" };
const ALL_FAILED: QualityGateResult = { typescript: "failed", eslint: "failed", vitest: "failed", build: "failed" };
const ONE_FAILED: QualityGateResult = { typescript: "passed", eslint: "failed", vitest: "passed", build: "passed" };

describe("state-machine: critical invariants", () => {
  it("the agent cannot approve itself — a worker review_submitted is rejected", () => {
    const result = transition("review_ready", { kind: "review_submitted", decision: "approved" }, WORKER);
    expect(result.ok).toBe(false);
  });

  it("the agent cannot approve itself — a system review_submitted is also rejected", () => {
    const result = transition("review_ready", { kind: "review_submitted", decision: "approved" }, SYSTEM);
    expect(result.ok).toBe(false);
  });

  it("a founder review_submitted(approved) is accepted", () => {
    const result = transition("review_ready", { kind: "review_submitted", decision: "approved" }, FOUNDER);
    expect(result).toEqual({ ok: true, next: "approved" });
  });

  it("the agent cannot merge without founder approval — a worker merge_confirmed is rejected", () => {
    const result = transition("merge_ready", { kind: "merge_confirmed" }, WORKER);
    expect(result.ok).toBe(false);
  });

  it("the agent cannot merge without founder approval — a system merge_confirmed is rejected", () => {
    const result = transition("merge_ready", { kind: "merge_confirmed" }, SYSTEM);
    expect(result.ok).toBe(false);
  });

  it("a founder merge_confirmed from merge_ready is accepted", () => {
    const result = transition("merge_ready", { kind: "merge_confirmed" }, FOUNDER);
    expect(result).toEqual({ ok: true, next: "merged" });
  });

  it("the agent cannot deploy without founder approval — a worker deploy_confirmed is rejected", () => {
    const result = transition("merged", { kind: "deploy_confirmed" }, WORKER);
    expect(result.ok).toBe(false);
  });

  it("the agent cannot deploy without founder approval — a system deploy_confirmed is rejected", () => {
    const result = transition("merged", { kind: "deploy_confirmed" }, SYSTEM);
    expect(result.ok).toBe(false);
  });

  it("a founder deploy_confirmed from merged is accepted", () => {
    const result = transition("merged", { kind: "deploy_confirmed" }, FOUNDER);
    expect(result).toEqual({ ok: true, next: "deploy_ready" });
  });

  it("a failed quality gate cannot become review_ready — all checks failing, repair already attempted", () => {
    const result = transition("testing", { kind: "quality_gate_result", gate: ALL_FAILED, repairAttempted: true }, SYSTEM);
    expect(result).toEqual({ ok: true, next: "failed" });
  });

  it("a failed quality gate cannot become review_ready — one check failing is still a failure", () => {
    const result = transition("testing", { kind: "quality_gate_result", gate: ONE_FAILED, repairAttempted: true }, SYSTEM);
    expect(result).toEqual({ ok: true, next: "failed" });
  });

  it("a failed quality gate with no repair attempted yet loops back to running, not review_ready", () => {
    const result = transition("testing", { kind: "quality_gate_result", gate: ONE_FAILED, repairAttempted: false }, SYSTEM);
    expect(result).toEqual({ ok: true, next: "running" });
  });

  it("a fully passed quality gate reaches review_ready", () => {
    const result = transition("testing", { kind: "quality_gate_result", gate: ALL_PASSED, repairAttempted: false }, SYSTEM);
    expect(result).toEqual({ ok: true, next: "review_ready" });
  });

  it("a worker cannot dispatch its own task", () => {
    const result = transition("queued", { kind: "dispatch" }, WORKER);
    expect(result.ok).toBe(false);
  });

  it("a founder can dispatch a queued task", () => {
    const result = transition("queued", { kind: "dispatch" }, FOUNDER);
    expect(result).toEqual({ ok: true, next: "planning" });
  });

  it("every terminal status rejects every event, for every actor", () => {
    const terminal = ["deployed", "cancelled", "failed"] as const;
    const actors = [FOUNDER, WORKER, SYSTEM];
    for (const status of terminal) {
      for (const actor of actors) {
        expect(transition(status, { kind: "dispatch" }, actor).ok).toBe(false);
        expect(transition(status, { kind: "cancel" }, actor).ok).toBe(false);
      }
    }
  });
});

describe("state-machine: review decisions", () => {
  it("changes_requested loops the task back toward running once the worker resumes", () => {
    const requested = transition("review_ready", { kind: "review_submitted", decision: "changes_requested" }, FOUNDER);
    expect(requested).toEqual({ ok: true, next: "changes_requested" });

    const resumed = transition("changes_requested", { kind: "workspace_started" }, SYSTEM);
    expect(resumed).toEqual({ ok: true, next: "running" });
  });

  it("a founder cannot claim workspace_started directly on a changes_requested task", () => {
    const result = transition("changes_requested", { kind: "workspace_started" }, FOUNDER);
    expect(result.ok).toBe(false);
  });

  it("rejected ends the task as cancelled", () => {
    const result = transition("review_ready", { kind: "review_submitted", decision: "rejected" }, FOUNDER);
    expect(result).toEqual({ ok: true, next: "cancelled" });
  });
});

describe("state-machine: merge preconditions", () => {
  it("a stale branch routes back to running instead of merge_ready — never silently resolved", () => {
    const result = transition("approved", { kind: "merge_preconditions_checked", ciGreen: true, branchStale: true }, SYSTEM);
    expect(result).toEqual({ ok: true, next: "running" });
  });

  it("red CI routes back to running instead of merge_ready", () => {
    const result = transition("approved", { kind: "merge_preconditions_checked", ciGreen: false, branchStale: false }, SYSTEM);
    expect(result).toEqual({ ok: true, next: "running" });
  });

  it("green CI and a fresh branch reach merge_ready", () => {
    const result = transition("approved", { kind: "merge_preconditions_checked", ciGreen: true, branchStale: false }, SYSTEM);
    expect(result).toEqual({ ok: true, next: "merge_ready" });
  });

  it("a worker cannot report merge preconditions", () => {
    const result = transition("approved", { kind: "merge_preconditions_checked", ciGreen: true, branchStale: false }, WORKER);
    expect(result.ok).toBe(false);
  });
});

describe("state-machine: cancellation", () => {
  it("a founder can cancel a queued task", () => {
    expect(transition("queued", { kind: "cancel" }, FOUNDER)).toEqual({ ok: true, next: "cancelled" });
  });

  it("a founder can cancel a task awaiting review", () => {
    expect(transition("review_ready", { kind: "cancel" }, FOUNDER)).toEqual({ ok: true, next: "cancelled" });
  });

  it("a worker cannot cancel a task", () => {
    expect(transition("running", { kind: "cancel" }, WORKER).ok).toBe(false);
  });

  it("merged work cannot be cancelled", () => {
    expect(transition("merged", { kind: "cancel" }, FOUNDER).ok).toBe(false);
  });

  it("a task already in deploy_ready cannot be cancelled", () => {
    expect(transition("deploy_ready", { kind: "cancel" }, FOUNDER).ok).toBe(false);
  });
});

describe("state-machine: deployment result", () => {
  it("a successful deployment reaches deployed", () => {
    const result = transition("deploy_ready", { kind: "deployment_result", ok: true }, SYSTEM);
    expect(result).toEqual({ ok: true, next: "deployed" });
  });

  it("a failed deployment reaches failed, not deploy_ready again", () => {
    const result = transition("deploy_ready", { kind: "deployment_result", ok: false }, SYSTEM);
    expect(result).toEqual({ ok: true, next: "failed" });
  });

  it("a founder cannot directly assert a deployment result", () => {
    const result = transition("deploy_ready", { kind: "deployment_result", ok: true }, FOUNDER);
    expect(result.ok).toBe(false);
  });
});

describe("state-machine: full happy path", () => {
  it("walks queued through merged without an invalid step", () => {
    let status = transition("queued", { kind: "dispatch" }, FOUNDER);
    expect(status.ok).toBe(true);
    if (!status.ok) return;

    status = transition(status.next, { kind: "workspace_started" }, SYSTEM);
    expect(status).toEqual({ ok: true, next: "running" });
    if (!status.ok) return;

    status = transition(status.next, { kind: "enter_testing" }, SYSTEM);
    expect(status).toEqual({ ok: true, next: "testing" });
    if (!status.ok) return;

    status = transition(status.next, { kind: "quality_gate_result", gate: ALL_PASSED, repairAttempted: false }, SYSTEM);
    expect(status).toEqual({ ok: true, next: "review_ready" });
    if (!status.ok) return;

    status = transition(status.next, { kind: "review_submitted", decision: "approved" }, FOUNDER);
    expect(status).toEqual({ ok: true, next: "approved" });
    if (!status.ok) return;

    status = transition(status.next, { kind: "merge_preconditions_checked", ciGreen: true, branchStale: false }, SYSTEM);
    expect(status).toEqual({ ok: true, next: "merge_ready" });
    if (!status.ok) return;

    status = transition(status.next, { kind: "merge_confirmed" }, FOUNDER);
    expect(status).toEqual({ ok: true, next: "merged" });
  });
});

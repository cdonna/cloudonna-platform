import { describe, expect, it, vi } from "vitest";
import { handleCreateTaskRequest } from "../handle-create-task-request";
import { handleDispatchTaskRequest } from "../handle-dispatch-task-request";
import { handleReviewTaskRequest } from "../handle-review-task-request";
import { handleMergeTaskRequest } from "../handle-merge-task-request";
import { handleDeployTaskRequest, DEPLOYMENT_ENABLED } from "../handle-deploy-task-request";
import { handleCancelTaskRequest } from "../handle-cancel-task-request";
import { mockFounderSupabase, taskRow } from "./test-helpers";
import { fakeExecutionAdapter } from "./fake-execution-adapter";

const VALID_TASK_BODY = {
  title: "Polish the Architects page",
  description: "Bring spacing and type in line with the editorial system used elsewhere.",
  priority: "medium",
  targetArea: "architects",
  acceptanceCriteria: "Visually consistent with /data-economy and /trust.",
};

describe("handleCreateTaskRequest: authorization", () => {
  it("rejects an unauthenticated request before touching the database", async () => {
    const supabase = mockFounderSupabase();
    const result = await handleCreateTaskRequest(VALID_TASK_BODY, supabase, null);
    expect(result.status).toBe(401);
  });

  it("rejects a request missing required fields", async () => {
    const supabase = mockFounderSupabase();
    const result = await handleCreateTaskRequest({ title: "x" }, supabase, "founder-1");
    expect(result.status).toBe(400);
  });

  it("creates a task for an authenticated caller and records a task_created event", async () => {
    const supabase = mockFounderSupabase({ insertData: taskRow() });
    const result = await handleCreateTaskRequest(VALID_TASK_BODY, supabase, "founder-1");
    expect(result.status).toBe(201);
  });

  it("surfaces an RLS denial (e.g. a non-staff authenticated user) as a 403, not a 500", async () => {
    const supabase = mockFounderSupabase({ insertError: { message: "new row violates row-level security policy for table \"founder_tasks\"" } });
    const result = await handleCreateTaskRequest(VALID_TASK_BODY, supabase, "non-staff-user");
    expect(result.status).toBe(403);
  });
});

describe("handleDispatchTaskRequest: cannot dispatch from the wrong status", () => {
  it("refuses to dispatch a task that is already running", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "running" }) });
    const result = await handleDispatchTaskRequest("task-1", supabase, "founder-1", fakeExecutionAdapter());
    expect(result.status).toBe(409);
  });

  it("rejects an unauthenticated request", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow() });
    const result = await handleDispatchTaskRequest("task-1", supabase, null, fakeExecutionAdapter());
    expect(result.status).toBe(401);
  });
});

describe("handleDispatchTaskRequest: the honest 'not configured' path", () => {
  it("reports 503 with notConfigured=true and leaves the task queued when no execution adapter is available", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "queued" }) });
    const adapter = fakeExecutionAdapter();

    const result = await handleDispatchTaskRequest("task-1", supabase, "founder-1", adapter);

    expect(result.status).toBe(503);
    expect(result.body).toMatchObject({ notConfigured: true });
    // Never claims a branch was created or that the task advanced — the
    // update() chain must not have been reached.
    expect(adapter.dispatchTask).toHaveBeenCalledTimes(1);
  });
});

describe("handleDispatchTaskRequest: a configured adapter advances the task", () => {
  it("moves a queued task to planning once dispatch succeeds", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "queued" }), updateData: taskRow({ status: "planning", branch_name: "agent/abc12345-polish" }) });
    const adapter = fakeExecutionAdapter({
      dispatchTask: vi.fn().mockResolvedValue({ ok: true, data: { branchName: "agent/abc12345-polish" } }),
    });

    const result = await handleDispatchTaskRequest("task-1", supabase, "founder-1", adapter);

    expect(result.status).toBe(200);
    expect("task" in result.body && result.body.task.status).toBe("planning");
  });
});

describe("handleReviewTaskRequest: the agent cannot approve itself", () => {
  it("requires an authenticated founder — there is no actor other than founder this handler can construct", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "review_ready" }) });
    const result = await handleReviewTaskRequest("task-1", { decision: "approved" }, supabase, null);
    expect(result.status).toBe(401);
  });

  it("refuses to approve a task that is not awaiting review", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "running" }) });
    const result = await handleReviewTaskRequest("task-1", { decision: "approved" }, supabase, "founder-1");
    expect(result.status).toBe(409);
  });

  it("approves a review_ready task for an authenticated founder", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "review_ready" }), updateData: taskRow({ status: "approved" }) });
    const result = await handleReviewTaskRequest("task-1", { decision: "approved" }, supabase, "founder-1");
    expect(result.status).toBe(200);
  });

  it("rejects a malformed decision value", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "review_ready" }) });
    const result = await handleReviewTaskRequest("task-1", { decision: "maybe" }, supabase, "founder-1");
    expect(result.status).toBe(400);
  });
});

describe("handleMergeTaskRequest: the agent cannot merge without founder approval", () => {
  it("requires authentication", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "merge_ready", branch_name: "agent/abc-x", pr_number: 42 }) });
    const result = await handleMergeTaskRequest("task-1", {}, supabase, null, fakeExecutionAdapter());
    expect(result.status).toBe(401);
  });

  it("refuses to merge a task that has not been approved", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "running" }) });
    const result = await handleMergeTaskRequest("task-1", {}, supabase, "founder-1", fakeExecutionAdapter());
    expect(result.status).toBe(409);
  });

  it("does not mark the task merged when the execution adapter is not configured — nothing was actually merged", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "merge_ready", branch_name: "agent/abc-x", pr_number: 42 }) });
    const adapter = fakeExecutionAdapter();

    const result = await handleMergeTaskRequest("task-1", {}, supabase, "founder-1", adapter);

    // The merge was attempted (gate 2 is a real GitHub call) but the
    // adapter honestly reports it could not run — the response is 503,
    // never a 200 that would imply the branch is now in main.
    expect(result.status).toBe(503);
    expect(adapter.mergeTask).toHaveBeenCalledTimes(1);
  });

  it("re-checks preconditions from 'approved' and refuses to merge a stale branch", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "approved", branch_name: "agent/abc-x", pr_number: 42 }), updateData: taskRow({ status: "running" }) });
    const adapter = fakeExecutionAdapter({
      checkMergePreconditions: vi.fn().mockResolvedValue({ ok: true, data: { ciGreen: true, branchStale: true, prNumber: 42 } }),
    });

    const result = await handleMergeTaskRequest("task-1", {}, supabase, "founder-1", adapter);

    expect(result.status).toBe(409);
    expect(adapter.mergeTask).not.toHaveBeenCalled();
  });

  it("merges a merge_ready task once the adapter confirms the merge", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "merge_ready", branch_name: "agent/abc-x", pr_number: 42 }), updateData: taskRow({ status: "merged" }) });
    const adapter = fakeExecutionAdapter({
      mergeTask: vi.fn().mockResolvedValue({ ok: true, data: { sha: "abcdef1234567890" } }),
    });

    const result = await handleMergeTaskRequest("task-1", {}, supabase, "founder-1", adapter);

    expect(result.status).toBe(200);
    expect(adapter.mergeTask).toHaveBeenCalledTimes(1);
  });
});

describe("handleDeployTaskRequest: designed but disabled", () => {
  it("is disabled in this environment", () => {
    expect(DEPLOYMENT_ENABLED).toBe(false);
  });

  it("requires authentication even though deployment itself is disabled", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "merged" }) });
    const result = await handleDeployTaskRequest("task-1", {}, supabase, null);
    expect(result.status).toBe(401);
  });

  it("returns 409 (not 501) when the task has not been merged — the precondition check still runs", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "running" }) });
    const result = await handleDeployTaskRequest("task-1", {}, supabase, "founder-1");
    expect(result.status).toBe(409);
  });

  it("returns 501 with disabled=true for a merged task, and never updates the database", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "merged" }) });
    const result = await handleDeployTaskRequest("task-1", {}, supabase, "founder-1");

    expect(result.status).toBe(501);
    expect(result.body).toMatchObject({ disabled: true });
  });
});

describe("handleCancelTaskRequest", () => {
  it("requires authentication", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "queued" }) });
    const result = await handleCancelTaskRequest("task-1", {}, supabase, null);
    expect(result.status).toBe(401);
  });

  it("cancels a queued task for a founder", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "queued" }), updateData: taskRow({ status: "cancelled" }) });
    const result = await handleCancelTaskRequest("task-1", { reason: "No longer needed" }, supabase, "founder-1");
    expect(result.status).toBe(200);
  });

  it("refuses to cancel already-merged work", async () => {
    const supabase = mockFounderSupabase({ taskRow: taskRow({ status: "merged" }) });
    const result = await handleCancelTaskRequest("task-1", {}, supabase, "founder-1");
    expect(result.status).toBe(409);
  });
});

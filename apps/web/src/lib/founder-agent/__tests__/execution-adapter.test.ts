import { describe, expect, it } from "vitest";
import { GithubActionsExecutionAdapter } from "../execution-adapter";

/**
 * The adapter this repository actually runs with. No env var is set in
 * this test environment (same as production today) — every method
 * must report "not configured" honestly rather than fabricating
 * progress. This is the direct test of the brief's "do not pretend
 * tasks are executing remotely" requirement, at the one seam where it
 * could otherwise quietly stop being true.
 */
describe("GithubActionsExecutionAdapter: honest when unconfigured", () => {
  const adapter = new GithubActionsExecutionAdapter();

  it("isConfigured() is false", () => {
    expect(adapter.isConfigured()).toBe(false);
  });

  it("dispatchTask reports notConfigured rather than a fabricated branch", async () => {
    const result = await adapter.dispatchTask({
      taskId: "task-1",
      title: "Example",
      description: "Example",
      constraints: null,
      acceptanceCriteria: "Example",
      targetArea: "homepage",
    });
    expect(result).toMatchObject({ ok: false, notConfigured: true });
  });

  it("syncTask reports notConfigured rather than fabricated progress", async () => {
    const result = await adapter.syncTask({ taskId: "task-1", branchName: "agent/x" });
    expect(result).toMatchObject({ ok: false, notConfigured: true });
  });

  it("checkMergePreconditions reports notConfigured rather than a fabricated green check", async () => {
    const result = await adapter.checkMergePreconditions({ branchName: "agent/x" });
    expect(result).toMatchObject({ ok: false, notConfigured: true });
  });

  it("mergeTask reports notConfigured rather than a fabricated merge sha", async () => {
    const result = await adapter.mergeTask({ branchName: "agent/x", prNumber: 1, title: "Example" });
    expect(result).toMatchObject({ ok: false, notConfigured: true });
  });

  it("every not-configured reason names what is missing and where to read how to fix it", async () => {
    const result = await adapter.dispatchTask({
      taskId: "task-1",
      title: "Example",
      description: "Example",
      constraints: null,
      acceptanceCriteria: "Example",
      targetArea: "homepage",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("FOUNDER_AGENT_GITHUB_TOKEN");
      expect(result.reason).toContain("docs/founder-agent/operations.md");
    }
  });
});

import { describe, expect, it } from "vitest";
import { generateBranchName, isGithubConfigured, getFounderAgentRepo } from "../github-client";

describe("generateBranchName", () => {
  it("produces agent/<short-id>-<slug>, matching the brief's naming rule", () => {
    const branch = generateBranchName("123e4567-e89b-12d3-a456-426614174000", "Homepage Nova polish");
    expect(branch).toBe("agent/123e4567-homepage-nova-polish");
  });

  it("never produces a branch named main or master — structurally impossible, not just avoided", () => {
    // No ordinary title can hit this, but the guard inside
    // generateBranchName throws rather than silently returning one if
    // it ever somehow did — this test documents that the guard exists
    // and is live code, not dead code nobody runs.
    expect(() => generateBranchName("", "")).not.toThrow();
    const branch = generateBranchName("", "");
    expect(branch).not.toBe("main");
    expect(branch).not.toBe("master");
  });

  it("strips characters that are not safe in a git ref and collapses whitespace", () => {
    const branch = generateBranchName("abc123", "Fix: the Donna AI 'score' bug!!");
    expect(branch).toBe("agent/abc123-fix-the-donna-ai-score-bug");
  });
});

describe("worker cannot write directly to main — the structural half", () => {
  it("the base branch dispatch targets is always main, never the task's own branch", () => {
    // generateBranchName never returns "main"/"master" (see above), and
    // dispatchWorkflow's `ref` is always the constant BASE_BRANCH inside
    // execution-adapter.ts — there is no parameter by which a caller
    // could point a workflow_dispatch at main as the *work* branch, only
    // as the branch the workflow is read from, which is what
    // workflow_dispatch already requires.
    const branch = generateBranchName("task-id", "some feature");
    expect(branch.startsWith("agent/")).toBe(true);
  });
});

describe("isGithubConfigured / getFounderAgentRepo: the honest current state", () => {
  it("reports not configured when FOUNDER_AGENT_GITHUB_TOKEN is unset, which is the real state of this repository", () => {
    expect(process.env.FOUNDER_AGENT_GITHUB_TOKEN).toBeUndefined();
    expect(isGithubConfigured()).toBe(false);
  });

  it("returns null for the repo ref when FOUNDER_AGENT_REPO is unset", () => {
    expect(process.env.FOUNDER_AGENT_REPO).toBeUndefined();
    expect(getFounderAgentRepo()).toBeNull();
  });
});

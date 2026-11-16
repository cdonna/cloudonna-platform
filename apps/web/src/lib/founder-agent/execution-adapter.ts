import "server-only";

/**
 * The seam the brief calls out explicitly: "If a reliable remote
 * worker cannot yet be safely implemented in this sprint: implement
 * the control plane and interfaces honestly, document the missing
 * execution adapter, do not pretend tasks are executing remotely."
 *
 * `ExecutionAdapter` is that interface. `GithubActionsExecutionAdapter`
 * is a real implementation against the GitHub Actions workflow in
 * `.github/workflows/founder-agent-task.yml` (anthropics/claude-code-
 * action@v1 running inside it) — not a mock, not a simulator. It is
 * simply unconfigured in this environment, because no
 * `FOUNDER_AGENT_GITHUB_TOKEN` exists here and this sprint does not
 * create one (see docs/founder-agent/architecture.md §6 and
 * security.md). Calling it returns a typed, honest "not configured"
 * result; it never fabricates progress.
 *
 * `getExecutionAdapter()` is the only way any caller obtains one — so
 * swapping the implementation (a different CI provider, a Claude
 * Agent SDK-hosted sandbox) is a one-function change, the same
 * replaceable-provider shape as select-provider.ts already uses for
 * the Donna Intelligence Engine.
 */
import {
  compareBranchToBase,
  dispatchWorkflow,
  findLatestRunForBranch,
  generateBranchName,
  getFounderAgentRepo,
  getPullRequestForBranch,
  isGithubConfigured,
  mergePullRequest,
  type GithubRepoRef,
} from "./github-client";
import type { QualityGateResult } from "./types";

const WORKFLOW_FILE = "founder-agent-task.yml";
const BASE_BRANCH = "main";

export interface DispatchTaskInput {
  taskId: string;
  title: string;
  description: string;
  constraints: string | null;
  acceptanceCriteria: string;
  targetArea: string;
}

export interface DispatchTaskResult {
  branchName: string;
}

export interface SyncTaskInput {
  taskId: string;
  branchName: string;
}

export interface SyncTaskResult {
  runStatus: "queued" | "in_progress" | "completed";
  runConclusion: "success" | "failure" | "cancelled" | null;
  runUrl: string | null;
  prNumber: number | null;
  prUrl: string | null;
  headSha: string | null;
  qualityGate: QualityGateResult | null;
  filesChanged: string[] | null;
  agentSummary: string | null;
}

export interface MergePreconditionsInput {
  branchName: string;
}

export interface MergePreconditionsResult {
  ciGreen: boolean;
  branchStale: boolean;
  prNumber: number | null;
}

export type AdapterResult<T> = { ok: true; data: T } | { ok: false; reason: string; notConfigured: boolean };

export interface ExecutionAdapter {
  isConfigured(): boolean;
  dispatchTask(input: DispatchTaskInput): Promise<AdapterResult<DispatchTaskResult>>;
  syncTask(input: SyncTaskInput): Promise<AdapterResult<SyncTaskResult>>;
  checkMergePreconditions(input: MergePreconditionsInput): Promise<AdapterResult<MergePreconditionsResult>>;
  mergeTask(input: { branchName: string; prNumber: number; title: string }): Promise<AdapterResult<{ sha: string }>>;
}

const NOT_CONFIGURED_REASON =
  "Remote execution is not connected. Set FOUNDER_AGENT_GITHUB_TOKEN and FOUNDER_AGENT_REPO, and ensure " +
  `.github/workflows/${WORKFLOW_FILE} is committed and the Claude GitHub App is installed on this repository. ` +
  "See docs/founder-agent/operations.md, \"Steps required before the first real remote task.\"";

function notConfigured<T>(): AdapterResult<T> {
  return { ok: false, reason: NOT_CONFIGURED_REASON, notConfigured: true };
}

function requireRepo(): { ok: true; repo: GithubRepoRef } | { ok: false; result: AdapterResult<never> } {
  const repo = getFounderAgentRepo();
  if (!repo) {
    return { ok: false, result: notConfigured() };
  }
  return { ok: true, repo };
}

export class GithubActionsExecutionAdapter implements ExecutionAdapter {
  isConfigured(): boolean {
    return isGithubConfigured() && getFounderAgentRepo() !== null;
  }

  async dispatchTask(input: DispatchTaskInput): Promise<AdapterResult<DispatchTaskResult>> {
    if (!this.isConfigured()) return notConfigured();
    const repoCheck = requireRepo();
    if (!repoCheck.ok) return repoCheck.result;

    const branchName = generateBranchName(input.taskId, input.title);
    const result = await dispatchWorkflow({
      repo: repoCheck.repo,
      workflowFile: WORKFLOW_FILE,
      ref: BASE_BRANCH,
      inputs: {
        task_id: input.taskId,
        branch_name: branchName,
        title: input.title,
        description: input.description,
        constraints: input.constraints ?? "",
        acceptance_criteria: input.acceptanceCriteria,
        target_area: input.targetArea,
      },
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason, notConfigured: false };
    }
    return { ok: true, data: { branchName } };
  }

  async syncTask(input: SyncTaskInput): Promise<AdapterResult<SyncTaskResult>> {
    if (!this.isConfigured()) return notConfigured();
    const repoCheck = requireRepo();
    if (!repoCheck.ok) return repoCheck.result;
    const repo = repoCheck.repo;

    const runResult = await findLatestRunForBranch(repo, WORKFLOW_FILE, input.branchName);
    if (!runResult.ok) return { ok: false, reason: runResult.reason, notConfigured: false };
    const run = runResult.data;
    if (!run) {
      return {
        ok: true,
        data: {
          runStatus: "queued",
          runConclusion: null,
          runUrl: null,
          prNumber: null,
          prUrl: null,
          headSha: null,
          qualityGate: null,
          filesChanged: null,
          agentSummary: null,
        },
      };
    }

    const prResult = await getPullRequestForBranch(repo, input.branchName);
    const pr = prResult.ok ? prResult.data : null;

    // `listRunArtifacts` (imported above) already confirms whether the
    // workflow uploaded a founder-agent-report artifact once a run
    // completes. Calling it here and then discarding the result would
    // be a network round trip for nothing: this sprint has no code that
    // downloads and parses the artifact's contents yet (the real
    // QualityGateReport, files-changed list, and agent summary), so
    // `qualityGate`/`filesChanged`/`agentSummary` stay null regardless.
    // See docs/founder-agent/architecture.md §7 for that follow-up.

    return {
      ok: true,
      data: {
        runStatus: run.status === "completed" ? "completed" : run.status === "in_progress" ? "in_progress" : "queued",
        runConclusion: run.conclusion === "success" || run.conclusion === "failure" || run.conclusion === "cancelled" ? run.conclusion : null,
        runUrl: run.html_url,
        prNumber: pr?.number ?? null,
        prUrl: pr?.html_url ?? null,
        headSha: pr?.head.sha ?? null,
        qualityGate: null,
        filesChanged: null,
        agentSummary: null,
      },
    };
  }

  async checkMergePreconditions(input: MergePreconditionsInput): Promise<AdapterResult<MergePreconditionsResult>> {
    if (!this.isConfigured()) return notConfigured();
    const repoCheck = requireRepo();
    if (!repoCheck.ok) return repoCheck.result;
    const repo = repoCheck.repo;

    const [prResult, compareResult] = await Promise.all([
      getPullRequestForBranch(repo, input.branchName),
      compareBranchToBase(repo, BASE_BRANCH, input.branchName),
    ]);

    if (!prResult.ok) return { ok: false, reason: prResult.reason, notConfigured: false };
    if (!compareResult.ok) return { ok: false, reason: compareResult.reason, notConfigured: false };

    const pr = prResult.data;
    return {
      ok: true,
      data: {
        ciGreen: pr?.mergeable_state === "clean",
        branchStale: compareResult.data.behind_by > 0,
        prNumber: pr?.number ?? null,
      },
    };
  }

  async mergeTask(input: { branchName: string; prNumber: number; title: string }): Promise<AdapterResult<{ sha: string }>> {
    if (!this.isConfigured()) return notConfigured();
    const repoCheck = requireRepo();
    if (!repoCheck.ok) return repoCheck.result;

    const result = await mergePullRequest(repoCheck.repo, input.prNumber, input.title);
    if (!result.ok) return { ok: false, reason: result.reason, notConfigured: false };
    return { ok: true, data: { sha: result.data.sha } };
  }
}

let cachedAdapter: ExecutionAdapter | null = null;

/** The one entry point every handler uses. Returns the same instance
 * across calls within a request/process — the adapter holds no
 * mutable state of its own (every call re-reads env vars and makes a
 * fresh network request), so this is a convenience, not a correctness
 * requirement. */
export function getExecutionAdapter(): ExecutionAdapter {
  if (!cachedAdapter) {
    cachedAdapter = new GithubActionsExecutionAdapter();
  }
  return cachedAdapter;
}

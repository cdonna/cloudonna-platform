import "server-only";

/**
 * A thin, typed wrapper over the GitHub REST API — the only module in
 * this domain that knows GitHub's endpoints and response shapes exist.
 * Everything above this file works with `{ ok: true, data }` /
 * `{ ok: false, reason }`, the same RepositoryResult convention
 * inquiries/repository.ts already established, so a GitHub outage or a
 * malformed response never becomes an unhandled exception three layers
 * up in a Route Handler.
 *
 * Reads its token from `FOUNDER_AGENT_GITHUB_TOKEN` (server-only, never
 * NEXT_PUBLIC_*, never imported by a client component) — see
 * docs/founder-agent/security.md for why this is a fine-grained PAT
 * scoped to one repository with Actions:write + Contents:read +
 * Pull-requests:write, not a classic PAT and not the GitHub App used by
 * claude-code-action itself (two separate credentials, two separate
 * blast radii). No value is set for it anywhere in this repository —
 * see isGithubConfigured().
 */

export interface GithubRepoRef {
  owner: string;
  repo: string;
}

export type GithubResult<T> = { ok: true; data: T } | { ok: false; reason: string; status?: number };

function getToken(): string | null {
  const token = process.env.FOUNDER_AGENT_GITHUB_TOKEN;
  return token && token.trim().length > 0 ? token : null;
}

/** The one check every caller in this domain makes before attempting a
 * GitHub operation — mirrors isSupabaseConfigured()'s role for the
 * Supabase client. Always false in this repository today. */
export function isGithubConfigured(): boolean {
  return getToken() !== null;
}

export function getFounderAgentRepo(): GithubRepoRef | null {
  const slug = process.env.FOUNDER_AGENT_REPO; // e.g. "cdonna/cloudonna-platform"
  if (!slug || !slug.includes("/")) return null;
  const [owner, repo] = slug.split("/");
  return owner && repo ? { owner, repo } : null;
}

const GITHUB_API_BASE = "https://api.github.com";

async function githubRequest<T>(path: string, init: RequestInit = {}): Promise<GithubResult<T>> {
  const token = getToken();
  if (!token) {
    return { ok: false, reason: "FOUNDER_AGENT_GITHUB_TOKEN is not configured." };
  }

  let response: Response;
  try {
    response = await fetch(`${GITHUB_API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    return { ok: false, reason: `GitHub request failed: ${error instanceof Error ? error.message : "unknown network error"}` };
  }

  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      return { ok: false, reason: "GitHub returned a non-JSON response.", status: response.status };
    }
  }

  if (!response.ok) {
    const message = typeof body === "object" && body && "message" in body ? String((body as { message: unknown }).message) : response.statusText;
    return { ok: false, reason: `GitHub API error (${response.status}): ${message}`, status: response.status };
  }

  return { ok: true, data: body as T };
}

/** `agent/<task-id-prefix>-<slug>`, per the brief's branch naming rule.
 * Deterministic and pure so a test can assert the shape without any
 * network access, and so nothing downstream can accidentally produce
 * "main" or "master" as a branch name. */
export function generateBranchName(taskId: string, title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-+|-+$/g, "");
  const shortId = taskId.replace(/-/g, "").slice(0, 8);
  const branch = `agent/${shortId}-${slug || "task"}`;
  if (branch === "main" || branch === "master") {
    throw new Error("Generated branch name collided with a protected branch name — this should be structurally impossible.");
  }
  return branch;
}

export interface WorkflowDispatchInput {
  repo: GithubRepoRef;
  /** Filename under .github/workflows/, e.g. "founder-agent-task.yml". */
  workflowFile: string;
  /** Branch/ref the workflow runs against — always a default-branch ref
   * for workflow_dispatch; the workflow itself creates the task branch. */
  ref: string;
  inputs: Record<string, string>;
}

/** Triggers the GitHub Actions workflow that runs the Claude Code
 * GitHub Action against this task. Returns `ok: true` with no run id —
 * the workflow_dispatch API does not return one synchronously; the
 * caller must list runs for the workflow shortly after to find it (see
 * findLatestRunForBranch). This is a real, documented GitHub API
 * limitation, not a gap in this wrapper. */
export async function dispatchWorkflow(input: WorkflowDispatchInput): Promise<GithubResult<void>> {
  return githubRequest<void>(
    `/repos/${input.repo.owner}/${input.repo.repo}/actions/workflows/${input.workflowFile}/dispatches`,
    {
      method: "POST",
      body: JSON.stringify({ ref: input.ref, inputs: input.inputs }),
    },
  );
}

export interface WorkflowRun {
  id: number;
  status: "queued" | "in_progress" | "completed" | string;
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  html_url: string;
  head_branch: string;
  created_at: string;
}

export async function findLatestRunForBranch(
  repo: GithubRepoRef,
  workflowFile: string,
  branch: string,
): Promise<GithubResult<WorkflowRun | null>> {
  const result = await githubRequest<{ workflow_runs: WorkflowRun[] }>(
    `/repos/${repo.owner}/${repo.repo}/actions/workflows/${workflowFile}/runs?branch=${encodeURIComponent(branch)}&per_page=1`,
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.workflow_runs[0] ?? null };
}

export interface WorkflowArtifact {
  id: number;
  name: string;
  archive_download_url: string;
}

export async function listRunArtifacts(repo: GithubRepoRef, runId: number): Promise<GithubResult<WorkflowArtifact[]>> {
  // Scoped to this one run, not /repos/.../actions/artifacts (which
  // would list every artifact the whole repository has ever produced,
  // across every workflow) — a task's sync must never see another
  // task's report.
  const result = await githubRequest<{ artifacts: WorkflowArtifact[] }>(
    `/repos/${repo.owner}/${repo.repo}/actions/runs/${runId}/artifacts?per_page=10`,
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.artifacts.filter((a) => a.name === "founder-agent-report") };
}

export interface PullRequestInfo {
  number: number;
  html_url: string;
  mergeable: boolean | null;
  mergeable_state: string;
  head: { sha: string; ref: string };
  base: { sha: string; ref: string };
}

export async function getPullRequestForBranch(repo: GithubRepoRef, branch: string): Promise<GithubResult<PullRequestInfo | null>> {
  const result = await githubRequest<PullRequestInfo[]>(
    `/repos/${repo.owner}/${repo.repo}/pulls?head=${encodeURIComponent(`${repo.owner}:${branch}`)}&state=open`,
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data[0] ?? null };
}

export interface BranchComparison {
  status: "ahead" | "behind" | "diverged" | "identical";
  ahead_by: number;
  behind_by: number;
}

/** Is the task's branch stale against the current base? `behind_by > 0`
 * means main moved since the branch was cut — exactly the "if main
 * changed materially" condition the brief's Merge Model names. */
export async function compareBranchToBase(repo: GithubRepoRef, base: string, branch: string): Promise<GithubResult<BranchComparison>> {
  return githubRequest<BranchComparison>(`/repos/${repo.owner}/${repo.repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(branch)}`);
}

export interface MergeResult {
  sha: string;
  merged: boolean;
}

/** The only function in this entire codebase allowed to call GitHub's
 * merge endpoint — and it is called from exactly one place,
 * handle-merge-task-request.ts, itself gated on
 * transition(..., "merge_confirmed", actor) requiring actor.kind ===
 * "founder". Squash merge, per the brief's stated preference, unless a
 * repository convention says otherwise — none does today. */
export async function mergePullRequest(repo: GithubRepoRef, pullNumber: number, commitTitle: string): Promise<GithubResult<MergeResult>> {
  return githubRequest<MergeResult>(`/repos/${repo.owner}/${repo.repo}/pulls/${pullNumber}/merge`, {
    method: "PUT",
    body: JSON.stringify({ commit_title: commitTitle, merge_method: "squash" }),
  });
}

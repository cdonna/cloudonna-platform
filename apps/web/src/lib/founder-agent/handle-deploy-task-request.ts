import "server-only";

/**
 * Behind POST /api/founder/tasks/[id]/deploy — the separate "Deploy
 * current main to production?" confirmation. Per the brief: "Keep
 * production deployment approval designed but it may be disabled
 * initially if safe deployment integration requires a separate phase."
 *
 * This sprint takes that option. The schema, the state-machine
 * transition (`merged` + `deploy_confirmed` by a founder actor →
 * `deploy_ready`), the approval record shape, and this handler all
 * exist and are exercised in tests — but the handler always returns
 * 501 before touching the database, so no task in this environment can
 * actually reach "deploy_ready" or "deployed" yet. That is the honest
 * state of production deployment integration today: designed, not
 * enabled. See docs/founder-agent/operations.md.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { deployTaskRequestSchema } from "./schema";
import { getTask } from "./repository";
import { transition } from "./state-machine";

export interface DeployTaskHandlerResult {
  status: number;
  body: { error: string; disabled?: boolean };
}

/** Exported so a future, deliberate "enable deployment" change has one
 * flag to flip rather than a scattered set of early returns to find and
 * remove. Never read from an environment variable: enabling production
 * deployment is a code change this sprint does not make, not a
 * configuration toggle a deployed instance could flip by accident. */
export const DEPLOYMENT_ENABLED = false;

export async function handleDeployTaskRequest(
  taskId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<DeployTaskHandlerResult> {
  if (!userId) {
    return { status: 401, body: { error: "Sign in as ClouDonna platform staff to deploy a task." } };
  }

  const parsed = deployTaskRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { error: "The request could not be processed." } };
  }

  const taskResult = await getTask(supabase, taskId);
  if (!taskResult.ok) return { status: 403, body: { error: taskResult.reason } };
  const task = taskResult.data;
  if (!task) return { status: 404, body: { error: "Task not found." } };

  // The precondition check still runs, so a premature deploy attempt
  // on a task that was never merged gets a meaningful 409 rather than
  // a blanket 501 that would be true but unhelpful.
  const precheck = transition(task.status, { kind: "deploy_confirmed" }, { kind: "founder", founderId: userId });
  if (!precheck.ok) {
    return { status: 409, body: { error: precheck.reason } };
  }

  if (!DEPLOYMENT_ENABLED) {
    return {
      status: 501,
      body: {
        error:
          "Production deployment approval is designed but intentionally disabled in this environment. See docs/founder-agent/operations.md, \"Steps required before the first real remote task,\" for what enabling it requires.",
        disabled: true,
      },
    };
  }

  // Unreachable while DEPLOYMENT_ENABLED is false — kept so the shape of
  // "what happens once this is enabled" is visible in the diff rather
  // than left to be designed later from scratch.
  return { status: 501, body: { error: "Deployment is not yet implemented." } };
}

import { z } from "zod";
import { FOUNDER_TASK_PRIORITIES, FOUNDER_TASK_TARGET_AREAS } from "./types";

/**
 * "New Task" request body — the plain-language form from the brief's
 * Founder UX section. `acceptanceCriteria` is required and freeform
 * text, not a structured list: a founder describing "what done looks
 * like" in a sentence or two is the actual UX target, not a checklist
 * builder. The handler is what turns this into the plan a worker reads
 * — nothing here infers intent from title/description.
 */
export const createTaskRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(8000),
    priority: z.enum(FOUNDER_TASK_PRIORITIES).default("medium"),
    targetArea: z.enum(FOUNDER_TASK_TARGET_AREAS),
    constraints: z.string().trim().max(4000).optional(),
    acceptanceCriteria: z.string().trim().min(1).max(4000),
  })
  .strict();

export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>;

/** The Review screen's three actions, one request shape. `notes` is
 * optional on approve (a founder may just tap Approve), effectively
 * required in spirit on changes_requested/rejected though not enforced
 * at the schema level — an empty-but-present string is still better
 * than blocking the action over it, and the UI nudges for it instead. */
export const reviewTaskRequestSchema = z
  .object({
    decision: z.enum(["approved", "changes_requested", "rejected"]),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export type ReviewTaskRequest = z.infer<typeof reviewTaskRequestSchema>;

/** The separate "Merge this branch into main?" confirmation. Deliberately
 * not combined with reviewTaskRequestSchema — approving a task and
 * merging it are two different actions with two different approval
 * records (founder_task_approvals.approval_type), per the brief's
 * "never combine merge and deploy into one automatic action," which
 * this extends to "never combine review and merge either." */
export const mergeTaskRequestSchema = z
  .object({
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export type MergeTaskRequest = z.infer<typeof mergeTaskRequestSchema>;

/** The separate "Deploy current main to production?" confirmation.
 * Accepted by the schema and the state machine; the route itself
 * returns 501 in this sprint — see handle-deploy-task-request.ts. */
export const deployTaskRequestSchema = z
  .object({
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export type DeployTaskRequest = z.infer<typeof deployTaskRequestSchema>;

export const cancelTaskRequestSchema = z
  .object({
    reason: z.string().trim().max(2000).optional(),
  })
  .strict();

export type CancelTaskRequest = z.infer<typeof cancelTaskRequestSchema>;

import { z } from "zod";

export const alignmentStatusSchema = z.enum(["not_reviewed", "aligned", "conditional", "objected", "approved"]);
export const actionStatusSchema = z.enum(["open", "done"]);

export const createStakeholderRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(300),
    role: z.string().trim().max(200).optional(),
    email: z.string().trim().email().max(320).optional(),
    alignmentStatus: alignmentStatusSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateStakeholderRequestSchema = z
  .object({
    role: z.string().trim().max(200).nullable().optional(),
    alignmentStatus: alignmentStatusSchema.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const createActionItemRequestSchema = z
  .object({
    action: z.string().trim().min(1).max(1000),
    owner: z.string().trim().max(300).optional(),
    targetDate: z.string().trim().max(10).optional(),
  })
  .strict();

export const updateActionItemRequestSchema = z
  .object({
    action: z.string().trim().min(1).max(1000).optional(),
    owner: z.string().trim().max(300).nullable().optional(),
    targetDate: z.string().trim().max(10).nullable().optional(),
    status: actionStatusSchema.optional(),
  })
  .strict();

export type CreateStakeholderRequest = z.infer<typeof createStakeholderRequestSchema>;
export type UpdateStakeholderRequest = z.infer<typeof updateStakeholderRequestSchema>;
export type CreateActionItemRequest = z.infer<typeof createActionItemRequestSchema>;
export type UpdateActionItemRequest = z.infer<typeof updateActionItemRequestSchema>;

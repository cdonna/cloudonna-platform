import { z } from "zod";
import { ASSUMPTION_VALIDATION_STATUSES } from "./assumption-validation-status";

export const assumptionValidationStatusSchema = z.enum(ASSUMPTION_VALIDATION_STATUSES);
export const currencySchema = z.enum(["CHF", "EUR", "USD", "GBP"]);

export const upsertDecisionOutcomeRequestSchema = z
  .object({
    recommendation: z.string().trim().max(4000).optional(),
    finalDecision: z.string().trim().max(2000).optional(),
    implementationStarted: z.boolean().optional(),
    realizedOutcomeKnown: z.boolean().optional(),
    businessCaseVariancePercent: z.number().min(-1000).max(1000).optional(),
    customerFeedback: z.string().trim().max(4000).optional(),
  })
  .strict();

export const upsertBusinessCaseActualsRequestSchema = z
  .object({
    currency: currencySchema.optional(),
    estimatedCost: z.number().min(0).max(1_000_000_000).optional(),
    actualCost: z.number().min(0).max(1_000_000_000).optional(),
    estimatedBenefit: z.number().min(0).max(1_000_000_000).optional(),
    actualBenefit: z.number().min(0).max(1_000_000_000).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const createAssumptionValidationRequestSchema = z
  .object({
    assumptionText: z.string().trim().min(1).max(2000),
    validationStatus: assumptionValidationStatusSchema.optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateAssumptionValidationRequestSchema = z
  .object({
    validationStatus: assumptionValidationStatusSchema,
    note: z.string().trim().max(2000).optional(),
  })
  .strict();

export type UpsertDecisionOutcomeRequest = z.infer<typeof upsertDecisionOutcomeRequestSchema>;
export type UpsertBusinessCaseActualsRequest = z.infer<typeof upsertBusinessCaseActualsRequestSchema>;
export type CreateAssumptionValidationRequest = z.infer<typeof createAssumptionValidationRequestSchema>;
export type UpdateAssumptionValidationRequest = z.infer<typeof updateAssumptionValidationRequestSchema>;

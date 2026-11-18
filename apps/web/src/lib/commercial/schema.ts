import { z } from "zod";
import { OPPORTUNITY_STAGES } from "./opportunity-stages";

export const commercialPackageSchema = z.enum(["decision_sprint", "team", "enterprise", "strategic_decision_program"]);
export const opportunityStageSchema = z.enum(OPPORTUNITY_STAGES);

export const createCommercialAccountRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(300),
    website: z.string().trim().max(300).optional(),
    industry: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export const createCommercialOpportunityRequestSchema = z
  .object({
    accountId: z.string().uuid(),
    primaryContactId: z.string().uuid().optional(),
    inquiryId: z.string().uuid().optional(),
    decisionId: z.string().uuid().optional(),
    commercialPackage: commercialPackageSchema,
    stage: opportunityStageSchema.optional(),
    useCase: z.string().trim().max(2000).optional(),
    decisionValueChf: z.number().min(0).max(1_000_000_000).optional(),
    expectedAcvChf: z.number().min(0).max(1_000_000_000).optional(),
    expectedTcvChf: z.number().min(0).max(1_000_000_000).optional(),
    probabilityPercent: z.number().min(0).max(100).optional(),
    source: z.string().trim().max(200).optional(),
    nextAction: z.string().trim().max(1000).optional(),
    nextActionDueAt: z.string().trim().max(10).optional(),
    targetCloseDate: z.string().trim().max(10).optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export const updateCommercialOpportunityRequestSchema = z
  .object({
    stage: opportunityStageSchema.optional(),
    useCase: z.string().trim().max(2000).optional(),
    decisionValueChf: z.number().min(0).max(1_000_000_000).nullable().optional(),
    expectedAcvChf: z.number().min(0).max(1_000_000_000).nullable().optional(),
    expectedTcvChf: z.number().min(0).max(1_000_000_000).nullable().optional(),
    probabilityPercent: z.number().min(0).max(100).nullable().optional(),
    nextAction: z.string().trim().max(1000).nullable().optional(),
    nextActionDueAt: z.string().trim().max(10).nullable().optional(),
    targetCloseDate: z.string().trim().max(10).nullable().optional(),
    decisionId: z.string().uuid().nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .strict();

export type CreateCommercialAccountRequest = z.infer<typeof createCommercialAccountRequestSchema>;
export type CreateCommercialOpportunityRequest = z.infer<typeof createCommercialOpportunityRequestSchema>;
export type UpdateCommercialOpportunityRequest = z.infer<typeof updateCommercialOpportunityRequestSchema>;

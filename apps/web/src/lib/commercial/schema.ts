import { z } from "zod";
import { OPPORTUNITY_STAGES } from "./opportunity-stages";
import { ACCOUNT_STATUSES } from "./account-status";
import { BUYER_PERSONAS } from "./buyer-persona";
import { FORECAST_CATEGORIES } from "./forecast";
import { LOST_REASONS, WON_REASONS } from "./lost-won-reasons";
import { DECISION_SPRINT_STATUSES } from "./decision-sprint-status";
import { CUSTOMER_REFERENCE_STATUSES } from "./customer-reference-status";
import { CONVERSION_TYPES } from "./conversion-type";
import { PAYMENT_STATUSES } from "./payment-status";

export const commercialPackageSchema = z.enum(["decision_sprint", "team", "enterprise", "strategic_decision_program"]);
export const opportunityStageSchema = z.enum(OPPORTUNITY_STAGES);
export const commercialCurrencySchema = z.enum(["CHF", "EUR", "USD", "GBP"]);
export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export const buyerPersonaSchema = z.enum(BUYER_PERSONAS);
export const forecastCategorySchema = z.enum(FORECAST_CATEGORIES);
export const lostReasonSchema = z.enum(LOST_REASONS);
export const wonReasonSchema = z.enum(WON_REASONS);
export const billingFrequencySchema = z.enum(["one_time", "monthly", "annual"]);
export const contractStatusSchema = z.enum(["draft", "proposed", "signed", "active", "expired", "cancelled"]);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const decisionSprintStatusSchema = z.enum(DECISION_SPRINT_STATUSES);
export const customerReferenceStatusSchema = z.enum(CUSTOMER_REFERENCE_STATUSES);
export const conversionTypeSchema = z.enum(CONVERSION_TYPES);

const dateStringSchema = z.string().trim().max(10);
const moneySchema = z.number().min(0).max(1_000_000_000);

// ---------------------------------------------------------------------------
// Accounts (brief §4)

export const createCommercialAccountRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(300),
    website: z.string().trim().max(300).optional(),
    industry: z.string().trim().max(200).optional(),
    country: z.string().trim().max(200).optional(),
    companySize: z.string().trim().max(100).optional(),
    source: z.string().trim().max(200).optional(),
    icpFit: z.boolean().optional(),
    owner: z.string().uuid().optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export const updateCommercialAccountRequestSchema = z
  .object({
    website: z.string().trim().max(300).nullable().optional(),
    industry: z.string().trim().max(200).nullable().optional(),
    country: z.string().trim().max(200).nullable().optional(),
    companySize: z.string().trim().max(100).nullable().optional(),
    source: z.string().trim().max(200).nullable().optional(),
    icpFit: z.boolean().nullable().optional(),
    status: accountStatusSchema.optional(),
    owner: z.string().uuid().nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Contacts (brief §5/§6)

export const createCommercialContactRequestSchema = z
  .object({
    accountId: z.string().uuid(),
    name: z.string().trim().min(1).max(300),
    email: z.string().trim().email().max(320).optional(),
    role: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(50).optional(),
    buyerPersona: buyerPersonaSchema.optional(),
    economicBuyer: z.boolean().optional(),
    decisionMaker: z.boolean().optional(),
    technicalEvaluator: z.boolean().optional(),
    champion: z.boolean().optional(),
    procurement: z.boolean().optional(),
  })
  .strict();

export const updateCommercialContactRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(300).optional(),
    email: z.string().trim().email().max(320).nullable().optional(),
    role: z.string().trim().max(200).nullable().optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    buyerPersona: buyerPersonaSchema.nullable().optional(),
    economicBuyer: z.boolean().optional(),
    decisionMaker: z.boolean().optional(),
    technicalEvaluator: z.boolean().optional(),
    champion: z.boolean().optional(),
    procurement: z.boolean().optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Opportunities V2 (brief §7)

export const createCommercialOpportunityRequestSchema = z
  .object({
    accountId: z.string().uuid(),
    primaryContactId: z.string().uuid().optional(),
    inquiryId: z.string().uuid().optional(),
    decisionId: z.string().uuid().optional(),
    commercialPackage: commercialPackageSchema,
    stage: opportunityStageSchema.optional(),
    useCase: z.string().trim().max(2000).optional(),
    decisionTitle: z.string().trim().max(300).optional(),
    decisionDeadline: dateStringSchema.optional(),
    decisionValueChf: moneySchema.optional(),
    expectedBookingsChf: moneySchema.optional(),
    expectedArrChf: moneySchema.optional(),
    expectedAcvChf: moneySchema.optional(),
    expectedTcvChf: moneySchema.optional(),
    probabilityPercent: z.number().min(0).max(100).optional(),
    forecastCategory: forecastCategorySchema.optional(),
    currency: commercialCurrencySchema.optional(),
    planningValueChf: moneySchema.optional(),
    source: z.string().trim().max(200).optional(),
    nextAction: z.string().trim().max(1000).optional(),
    nextActionDueAt: dateStringSchema.optional(),
    targetCloseDate: dateStringSchema.optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export const updateCommercialOpportunityRequestSchema = z
  .object({
    stage: opportunityStageSchema.optional(),
    primaryContactId: z.string().uuid().nullable().optional(),
    useCase: z.string().trim().max(2000).optional(),
    decisionTitle: z.string().trim().max(300).nullable().optional(),
    decisionDeadline: dateStringSchema.nullable().optional(),
    decisionValueChf: moneySchema.nullable().optional(),
    expectedBookingsChf: moneySchema.nullable().optional(),
    expectedArrChf: moneySchema.nullable().optional(),
    expectedAcvChf: moneySchema.nullable().optional(),
    expectedTcvChf: moneySchema.nullable().optional(),
    probabilityPercent: z.number().min(0).max(100).nullable().optional(),
    forecastCategory: forecastCategorySchema.nullable().optional(),
    currency: commercialCurrencySchema.optional(),
    planningValueChf: moneySchema.nullable().optional(),
    nextAction: z.string().trim().max(1000).nullable().optional(),
    nextActionDueAt: dateStringSchema.nullable().optional(),
    targetCloseDate: dateStringSchema.nullable().optional(),
    decisionId: z.string().uuid().nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
    // Closing a deal — stage must also be set to closed_won/closed_lost
    // in the same request; the repository rejects a reason without the
    // matching stage, never infers one from the other.
    lostReason: lostReasonSchema.optional(),
    lostReasonNote: z.string().trim().max(2000).optional(),
    wonReason: wonReasonSchema.optional(),
    wonReasonNote: z.string().trim().max(2000).optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Contracts (brief §8/§9)

export const upsertCommercialContractRequestSchema = z
  .object({
    contractStart: dateStringSchema.nullable().optional(),
    contractEnd: dateStringSchema.nullable().optional(),
    termMonths: z.number().int().positive().nullable().optional(),
    billingFrequency: billingFrequencySchema.optional(),
    oneTimeFee: z.number().min(0).max(1_000_000_000).optional(),
    servicesFee: z.number().min(0).max(1_000_000_000).optional(),
    recurringAnnualFee: z.number().min(0).max(1_000_000_000).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    currency: commercialCurrencySchema.optional(),
    autoRenewal: z.boolean().optional(),
    paymentTerms: z.string().trim().max(1000).optional(),
    contractStatus: contractStatusSchema.optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Invoices / cash collection (brief §12)

export const createCommercialInvoiceRequestSchema = z
  .object({
    contractId: z.string().uuid(),
    invoiceAmount: z.number().min(0).max(1_000_000_000),
    currency: commercialCurrencySchema.optional(),
    invoiceDate: dateStringSchema.optional(),
    dueDate: dateStringSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateCommercialInvoiceRequestSchema = z
  .object({
    paidAmount: z.number().min(0).max(1_000_000_000).optional(),
    paidDate: dateStringSchema.nullable().optional(),
    paymentStatus: paymentStatusSchema.optional(),
    dueDate: dateStringSchema.nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Decision Sprints (brief §13/§14)

export const createDecisionSprintRequestSchema = z
  .object({
    accountId: z.string().uuid(),
    opportunityId: z.string().uuid().optional(),
    decisionId: z.string().uuid().optional(),
    scope: z.string().trim().max(2000).optional(),
    startDate: dateStringSchema.optional(),
    targetCompletionDate: dateStringSchema.optional(),
    status: decisionSprintStatusSchema.optional(),
    executiveSponsorContactId: z.string().uuid().optional(),
    workingTeam: z.string().trim().max(1000).optional(),
    commercialValueChf: moneySchema.optional(),
    outputs: z.string().trim().max(4000).optional(),
    followUpAction: z.string().trim().max(1000).optional(),
  })
  .strict();

export const updateDecisionSprintRequestSchema = z
  .object({
    opportunityId: z.string().uuid().nullable().optional(),
    decisionId: z.string().uuid().nullable().optional(),
    scope: z.string().trim().max(2000).nullable().optional(),
    startDate: dateStringSchema.nullable().optional(),
    targetCompletionDate: dateStringSchema.nullable().optional(),
    status: decisionSprintStatusSchema.optional(),
    executiveSponsorContactId: z.string().uuid().nullable().optional(),
    workingTeam: z.string().trim().max(1000).nullable().optional(),
    commercialValueChf: moneySchema.nullable().optional(),
    outputs: z.string().trim().max(4000).nullable().optional(),
    followUpAction: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export const upsertDecisionSprintOutcomeRequestSchema = z
  .object({
    recommendationDelivered: z.string().trim().max(4000).optional(),
    finalHumanDecision: z.string().trim().max(2000).optional(),
    estimatedDecisionValueChf: moneySchema.optional(),
    businessCaseValueChf: moneySchema.optional(),
    customerAcceptedRecommendation: z.boolean().optional(),
    customerSelectedDifferentOption: z.boolean().optional(),
    reasons: z.string().trim().max(4000).optional(),
    nextStep: z.string().trim().max(2000).optional(),
    expansionPotential: z.string().trim().max(2000).optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Conversions (brief §17/§18)

export const createCommercialConversionRequestSchema = z
  .object({
    fromAccountId: z.string().uuid(),
    fromSprintId: z.string().uuid().optional(),
    fromOpportunityId: z.string().uuid().optional(),
    toOpportunityId: z.string().uuid().optional(),
    conversionType: conversionTypeSchema,
    conversionOutcome: z.string().trim().max(2000).optional(),
    conversionDate: dateStringSchema.optional(),
    conversionValueChf: moneySchema.optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Customer references (brief §46/§47)

export const upsertCustomerReferenceRequestSchema = z
  .object({
    accountId: z.string().uuid(),
    referenceStatus: customerReferenceStatusSchema.optional(),
    allowAnonymousStats: z.boolean().optional(),
    allowPublicReference: z.boolean().optional(),
    allowLogoUse: z.boolean().optional(),
    allowCaseStudy: z.boolean().optional(),
    allowQuote: z.boolean().optional(),
    quoteText: z.string().trim().max(2000).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Activities / notes (brief §40/§54)

export const createCommercialActivityRequestSchema = z
  .object({
    opportunityId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    activityType: z.string().trim().min(1).max(200),
    note: z.string().trim().max(4000).optional(),
  })
  .strict()
  .refine((v) => v.opportunityId !== undefined || v.accountId !== undefined, {
    message: "Either opportunityId or accountId is required.",
  });

// ---------------------------------------------------------------------------
// Lead -> Opportunity promotion (brief §50)

export const promoteInquiryRequestSchema = z
  .object({
    inquiryId: z.string().uuid(),
    // An existing account to attach to, OR create a new one from the
    // inquiry's own company field — never both, never neither.
    accountId: z.string().uuid().optional(),
    commercialPackage: commercialPackageSchema,
  })
  .strict();

export type CreateCommercialAccountRequest = z.infer<typeof createCommercialAccountRequestSchema>;
export type UpdateCommercialAccountRequest = z.infer<typeof updateCommercialAccountRequestSchema>;
export type CreateCommercialContactRequest = z.infer<typeof createCommercialContactRequestSchema>;
export type UpdateCommercialContactRequest = z.infer<typeof updateCommercialContactRequestSchema>;
export type CreateCommercialOpportunityRequest = z.infer<typeof createCommercialOpportunityRequestSchema>;
export type UpdateCommercialOpportunityRequest = z.infer<typeof updateCommercialOpportunityRequestSchema>;
export type UpsertCommercialContractRequest = z.infer<typeof upsertCommercialContractRequestSchema>;
export type CreateCommercialInvoiceRequest = z.infer<typeof createCommercialInvoiceRequestSchema>;
export type UpdateCommercialInvoiceRequest = z.infer<typeof updateCommercialInvoiceRequestSchema>;
export type CreateDecisionSprintRequest = z.infer<typeof createDecisionSprintRequestSchema>;
export type UpdateDecisionSprintRequest = z.infer<typeof updateDecisionSprintRequestSchema>;
export type UpsertDecisionSprintOutcomeRequest = z.infer<typeof upsertDecisionSprintOutcomeRequestSchema>;
export type CreateCommercialConversionRequest = z.infer<typeof createCommercialConversionRequestSchema>;
export type UpsertCustomerReferenceRequest = z.infer<typeof upsertCustomerReferenceRequestSchema>;
export type CreateCommercialActivityRequest = z.infer<typeof createCommercialActivityRequestSchema>;
export type PromoteInquiryRequest = z.infer<typeof promoteInquiryRequestSchema>;

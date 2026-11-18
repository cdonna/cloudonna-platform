/**
 * Revenue Operations position (brief §24/§59/AJ) — composes every
 * other deterministic module in this directory into the single
 * summary the First CHF 1M Control Panel and the final report's
 * "Current CHF 1M Position" section both read from. Pure function:
 * every input is a plain array already fetched by the caller: no
 * Supabase client here, so this stays trivially testable.
 *
 * Bookings/ARR/TCV here come from REAL SIGNED CONTRACTS
 * (commercial_contracts.computed_*_chf, via contract-economics.ts),
 * never from an opportunity's "expected" fields — a closed_won
 * opportunity with no contract yet contributes zero to these
 * numbers, which is the honest answer per brief §11, not a bug.
 */
import { CLOSED_STAGES, type OpportunityStage } from "./opportunity-stages";
import { computePipelineSummary, type PipelineSummary } from "./pipeline-model";
import { FIRST_MILLION_TARGET_CHF } from "./target-model";
import type { CommercialPackageId } from "./packages";
import { computeHygieneIssues, type HygieneIssueCode } from "./pipeline-hygiene";
import { assessCapacity, type CapacityAssessment } from "./capacity";
import type { DecisionSprintStatus } from "./decision-sprint-status";
import { ACTIVE_SPRINT_STATUSES } from "./decision-sprint-status";
import type { ConversionType } from "./conversion-type";

export interface RevenuePositionOpportunityInput {
  id: string;
  accountId: string;
  accountName: string;
  stage: OpportunityStage;
  commercialPackage: CommercialPackageId;
  primaryContactId: string | null;
  nextAction: string | null;
  nextActionDueAt: string | null;
  targetCloseDate: string | null;
  useCase: string | null;
  decisionDeadline: string | null;
  expectedBookingsChf: number | null;
  expectedArrChf: number | null;
  expectedAcvChf: number | null;
  expectedTcvChf: number | null;
  stageChangedAt: string;
}

export interface RevenuePositionContractInput {
  opportunityId: string;
  contractStatus: string;
  computedBookingsChf: number | null;
  computedArrChf: number | null;
  computedTcvChf: number | null;
  currency: string;
}

export interface RevenuePositionInvoiceInput {
  currency: string;
  paidAmount: number;
}

export interface RevenuePositionSprintInput {
  status: DecisionSprintStatus;
}

export interface RevenuePositionConversionInput {
  conversionType: ConversionType;
}

const RECOGNIZED_CONTRACT_STATUSES = ["signed", "active"];

export interface OpportunityWithHygiene {
  opportunity: RevenuePositionOpportunityInput;
  hygieneIssues: HygieneIssueCode[];
}

export interface RevenuePositionResult {
  targetBookingsChf: number;
  bookedChf: number;
  arrChf: number;
  tcvChf: number;
  cashCollectedChf: number;
  /** Count of signed/active contracts in a non-CHF currency with no
   * CHF-equivalent available — excluded from bookedChf/arrChf/tcvChf
   * above, never silently guessed. Surfaced so staff know the real
   * total is understated by at least this many deals. */
  excludedNonChfContractCount: number;
  pipeline: PipelineSummary;
  sprintsActive: number;
  sprintsCompleted: number;
  sprintToTeamConversionCount: number;
  teamToEnterpriseConversionCount: number;
  capacity: CapacityAssessment;
  topOpenOpportunities: RevenuePositionOpportunityInput[];
  opportunitiesWithHygieneIssues: OpportunityWithHygiene[];
  nextActionsDueSoon: RevenuePositionOpportunityInput[];
  openOpportunityCount: number;
}

function dealValue(o: { expectedTcvChf: number | null; expectedAcvChf: number | null }): number {
  return o.expectedTcvChf ?? o.expectedAcvChf ?? 0;
}

const TEAM_CONVERSION_TYPES: ConversionType[] = ["sprint_to_team"];
const ENTERPRISE_CONVERSION_TYPES: ConversionType[] = ["team_to_enterprise", "sprint_to_enterprise"];

export function computeRevenuePosition(
  opportunities: RevenuePositionOpportunityInput[],
  contracts: RevenuePositionContractInput[],
  invoices: RevenuePositionInvoiceInput[],
  sprints: RevenuePositionSprintInput[],
  conversions: RevenuePositionConversionInput[],
  accountIdsWithEconomicBuyer: Set<string>,
  options: { targetBookingsChf?: number; topN?: number; nextActionWindowDays?: number; now?: Date } = {},
): RevenuePositionResult {
  const targetBookingsChf = options.targetBookingsChf ?? FIRST_MILLION_TARGET_CHF;
  const topN = options.topN ?? 10;
  const nextActionWindowDays = options.nextActionWindowDays ?? 7;
  const now = options.now ?? new Date();

  const recognizedContracts = contracts.filter((c) => RECOGNIZED_CONTRACT_STATUSES.includes(c.contractStatus));
  let excludedNonChfContractCount = 0;
  let bookedChf = 0;
  let arrChf = 0;
  let tcvChf = 0;
  for (const contract of recognizedContracts) {
    if (contract.computedBookingsChf === null || contract.computedArrChf === null || contract.computedTcvChf === null) {
      excludedNonChfContractCount += 1;
      continue;
    }
    bookedChf += contract.computedBookingsChf;
    arrChf += contract.computedArrChf;
    tcvChf += contract.computedTcvChf;
  }

  const cashCollectedChf = invoices.filter((i) => i.currency === "CHF").reduce((sum, i) => sum + i.paidAmount, 0);

  const open = opportunities.filter((o) => !CLOSED_STAGES.includes(o.stage));
  const pipeline = computePipelineSummary(
    open.map((o) => ({ stage: o.stage, expectedAcvChf: o.expectedAcvChf, expectedTcvChf: o.expectedTcvChf, probabilityPercent: null })),
    { targetBookingsChf, bookedChf },
  );

  const sprintsActive = sprints.filter((s) => ACTIVE_SPRINT_STATUSES.includes(s.status)).length;
  const sprintsCompleted = sprints.filter((s) => s.status === "completed").length;

  const sprintToTeamConversionCount = conversions.filter((c) => TEAM_CONVERSION_TYPES.includes(c.conversionType)).length;
  const teamToEnterpriseConversionCount = conversions.filter((c) => ENTERPRISE_CONVERSION_TYPES.includes(c.conversionType)).length;

  const capacity = assessCapacity(sprintsActive);

  const topOpenOpportunities = [...open].sort((a, b) => dealValue(b) - dealValue(a)).slice(0, topN);

  const opportunitiesWithHygieneIssues: OpportunityWithHygiene[] = open
    .map((o) => ({
      opportunity: o,
      hygieneIssues: computeHygieneIssues(
        {
          stage: o.stage,
          primaryContactId: o.primaryContactId,
          nextAction: o.nextAction,
          nextActionDueAt: o.nextActionDueAt,
          targetCloseDate: o.targetCloseDate,
          useCase: o.useCase,
          decisionDeadline: o.decisionDeadline,
          expectedBookingsChf: o.expectedBookingsChf,
          expectedArrChf: o.expectedArrChf,
          expectedTcvChf: o.expectedTcvChf,
          stageChangedAt: o.stageChangedAt,
        },
        accountIdsWithEconomicBuyer.has(o.accountId),
        now,
      ),
    }))
    .filter((r) => r.hygieneIssues.length > 0);

  const windowEnd = new Date(now.getTime() + nextActionWindowDays * 24 * 60 * 60 * 1000).getTime();
  const nextActionsDueSoon = open.filter((o) => o.nextActionDueAt !== null && new Date(o.nextActionDueAt).getTime() <= windowEnd);

  return {
    targetBookingsChf,
    bookedChf,
    arrChf,
    tcvChf,
    cashCollectedChf,
    excludedNonChfContractCount,
    pipeline,
    sprintsActive,
    sprintsCompleted,
    sprintToTeamConversionCount,
    teamToEnterpriseConversionCount,
    capacity,
    topOpenOpportunities,
    opportunitiesWithHygieneIssues,
    nextActionsDueSoon,
    openOpportunityCount: open.length,
  };
}

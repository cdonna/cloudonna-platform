/**
 * Pipeline hygiene rules (brief §21/§22) — deterministic flags over a
 * real opportunity, never an auto-close or auto-escalation. Every
 * flag is a plain boolean check against real columns; nothing here
 * predicts anything.
 */
import { CLOSED_STAGES, type OpportunityStage } from "./opportunity-stages";

export type HygieneIssueCode =
  | "no_next_action"
  | "next_action_overdue"
  | "close_date_in_past"
  | "no_primary_contact"
  | "no_expected_value"
  | "no_decision_use_case"
  | "stale_stage"
  | "missing_economic_buyer"
  | "missing_decision_deadline";

export const HYGIENE_ISSUE_LABELS: Record<HygieneIssueCode, string> = {
  no_next_action: "No next action set",
  next_action_overdue: "Next action is overdue",
  close_date_in_past: "Target close date is in the past",
  no_primary_contact: "No primary contact linked",
  no_expected_value: "No expected bookings, ARR, or TCV set",
  no_decision_use_case: "No decision use case recorded",
  stale_stage: "Stage has not changed in a long time",
  missing_economic_buyer: "No economic buyer identified for this account",
  missing_decision_deadline: "No customer decision deadline recorded",
};

/** Days with no stage change before an open opportunity is flagged
 * stale — a documented planning default (brief §21's "stale stage"),
 * not a statistically derived threshold. */
export const STALE_STAGE_DAYS = 30;

export interface HygieneOpportunityInput {
  stage: OpportunityStage;
  primaryContactId: string | null;
  nextAction: string | null;
  nextActionDueAt: string | null;
  targetCloseDate: string | null;
  useCase: string | null;
  decisionDeadline: string | null;
  expectedBookingsChf: number | null;
  expectedArrChf: number | null;
  expectedTcvChf: number | null;
  stageChangedAt: string;
}

export function computeHygieneIssues(opportunity: HygieneOpportunityInput, accountHasEconomicBuyer: boolean, now: Date = new Date()): HygieneIssueCode[] {
  if (CLOSED_STAGES.includes(opportunity.stage)) return [];

  const issues: HygieneIssueCode[] = [];
  const today = now.getTime();

  if (!opportunity.nextAction) issues.push("no_next_action");
  if (opportunity.nextActionDueAt && new Date(opportunity.nextActionDueAt).getTime() < today) issues.push("next_action_overdue");
  if (opportunity.targetCloseDate && new Date(opportunity.targetCloseDate).getTime() < today) issues.push("close_date_in_past");
  if (!opportunity.primaryContactId) issues.push("no_primary_contact");
  if (!opportunity.expectedBookingsChf && !opportunity.expectedArrChf && !opportunity.expectedTcvChf) issues.push("no_expected_value");
  if (!opportunity.useCase || opportunity.useCase.trim() === "") issues.push("no_decision_use_case");
  if (!accountHasEconomicBuyer) issues.push("missing_economic_buyer");
  if (!opportunity.decisionDeadline) issues.push("missing_decision_deadline");

  const daysSinceStageChange = (today - new Date(opportunity.stageChangedAt).getTime()) / (24 * 60 * 60 * 1000);
  if (daysSinceStageChange > STALE_STAGE_DAYS) issues.push("stale_stage");

  return issues;
}

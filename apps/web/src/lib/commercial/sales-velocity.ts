/**
 * Sales velocity (brief §20) — average days between real, logged
 * transitions, computed only from commercial_activities stage-change
 * records (activity_type === "stage_changed") plus
 * decision_sprints/commercial_conversions timestamps. Every
 * transition independently reports `insufficientData: true` rather
 * than a fabricated average when fewer than MIN_SAMPLE_SIZE real
 * data points exist — brief §20's explicit "do not show fake
 * averages when dataset is too small."
 */
export const MIN_SAMPLE_SIZE = 2;

export interface VelocitySample {
  fromTimestamp: string;
  toTimestamp: string;
}

export interface VelocityResult {
  averageDays: number | null;
  sampleSize: number;
  insufficientData: boolean;
}

export function computeVelocity(samples: VelocitySample[]): VelocityResult {
  const days = samples
    .map((s) => (new Date(s.toTimestamp).getTime() - new Date(s.fromTimestamp).getTime()) / (24 * 60 * 60 * 1000))
    .filter((d) => Number.isFinite(d) && d >= 0);

  if (days.length < MIN_SAMPLE_SIZE) {
    return { averageDays: null, sampleSize: days.length, insufficientData: true };
  }
  const averageDays = days.reduce((sum, d) => sum + d, 0) / days.length;
  return { averageDays, sampleSize: days.length, insufficientData: false };
}

export interface SalesVelocityStageTransitions {
  inquiryToQualified: VelocitySample[];
  qualifiedToProposal: VelocitySample[];
  proposalToSigned: VelocitySample[];
  signedToSprintStart: VelocitySample[];
  sprintStartToCompletion: VelocitySample[];
  completionToExpansion: VelocitySample[];
}

export interface SalesVelocityResult {
  inquiryToQualified: VelocityResult;
  qualifiedToProposal: VelocityResult;
  proposalToSigned: VelocityResult;
  signedToSprintStart: VelocityResult;
  sprintStartToCompletion: VelocityResult;
  completionToExpansion: VelocityResult;
}

export interface StageTransitionActivity {
  opportunityId: string;
  afterStage: string | null;
  createdAt: string;
}

export interface OpportunityCreatedAt {
  id: string;
  createdAt: string;
}

/** Derives real inquiry->qualified / qualified->sprint_proposed /
 * sprint_proposed->closed_won samples from the logged
 * commercial_activities stage-change history plus each opportunity's
 * own createdAt (as the "reached inquiry" timestamp — every
 * opportunity starts there) — never fabricated, and silently skips
 * any opportunity missing the relevant logged transition rather than
 * guessing a timestamp. */
export function deriveStageTransitionSamples(
  opportunities: OpportunityCreatedAt[],
  activities: StageTransitionActivity[],
): Pick<SalesVelocityStageTransitions, "inquiryToQualified" | "qualifiedToProposal" | "proposalToSigned"> {
  const firstTimestampByOpportunityAndStage = new Map<string, Map<string, string>>();
  for (const activity of activities) {
    if (activity.afterStage === null) continue;
    const byStage = firstTimestampByOpportunityAndStage.get(activity.opportunityId) ?? new Map<string, string>();
    if (!byStage.has(activity.afterStage)) byStage.set(activity.afterStage, activity.createdAt);
    firstTimestampByOpportunityAndStage.set(activity.opportunityId, byStage);
  }

  const inquiryToQualified: VelocitySample[] = [];
  const qualifiedToProposal: VelocitySample[] = [];
  const proposalToSigned: VelocitySample[] = [];

  for (const opportunity of opportunities) {
    const byStage = firstTimestampByOpportunityAndStage.get(opportunity.id);
    if (!byStage) continue;
    const qualifiedAt = byStage.get("qualified");
    const proposedAt = byStage.get("sprint_proposed");
    const signedAt = byStage.get("closed_won");

    if (qualifiedAt) inquiryToQualified.push({ fromTimestamp: opportunity.createdAt, toTimestamp: qualifiedAt });
    if (qualifiedAt && proposedAt) qualifiedToProposal.push({ fromTimestamp: qualifiedAt, toTimestamp: proposedAt });
    if (proposedAt && signedAt) proposalToSigned.push({ fromTimestamp: proposedAt, toTimestamp: signedAt });
  }

  return { inquiryToQualified, qualifiedToProposal, proposalToSigned };
}

export function computeSalesVelocity(transitions: SalesVelocityStageTransitions): SalesVelocityResult {
  return {
    inquiryToQualified: computeVelocity(transitions.inquiryToQualified),
    qualifiedToProposal: computeVelocity(transitions.qualifiedToProposal),
    proposalToSigned: computeVelocity(transitions.proposalToSigned),
    signedToSprintStart: computeVelocity(transitions.signedToSprintStart),
    sprintStartToCompletion: computeVelocity(transitions.sprintStartToCompletion),
    completionToExpansion: computeVelocity(transitions.completionToExpansion),
  };
}

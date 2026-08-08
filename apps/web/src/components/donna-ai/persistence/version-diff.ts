/**
 * Sprint 6.2 — Version Diff Engine.
 *
 * Pure domain logic, no I/O, no React, no Supabase: given two already-
 * computed, already-stored decision snapshots (never re-running the
 * deterministic engine — see docs/architecture/sprint-6.1-freeze.md
 * §10), produce a structured description of what changed between them.
 * No visual rendering lives here by design — see
 * docs/roadmap/sprint-6.2.md, "Version Diff Engine ... do not build a
 * visual UI yet." VersionDiffPanel.tsx is the (deliberately plain)
 * consumer of this module's output.
 */
import type {
  AiPlatform,
  AnalyticsTool,
  BudgetLevel,
  CloudProvider,
  ConstraintsInput,
  CrmSystem,
  DataWarehouseSystem,
  ErpSystem,
  GoalTag,
  InternalSkills,
  LandscapeInput,
  PreferredCloud,
  PreferredVendor,
  RiskAppetite,
  TimelineLevel,
} from "../types";
import type { ScoreDimensionKey } from "../scoring/types";
import type { DecisionInput, DeterministicDecisionOutput } from "../intelligence/types";

export interface VersionProvenance {
  schemaVersion: string;
  scoringEngineVersion: string;
  knowledgeBaseVersion: string;
}

export interface VersionSnapshot {
  versionNumber: number;
  decisionInput: DecisionInput;
  output: DeterministicDecisionOutput;
  provenance: VersionProvenance;
}

export interface FieldChange {
  field: string;
  label: string;
  from: string;
  to: string;
  /** Set only for fields on a genuinely ordered scale (budget, timeline,
   * risk appetite) — "increased"/"decreased" is a meaningful, honest
   * claim there. Absent for unordered enums (ERP, CRM, cloud provider,
   * etc.), where only "changed from X to Y" would ever be true. */
  direction?: "increased" | "decreased";
}

export interface DimensionScoreChange {
  key: ScoreDimensionKey;
  label: string;
  from: number;
  to: number;
  delta: number;
}

export interface ScoreChange {
  from: number;
  to: number;
  delta: number;
}

export interface RecommendationSnapshot {
  id: string;
  name: string;
}

export interface RecommendationChange {
  changed: boolean;
  from: RecommendationSnapshot | null;
  to: RecommendationSnapshot | null;
}

export interface VersionDiff {
  fromVersion: number;
  toVersion: number;
  changedConstraints: FieldChange[];
  changedPriorities: { added: GoalTag[]; removed: GoalTag[] };
  changedVendors: FieldChange[];
  changedScores: {
    donnaScore: ScoreChange;
    confidenceScore: ScoreChange;
    dimensions: DimensionScoreChange[];
  };
  changedRecommendations: {
    primary: RecommendationChange;
    alternative: RecommendationChange;
  };
  /** Diffs the three provenance strings (schema/scoring-engine/
   * knowledge-base version) — required to attribute a score difference
   * to "the engine changed" rather than "the input changed" when
   * replaying a historical version against the current engine. See
   * docs/capabilities/decision-memory.md, "Slice B." */
  changedProvenance: FieldChange[];
  hasChanges: boolean;
}

// ---------------------------------------------------------------------------
// Human-readable labels — the finite, already-closed set of enum values
// types.ts defines. Needed so field-level diff entries and the score
// explanation (score-explanation.ts) never surface a raw slug like
// "sap-s4hana" as if it were prose.

const BUDGET_LABELS: Record<BudgetLevel, string> = { tight: "Tight", moderate: "Moderate", flexible: "Flexible" };
const TIMELINE_LABELS: Record<TimelineLevel, string> = { aggressive: "Aggressive", standard: "Standard", extended: "Extended" };
const RISK_LABELS: Record<RiskAppetite, string> = { low: "Low", medium: "Medium", high: "High" };
const PREFERRED_CLOUD_LABELS: Record<PreferredCloud, string> = { azure: "Azure", aws: "AWS", gcp: "GCP", "no-preference": "No preference" };
const PREFERRED_VENDOR_LABELS: Record<PreferredVendor, string> = { sap: "SAP", microsoft: "Microsoft", "no-preference": "No preference" };
const SKILLS_LABELS: Record<InternalSkills, string> = { strong: "Strong", moderate: "Moderate", limited: "Limited" };

const ERP_LABELS: Record<ErpSystem, string> = {
  "sap-s4hana": "SAP S/4HANA",
  "sap-ecc": "SAP ECC",
  oracle: "Oracle",
  dynamics: "Dynamics",
  "other-none": "Other / none",
};
const CRM_LABELS: Record<CrmSystem, string> = {
  salesforce: "Salesforce",
  "dynamics-crm": "Dynamics CRM",
  "sap-crm": "SAP CRM",
  "other-none": "Other / none",
};
const ANALYTICS_LABELS: Record<AnalyticsTool, string> = {
  "power-bi": "Power BI",
  sac: "SAP Analytics Cloud",
  tableau: "Tableau",
  looker: "Looker",
  "other-none": "Other / none",
};
const DATA_WAREHOUSE_LABELS: Record<DataWarehouseSystem, string> = {
  "sap-bw": "SAP BW",
  snowflake: "Snowflake",
  databricks: "Databricks",
  bigquery: "BigQuery",
  "other-none": "Other / none",
};
const CLOUD_PROVIDER_LABELS: Record<CloudProvider, string> = {
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
  "multi-cloud": "Multi-cloud",
  "on-premise": "On-premise",
};
const AI_PLATFORM_LABELS: Record<AiPlatform, string> = {
  "none-yet": "None yet",
  "azure-ai": "Azure AI",
  copilot: "Copilot",
  "vertex-ai": "Vertex AI",
  other: "Other",
};

export const GOAL_LABELS: Record<GoalTag, string> = {
  modernization: "Modernization",
  "business-ai": "Business AI",
  planning: "Planning",
  governance: "Governance",
  "data-products": "Data products",
  "cost-reduction": "Cost reduction",
  compliance: "Compliance",
  innovation: "Innovation",
};

const NONE_LABEL = "Not set";

function fmt<T extends string>(labels: Record<T, string>, value: T | null): string {
  return value === null ? NONE_LABEL : labels[value];
}

// ---------------------------------------------------------------------------
// Constraints

// Ordered scales, low-to-high — the only fields where "increased"/
// "decreased" is ever asserted (see FieldChange.direction).
const BUDGET_SCALE: readonly BudgetLevel[] = ["tight", "moderate", "flexible"];
const TIMELINE_SCALE: readonly TimelineLevel[] = ["aggressive", "standard", "extended"];
const RISK_SCALE: readonly RiskAppetite[] = ["low", "medium", "high"];

function directionOf<T extends string>(scale: readonly T[], from: T | null, to: T | null): "increased" | "decreased" | undefined {
  if (from === null || to === null) return undefined;
  const fromIndex = scale.indexOf(from);
  const toIndex = scale.indexOf(to);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return undefined;
  return toIndex > fromIndex ? "increased" : "decreased";
}

interface ConstraintFieldDef {
  field: keyof ConstraintsInput;
  label: string;
  format: (value: ConstraintsInput[keyof ConstraintsInput]) => string;
  direction?: (from: ConstraintsInput[keyof ConstraintsInput], to: ConstraintsInput[keyof ConstraintsInput]) => "increased" | "decreased" | undefined;
}

const CONSTRAINT_FIELDS: ConstraintFieldDef[] = [
  {
    field: "budget",
    label: "Budget",
    format: (v) => fmt(BUDGET_LABELS, v as BudgetLevel | null),
    direction: (f, t) => directionOf(BUDGET_SCALE, f as BudgetLevel | null, t as BudgetLevel | null),
  },
  {
    field: "timeline",
    label: "Timeline",
    format: (v) => fmt(TIMELINE_LABELS, v as TimelineLevel | null),
    direction: (f, t) => directionOf(TIMELINE_SCALE, f as TimelineLevel | null, t as TimelineLevel | null),
  },
  {
    field: "riskAppetite",
    label: "Risk appetite",
    format: (v) => fmt(RISK_LABELS, v as RiskAppetite | null),
    direction: (f, t) => directionOf(RISK_SCALE, f as RiskAppetite | null, t as RiskAppetite | null),
  },
  { field: "preferredCloud", label: "Preferred cloud", format: (v) => fmt(PREFERRED_CLOUD_LABELS, v as PreferredCloud | null) },
  { field: "preferredVendor", label: "Preferred vendor", format: (v) => fmt(PREFERRED_VENDOR_LABELS, v as PreferredVendor | null) },
  { field: "internalSkills", label: "Internal skills", format: (v) => fmt(SKILLS_LABELS, v as InternalSkills | null) },
];

function diffConstraints(from: ConstraintsInput, to: ConstraintsInput): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const def of CONSTRAINT_FIELDS) {
    const fromValue = from[def.field];
    const toValue = to[def.field];
    if (fromValue !== toValue) {
      changes.push({
        field: def.field,
        label: def.label,
        from: def.format(fromValue),
        to: def.format(toValue),
        direction: def.direction?.(fromValue, toValue),
      });
    }
  }
  return changes;
}

// ---------------------------------------------------------------------------
// Priorities (goals)

function diffPriorities(from: GoalTag[], to: GoalTag[]): { added: GoalTag[]; removed: GoalTag[] } {
  const added = to.filter((goal) => !from.includes(goal));
  const removed = from.filter((goal) => !to.includes(goal));
  return { added, removed };
}

// ---------------------------------------------------------------------------
// Vendors — the landscape's existing systems, distinct from
// changedRecommendations (which platform Donna recommends).

interface LandscapeFieldDef {
  field: keyof LandscapeInput;
  label: string;
  format: (value: LandscapeInput[keyof LandscapeInput]) => string;
}

const LANDSCAPE_FIELDS: LandscapeFieldDef[] = [
  { field: "erp", label: "ERP", format: (v) => fmt(ERP_LABELS, v as ErpSystem | null) },
  { field: "crm", label: "CRM", format: (v) => fmt(CRM_LABELS, v as CrmSystem | null) },
  { field: "analytics", label: "Analytics", format: (v) => fmt(ANALYTICS_LABELS, v as AnalyticsTool | null) },
  { field: "dataWarehouse", label: "Data warehouse", format: (v) => fmt(DATA_WAREHOUSE_LABELS, v as DataWarehouseSystem | null) },
  { field: "cloud", label: "Cloud provider", format: (v) => fmt(CLOUD_PROVIDER_LABELS, v as CloudProvider | null) },
  { field: "aiPlatform", label: "AI platform", format: (v) => fmt(AI_PLATFORM_LABELS, v as AiPlatform | null) },
];

function diffVendors(from: LandscapeInput, to: LandscapeInput): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const def of LANDSCAPE_FIELDS) {
    const fromValue = from[def.field];
    const toValue = to[def.field];
    if (fromValue !== toValue) {
      changes.push({ field: def.field, label: def.label, from: def.format(fromValue), to: def.format(toValue) });
    }
  }
  return changes;
}

// ---------------------------------------------------------------------------
// Scores

function diffScores(from: DeterministicDecisionOutput, to: DeterministicDecisionOutput) {
  const donnaScore: ScoreChange = { from: from.donnaScore, to: to.donnaScore, delta: to.donnaScore - from.donnaScore };
  const confidenceScore: ScoreChange = {
    from: from.confidenceScore,
    to: to.confidenceScore,
    delta: to.confidenceScore - from.confidenceScore,
  };

  const toDimensionsByKey = new Map(to.dimensions.map((dimension) => [dimension.key, dimension]));
  const dimensions: DimensionScoreChange[] = [];
  for (const fromDimension of from.dimensions) {
    const toDimension = toDimensionsByKey.get(fromDimension.key);
    if (!toDimension || toDimension.score === fromDimension.score) continue;
    dimensions.push({
      key: fromDimension.key,
      label: fromDimension.label,
      from: fromDimension.score,
      to: toDimension.score,
      delta: toDimension.score - fromDimension.score,
    });
  }

  return { donnaScore, confidenceScore, dimensions };
}

// ---------------------------------------------------------------------------
// Recommendations

function toSnapshot(platform: DeterministicDecisionOutput["recommendation"] | null): RecommendationSnapshot | null {
  if (!platform) return null;
  return { id: platform.platform.id, name: `${platform.platform.vendor} ${platform.platform.productName}` };
}

function diffRecommendation(
  from: DeterministicDecisionOutput["recommendation"] | null,
  to: DeterministicDecisionOutput["recommendation"] | null,
): RecommendationChange {
  const fromSnapshot = toSnapshot(from);
  const toSnapshotValue = toSnapshot(to);
  return {
    changed: fromSnapshot?.id !== toSnapshotValue?.id,
    from: fromSnapshot,
    to: toSnapshotValue,
  };
}

// ---------------------------------------------------------------------------
// Provenance — no ordered scale, no domain label map: these are already
// human-readable version strings (e.g. "donna-score-v2"), so unlike
// constraints/vendors there is nothing to translate, only to compare.

const PROVENANCE_FIELDS: Array<{ field: keyof VersionProvenance; label: string }> = [
  { field: "schemaVersion", label: "Schema version" },
  { field: "scoringEngineVersion", label: "Scoring engine" },
  { field: "knowledgeBaseVersion", label: "Knowledge base" },
];

function diffProvenance(from: VersionProvenance, to: VersionProvenance): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const def of PROVENANCE_FIELDS) {
    const fromValue = from[def.field];
    const toValue = to[def.field];
    if (fromValue !== toValue) {
      changes.push({ field: def.field, label: def.label, from: fromValue, to: toValue });
    }
  }
  return changes;
}

// ---------------------------------------------------------------------------

export function diffDecisionVersions(from: VersionSnapshot, to: VersionSnapshot): VersionDiff {
  const fromWizard = from.decisionInput.wizardState;
  const toWizard = to.decisionInput.wizardState;

  const changedConstraints = diffConstraints(fromWizard.constraints, toWizard.constraints);
  const changedPriorities = diffPriorities(fromWizard.goals.goals, toWizard.goals.goals);
  const changedVendors = diffVendors(fromWizard.landscape, toWizard.landscape);
  const changedScores = diffScores(from.output, to.output);
  const changedRecommendations = {
    primary: diffRecommendation(from.output.recommendation, to.output.recommendation),
    alternative: diffRecommendation(from.output.alternativeRecommendation, to.output.alternativeRecommendation),
  };
  const changedProvenance = diffProvenance(from.provenance, to.provenance);

  const hasChanges =
    changedConstraints.length > 0 ||
    changedPriorities.added.length > 0 ||
    changedPriorities.removed.length > 0 ||
    changedVendors.length > 0 ||
    changedScores.donnaScore.delta !== 0 ||
    changedScores.confidenceScore.delta !== 0 ||
    changedScores.dimensions.length > 0 ||
    changedRecommendations.primary.changed ||
    changedRecommendations.alternative.changed ||
    changedProvenance.length > 0;

  return {
    fromVersion: from.versionNumber,
    toVersion: to.versionNumber,
    changedConstraints,
    changedPriorities,
    changedVendors,
    changedScores,
    changedRecommendations,
    changedProvenance,
    hasChanges,
  };
}

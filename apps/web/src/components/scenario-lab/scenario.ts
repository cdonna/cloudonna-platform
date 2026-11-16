/**
 * One illustrative scenario for the public Scenario Lab — deliberately
 * separate from both the real decision engine (components/donna-ai/)
 * and the homepage demo engine (components/donna/demo-decision-engine.ts).
 * Same honesty rule as both of those: scores are always labeled
 * illustrative, never presented as live market data, and nothing here
 * is a fabricated dollar figure — only 0-100 illustrative fit scores,
 * the same pattern the homepage demo already uses. Pure and
 * deterministic: toggling the same assumptions always produces the
 * same shift.
 */
export interface ScenarioPlatform {
  id: string;
  name: string;
  baseScore: number;
}

/**
 * The kinds of thing a changed assumption can move. Keyed to
 * dict.scenarioLabPage.shiftKinds, so the Scenario Lab can say *what*
 * shifted rather than only showing a score moving — "the number went
 * down" is not an explanation. `shiftKinds.input` in the dictionary
 * labels the trigger itself (the assumption you changed), which is why
 * it is not one of these.
 */
export type ShiftKind = "recommendation" | "risk" | "cost" | "architecture";

export interface ScenarioAssumption {
  id: string;
  label: string;
  /** Per-platform score delta this assumption applies when active. */
  effects: Record<string, number>;
  /** Shown once this assumption is toggled on. */
  note: string;
  /** What this assumption moves, beyond the score. Qualitative on
   * purpose: a precise cost delta here would be invented. */
  shifts: Partial<Record<ShiftKind, string>>;
}

export interface ScenarioTimelineEvent {
  id: string;
  when: string;
  title: string;
  body: string;
}

export interface DecisionScenario {
  id: string;
  title: string;
  situation: string;
  platforms: ScenarioPlatform[];
  assumptions: ScenarioAssumption[];
  timeline: ScenarioTimelineEvent[];
}

export const DATA_PLATFORM_SCENARIO: DecisionScenario = {
  id: "data-platform-modernization",
  title: "Data platform modernization",
  situation:
    "A manufacturing enterprise running SAP S/4HANA needs a modern data and analytics foundation for the next five years.",
  platforms: [
    { id: "sap-bdc", name: "SAP Business Data Cloud", baseScore: 78 },
    { id: "databricks", name: "Databricks", baseScore: 74 },
    { id: "snowflake", name: "Snowflake", baseScore: 70 },
    { id: "fabric", name: "Microsoft Fabric", baseScore: 68 },
  ],
  assumptions: [
    {
      id: "budget-cut",
      label: "Budget reduced by 30%",
      effects: { "sap-bdc": -4, databricks: -3, snowflake: 3, fabric: 2 },
      note: "Consumption-based platforms gain ground once fixed commitments become harder to justify.",
      shifts: {
        cost: "Fixed commitments become harder to defend than variable consumption.",
        recommendation: "The gap between the leader and the consumption-priced alternatives narrows.",
      },
    },
    {
      id: "deadline-shortened",
      label: "Deadline shortened by six months",
      effects: { "sap-bdc": 5, fabric: 4, databricks: -3, snowflake: -2 },
      note: "Platforms already native to the existing landscape pull ahead once speed matters more than flexibility.",
      shifts: {
        risk: "Migration sequencing risk rises; there is less room to decommission legacy extracts on schedule.",
        architecture: "Favours staying close to the existing landscape over introducing a second platform.",
      },
    },
    {
      id: "regulation-increases",
      label: "Regulatory requirements increase",
      effects: { "sap-bdc": 6, fabric: 2, databricks: -2, snowflake: -3 },
      note: "Stronger built-in governance becomes worth more once compliance risk rises.",
      shifts: {
        risk: "Compliance risk moves from a constraint to a decision driver.",
        architecture: "Built-in governance stops being a convenience and starts being the requirement.",
      },
    },
    {
      id: "vendor-pricing-changes",
      label: "A key vendor raises consumption pricing",
      effects: { databricks: -6, snowflake: -5, "sap-bdc": 2, fabric: 3 },
      note: "Consumption-priced platforms carry more exposure to a pricing change than fixed-commercial ones.",
      shifts: {
        cost: "Consumption-priced platforms carry materially more exposure under this workload profile.",
        recommendation: "Two alternatives drop far enough to leave the shortlist in practice.",
      },
    },
    {
      id: "key-vendor-exits",
      label: "A key implementation partner exits the market",
      effects: { "sap-bdc": 3, fabric: 3, databricks: -4, snowflake: -4 },
      note: "Platforms with a broader delivery partner ecosystem absorb this better than those leaning on fewer specialists.",
      shifts: {
        risk: "Delivery risk concentrates on a smaller pool of specialists.",
        architecture: "Breadth of partner ecosystem becomes an architecture criterion, not a procurement one.",
      },
    },
  ],
  timeline: [
    {
      id: "jan",
      when: "January",
      title: "Decision made",
      body: "SAP Business Data Cloud selected, on a moderate lead over Databricks.",
    },
    {
      id: "mar",
      when: "March",
      title: "Vendor pricing changes",
      body: "A key vendor shifts to more consumption-based pricing. Cost exposure for two alternatives increases.",
    },
    {
      id: "jun",
      when: "June",
      title: "Regulation changes",
      body: "New data residency requirements raise the bar on governance across the shortlist.",
    },
    {
      id: "today",
      when: "Today",
      title: "Reassessed",
      body: "The same decision, reassessed against what actually changed. The original choice holds, now on stronger grounds.",
    },
  ],
};

export function computeScenarioScores(
  scenario: DecisionScenario,
  activeAssumptionIds: string[],
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const platform of scenario.platforms) {
    let score = platform.baseScore;
    for (const assumptionId of activeAssumptionIds) {
      const assumption = scenario.assumptions.find((candidate) => candidate.id === assumptionId);
      if (!assumption) continue;
      score += assumption.effects[platform.id] ?? 0;
    }
    scores[platform.id] = Math.max(0, Math.min(100, score));
  }
  return scores;
}

import type { DecisionSkillCategoryId } from "@/components/decision-skills/catalog";
import type { WizardState } from "./types";

/**
 * A small, deterministic mapping from the wizard's own inputs onto
 * Decision Skill categories — not a classification engine, not AI, not
 * a new scoring pass. Same input always produces the same categories,
 * consistent with everything else Donna decides. Reused, never
 * duplicated: this is the only place that knows how goals/constraints
 * map onto a Decision Skill, and it never touches scoring, evidence,
 * or the recommendation itself — see ResultPanel/OverviewTab.tsx for
 * the only place this is displayed.
 */
export function classifyDecisionSkills(state: WizardState): DecisionSkillCategoryId[] {
  const ids = new Set<DecisionSkillCategoryId>();
  const goals = state.goals.goals;

  if (goals.includes("modernization") || goals.includes("innovation")) ids.add("technology-strategy");
  if (goals.includes("planning")) ids.add("transformation");
  if (goals.includes("cost-reduction")) ids.add("investment");
  if (goals.includes("governance") || goals.includes("compliance")) ids.add("risk");
  if (goals.includes("business-ai") || goals.includes("data-products")) ids.add("ai-data");

  if (state.constraints.preferredVendor && state.constraints.preferredVendor !== "no-preference") {
    ids.add("vendor");
  }
  if (state.constraints.preferredCloud && state.constraints.preferredCloud !== "no-preference") {
    ids.add("vendor");
  }

  if (state.constraints.riskAppetite === "low") ids.add("risk");
  if (state.constraints.timeline === "aggressive") ids.add("prioritization");

  if (ids.size === 0) ids.add("technology-strategy");

  return Array.from(ids).slice(0, 3);
}

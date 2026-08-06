/**
 * Deterministic mock decision logic for the HOMEPAGE Donna demo only.
 *
 * This is deliberately small, local, and separate from the real decision
 * engine in components/donna-ai/ (Sprint 3's Donna Score v2 — ten scoring
 * dimensions, a 10-platform curated catalog, weighted evidence). Nothing
 * here imports from or is imported by that module, and nothing here should
 * ever be mistaken for it: nothing in this file is AI, calls a model, or
 * reflects live market data. It is a curated, hardcoded mapping from a
 * few keyword signals in the homepage demo's free-text input to a small,
 * illustrative vendor shortlist — written so that changing the input
 * changes the output, which the previous version of this demo did not do.
 *
 * If the full Donna AI experience (/donna-ai) ever needs this same logic,
 * it should use the real engine in components/donna-ai/, not this file.
 */

export type DemoTrait =
  | "sap-native"
  | "multi-cloud"
  | "ai-ready"
  | "cost-efficient"
  | "governed"
  | "microsoft-aligned";

interface DemoVendor {
  name: string;
  tagline: string;
  traits: DemoTrait[];
}

/** Intentionally the same four platforms already named in this demo's
 * example questions — not a re-implementation of the real 10-platform
 * Sprint 3 catalog. */
const DEMO_VENDORS: DemoVendor[] = [
  { name: "SAP Business Data Cloud", tagline: "Governed SAP-native data foundation", traits: ["sap-native", "governed"] },
  { name: "Snowflake", tagline: "Multi-cloud data platform", traits: ["multi-cloud", "cost-efficient"] },
  { name: "Databricks", tagline: "Unified lakehouse for data and AI", traits: ["ai-ready", "multi-cloud"] },
  { name: "Microsoft Fabric", tagline: "Native Microsoft analytics stack", traits: ["microsoft-aligned", "ai-ready"] },
];

interface DemoProfile {
  id: string;
  /** Keywords checked against the lowercased input. First match wins on
   * total hit count — see selectProfile(). */
  triggers: string[];
  goal: string;
  capability: string;
  solutionPattern: string;
  technologyPattern: string;
  /** How much each trait matters for this goal — drives vendor ranking. */
  traitWeights: Partial<Record<DemoTrait, number>>;
  risks: [string, string];
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "sap-modernization",
    triggers: ["sap", "s/4hana", "s4hana", "bw", "datasphere", "ecc"],
    goal: "Modernize the SAP data and analytics landscape",
    capability: "SAP-native governed data foundation",
    solutionPattern: "Centralized governed data foundation",
    technologyPattern: "SAP-native data products with semantic governance",
    traitWeights: { "sap-native": 3, governed: 2, "ai-ready": 1 },
    risks: [
      "Commercial model and capacity planning require validation",
      "Non-SAP workloads may need complementary platform services",
    ],
  },
  {
    id: "multi-cloud",
    triggers: ["multi-cloud", "multicloud", "vendor-neutral", "vendor neutral", "snowflake", "data cloud"],
    goal: "Build a vendor-neutral, multi-cloud data platform",
    capability: "Multi-cloud data sharing and elasticity",
    solutionPattern: "Federated cloud data platform",
    technologyPattern: "Cloud data warehouse with native cross-cloud sharing",
    traitWeights: { "multi-cloud": 3, "cost-efficient": 2, governed: 1 },
    risks: [
      "Consumption-based pricing needs active cost governance",
      "Cross-cloud egress costs require early architecture review",
    ],
  },
  {
    id: "ai-lakehouse",
    triggers: ["ai", "machine learning", "ml ", "lakehouse", "databricks", "data science", "genai", "generative ai"],
    goal: "Scale AI and machine learning workloads",
    capability: "Unified lakehouse for data and AI",
    solutionPattern: "Unified lakehouse architecture",
    technologyPattern: "Lakehouse with integrated ML pipelines",
    traitWeights: { "ai-ready": 3, "multi-cloud": 2, "cost-efficient": 1 },
    risks: [
      "ML governance and model lifecycle maturity should be assessed",
      "Skills investment needed for lakehouse-native tooling",
    ],
  },
  {
    id: "microsoft-stack",
    triggers: ["fabric", "power bi", "microsoft", "azure"],
    goal: "Consolidate analytics on the Microsoft ecosystem",
    capability: "Native Microsoft ecosystem integration",
    solutionPattern: "Native Microsoft analytics stack",
    technologyPattern: "Fabric-integrated semantic layer with Power BI",
    traitWeights: { "microsoft-aligned": 3, "ai-ready": 1, "cost-efficient": 1 },
    risks: [
      "Capacity-based pricing needs workload sizing before commit",
      "Depth of non-Microsoft integrations should be validated",
    ],
  },
  {
    id: "cost-reduction",
    triggers: ["cost", "budget", "tco", "reduce spend", "cheaper", "expensive"],
    goal: "Reduce total cost of ownership",
    capability: "Cost-efficient, consumption-based platform model",
    solutionPattern: "Consumption-optimized platform",
    technologyPattern: "Elastic compute with workload isolation",
    traitWeights: { "cost-efficient": 3, "multi-cloud": 1 },
    risks: [
      "Lowest list price is not always lowest total cost — model realistic usage",
      "Migration cost can offset short-term savings in year one",
    ],
  },
  {
    id: "governance",
    triggers: ["governance", "compliance", "security", "regulat", "risk management"],
    goal: "Strengthen data governance and compliance",
    capability: "Enterprise-grade governance and security",
    solutionPattern: "Centralized governed data foundation",
    technologyPattern: "Governed data products with policy-based access",
    traitWeights: { governed: 3, "sap-native": 1 },
    risks: [
      "Governance tooling maturity varies by deployment region",
      "Policy rollout typically needs a dedicated stewardship track",
    ],
  },
];

/** Used only when no trigger keyword matches — an honest, clearly-labeled
 * generic baseline rather than silently reusing any one vendor as a
 * default winner. Trait weights are intentionally flat/balanced. */
const FALLBACK_PROFILE: DemoProfile = {
  id: "general",
  triggers: [],
  goal: "General enterprise data platform modernization",
  capability: "Balanced fit across governance, scale and cost",
  solutionPattern: "Balanced enterprise data platform",
  technologyPattern: "General-purpose cloud data platform",
  // All six traits weighted equally on purpose: every DEMO_VENDORS entry
  // holds exactly two traits, so an equal-weight fallback scores every
  // vendor identically (verified: all four tie at the same score) rather
  // than silently favoring whichever vendors happen to hold the traits
  // that were weighted. Leaving any trait at 0 here would reintroduce a
  // hidden bias in the exact case this fallback exists to be neutral for.
  traitWeights: {
    "sap-native": 1,
    "multi-cloud": 1,
    "ai-ready": 1,
    "cost-efficient": 1,
    governed: 1,
    "microsoft-aligned": 1,
  },
  risks: [
    "No specific signal was detected in your input — this is a generic baseline, not a tailored fit",
    "Describe your current systems and goals for a more specific illustrative result",
  ],
};

function selectProfile(input: string): { profile: DemoProfile; matchedTriggers: string[] } {
  const normalized = input.toLowerCase();

  let best: DemoProfile | null = null;
  let bestHits: string[] = [];

  for (const profile of DEMO_PROFILES) {
    const hits = profile.triggers.filter((trigger) => normalized.includes(trigger));
    if (hits.length > bestHits.length) {
      best = profile;
      bestHits = hits;
    }
  }

  if (!best || bestHits.length === 0) {
    return { profile: FALLBACK_PROFILE, matchedTriggers: [] };
  }

  return { profile: best, matchedTriggers: bestHits };
}

function scoreVendor(vendor: DemoVendor, weights: Partial<Record<DemoTrait, number>>): number {
  const matched = vendor.traits.reduce((sum, trait) => sum + (weights[trait] ?? 0), 0);
  const maxPossible = Object.values(weights).reduce((sum, w) => sum + (w ?? 0), 0) || 1;
  // 55-96 range: never a suspiciously round 100%, never near-zero for a
  // curated shortlist entry — mirrors the illustrative, non-precise nature
  // of the real Donna Score's maturity-band-derived scoring.
  const ratio = matched / maxPossible;
  return Math.round(55 + ratio * 41);
}

export interface DemoReasoningChain {
  goal: string;
  capability: string;
  solutionPattern: string;
  technologyPattern: string;
}

export interface DemoVendorResult {
  name: string;
  tagline: string;
  score: number;
}

export interface DemoDecisionResult {
  reasoningChain: DemoReasoningChain;
  primary: DemoVendorResult;
  alternatives: [DemoVendorResult, DemoVendorResult];
  rationale: string;
  risks: [string, string];
  confidenceExplanation: string;
}

/**
 * Pure function: same input always produces the same output. This is the
 * entire contract this demo relies on to be honest about being
 * deterministic and non-AI.
 */
export function deriveDemoRecommendation(rawInput: string): DemoDecisionResult {
  const { profile, matchedTriggers } = selectProfile(rawInput);

  const ranked = DEMO_VENDORS.map((vendor) => ({
    name: vendor.name,
    tagline: vendor.tagline,
    score: scoreVendor(vendor, profile.traitWeights),
  })).sort((a, b) => b.score - a.score);

  const [primary, altA, altB] = ranked as [DemoVendorResult, DemoVendorResult, DemoVendorResult];

  const confidenceExplanation =
    matchedTriggers.length === 0
      ? "Low signal: no specific keyword was recognized in your input, so this shows a balanced illustrative baseline rather than a tailored shortlist."
      : matchedTriggers.length === 1
        ? `Moderate signal: matched one specific signal ("${matchedTriggers[0]}") in your input.`
        : `Higher signal: matched ${matchedTriggers.length} specific signals (${matchedTriggers.map((t) => `"${t}"`).join(", ")}) in your input.`;

  const rationale = `Based on the goal "${profile.goal.toLowerCase()}", ${primary.name} is the top illustrative fit for the "${profile.capability.toLowerCase()}" capability under the "${profile.solutionPattern}" solution pattern.`;

  return {
    reasoningChain: {
      goal: profile.goal,
      capability: profile.capability,
      solutionPattern: profile.solutionPattern,
      technologyPattern: profile.technologyPattern,
    },
    primary,
    alternatives: [altA, altB],
    rationale,
    risks: profile.risks,
    confidenceExplanation,
  };
}

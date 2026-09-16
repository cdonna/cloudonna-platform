/**
 * Decision Skills are intelligent templates on top of the existing
 * Donna Score engine, not separate engines — see
 * donna-ai/decision-skills.ts for the (deliberately small,
 * deterministic) classifier that maps a real decision onto these
 * categories. English-only for now, same precedent as
 * vendor-intelligence/catalog.ts: a structured content catalog, not UI
 * chrome, so it isn't threaded through the five-locale dictionary.
 */
export type DecisionSkillCategoryId =
  | "technology-strategy"
  | "investment"
  | "vendor"
  | "transformation"
  | "risk"
  | "prioritization"
  | "ai-data"
  | "operating-model";

export interface DecisionSkillCategory {
  id: DecisionSkillCategoryId;
  label: string;
  description: string;
  examples: string[];
}

export const DECISION_SKILL_CATEGORIES: DecisionSkillCategory[] = [
  {
    id: "technology-strategy",
    label: "Technology Strategy",
    description: "Choosing the platforms and architecture your technology roadmap will run on for years.",
    examples: [
      "Platform selection",
      "Cloud strategy",
      "Architecture modernization",
      "Data platform strategy",
      "AI platform strategy",
      "Build versus buy",
      "Standardize versus customize",
    ],
  },
  {
    id: "investment",
    label: "Investment Decisions",
    description: "Committing budget to the initiatives and vendors most likely to pay off.",
    examples: [
      "Technology investment",
      "Business case evaluation",
      "Transformation funding",
      "Initiative prioritization",
      "Portfolio allocation",
      "Value versus risk",
    ],
  },
  {
    id: "vendor",
    label: "Vendor Decisions",
    description: "Choosing who you work with, not just what you buy.",
    examples: [
      "Vendor selection",
      "RFP evaluation",
      "Strategic partner comparison",
      "Contract renewal",
      "Vendor consolidation",
      "Single vendor versus multi vendor",
    ],
  },
  {
    id: "transformation",
    label: "Transformation Decisions",
    description: "Deciding how deep a change should go, and how to get there.",
    examples: [
      "Modernize versus replace",
      "Migration strategy",
      "Transformation sequencing",
      "Operating model change",
      "Centralize versus decentralize",
    ],
  },
  {
    id: "risk",
    label: "Risk Decisions",
    description: "Weighing what could go wrong against what the decision is worth.",
    examples: [
      "Execution risk",
      "Vendor concentration",
      "Security risk",
      "Data sovereignty",
      "Regulatory constraints",
      "Technology obsolescence",
      "Lock in risk",
    ],
  },
  {
    id: "prioritization",
    label: "Executive Prioritization",
    description: "Deciding what happens first when everything can't.",
    examples: [
      "What should happen first",
      "Budget allocation",
      "Resource prioritization",
      "Roadmap sequencing",
      "Quick wins versus strategic foundation",
    ],
  },
  {
    id: "ai-data",
    label: "AI and Data Decisions",
    description: "Structuring how AI and data initiatives get chosen and governed.",
    examples: [
      "AI use case prioritization",
      "AI governance",
      "Data strategy",
      "Data product prioritization",
      "AI platform selection",
      "Enterprise AI operating model",
      "Model strategy",
      "Data monetization",
    ],
  },
  {
    id: "operating-model",
    label: "Operating Model Decisions",
    description: "Deciding how the organization itself should be structured to deliver.",
    examples: [
      "Insource versus outsource",
      "Shared services",
      "Center of excellence",
      "Federated versus centralized teams",
      "Partner ecosystem",
      "Ownership models",
    ],
  },
];

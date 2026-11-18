/**
 * A documented, deterministic mapping from the Evidence Graph's
 * vendor-neutral capability taxonomy (brief §25/§26) to the Decision
 * Engine's ten existing ScoreDimensionKey criteria (scoring/types.ts).
 * This is the one place that answers "if this capability's evidence
 * changes, which scored criterion does that affect" — needed for
 * materiality (brief §39: "high-weight criterion evidence changes")
 * and for showing a claim's relevance inside the Decision Command
 * Center. Never the other direction: scoring/engine.ts does not read
 * this file, and a capability claim never sets a score directly
 * (brief §23).
 */
import type { ScoreDimensionKey } from "../../scoring/types";
import type { CapabilityCategoryKey } from "./types";

export const CAPABILITY_TO_CRITERION: Record<CapabilityCategoryKey, ScoreDimensionKey> = {
  architecture: "architecture",
  lakehouse: "architecture",
  data_warehouse: "architecture",
  streaming: "architecture",
  hybrid_multicloud: "architecture",
  open_ecosystem: "architecture",

  data_integration: "technology",
  data_engineering: "technology",
  observability: "technology",
  developer_experience: "technology",
  operations: "technology",

  governance: "governance",
  data_quality: "governance",
  master_data: "governance",

  security: "security",
  compliance: "security",
  data_sovereignty: "security",

  ai_ml: "aiReadiness",
  genai: "aiReadiness",
  agentic_ai: "aiReadiness",

  analytics: "business",
  planning: "business",
  semantic_layer: "business",

  cost_management: "cost",

  sap_integration: "ecosystem",
  microsoft_integration: "ecosystem",
  google_integration: "ecosystem",
  aws_integration: "ecosystem",
};

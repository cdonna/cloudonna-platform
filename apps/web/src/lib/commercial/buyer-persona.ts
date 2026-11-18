/**
 * Buyer persona (brief §6) — GTM reporting only. Never read by
 * anything under components/donna-ai/ (the Decision Engine) — see
 * the extended commercial-neutrality-firewall tests, which fail the
 * build if that ever changes.
 */
export const BUYER_PERSONAS = [
  "cio",
  "cto",
  "cdo",
  "chief_ai_officer",
  "cfo",
  "enterprise_architect",
  "head_of_data",
  "head_of_ai",
  "transformation_leader",
  "procurement",
  "technology_strategy",
  "other",
] as const;

export type BuyerPersona = (typeof BUYER_PERSONAS)[number];

export const BUYER_PERSONA_LABELS: Record<BuyerPersona, string> = {
  cio: "CIO",
  cto: "CTO",
  cdo: "CDO",
  chief_ai_officer: "Chief AI Officer",
  cfo: "CFO",
  enterprise_architect: "Enterprise Architect",
  head_of_data: "Head of Data",
  head_of_ai: "Head of AI",
  transformation_leader: "Transformation Leader",
  procurement: "Procurement",
  technology_strategy: "Technology Strategy",
  other: "Other",
};

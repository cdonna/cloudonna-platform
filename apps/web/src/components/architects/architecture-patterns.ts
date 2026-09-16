/**
 * Illustrative architecture patterns — English only, same precedent as
 * the ADR catalog in this same directory. Not diagrams: each pattern
 * answers the specific questions Home of Architects exists to answer,
 * in the executive's own language as much as the architect's.
 */
export interface ArchitecturePattern {
  id: string;
  name: string;
  purpose: string;
  problem: string;
  components: string[];
  tradeOffs: string[];
  whoShouldCare: string[];
  cfoNote: string;
  whatChangesIt: string;
}

export const ARCHITECTURE_PATTERNS: ArchitecturePattern[] = [
  {
    id: "sap-bdc-databricks",
    name: "SAP BDC + Databricks",
    purpose: "A governed SAP-native data core paired with open compute for advanced AI and data science.",
    problem: "SAP data stays governed and trustworthy while AI teams keep the flexibility a purely SAP-native platform doesn't offer.",
    components: ["SAP Business Data Cloud as the governed core", "Databricks for advanced AI, ML and data science workloads", "A defined data product boundary between the two"],
    tradeOffs: ["Two platforms to operate instead of one", "Requires clear ownership of the boundary between governed core and open compute"],
    whoShouldCare: ["CIO", "Chief AI Officer", "Enterprise Architect"],
    cfoNote: "Two platforms means two commercial relationships to manage, but each is scoped to what it's actually good at, rather than paying for capability you don't use.",
    whatChangesIt: "If AI ambitions stay modest, a single SAP-native platform may cover the need without Databricks at all.",
  },
  {
    id: "sap-bdc-snowflake",
    name: "SAP BDC + Snowflake",
    purpose: "A governed SAP-native core paired with Snowflake for company-wide governed analytics beyond SAP.",
    problem: "Many enterprises have significant non-SAP data that still needs the same governance discipline as the SAP core.",
    components: ["SAP Business Data Cloud as the governed SAP core", "Snowflake as the governed analytics layer for non-SAP data", "Data sharing between the two rather than duplication"],
    tradeOffs: ["Requires deliberate data sharing design to avoid duplicating the same data in both platforms", "Two governance models to keep aligned"],
    whoShouldCare: ["CIO", "Chief Data Officer", "Enterprise Architect"],
    cfoNote: "Avoids paying twice for governance capability that both platforms already provide, if the data sharing boundary is designed well.",
    whatChangesIt: "If most valuable data is SAP-native, the case for a second governed platform weakens considerably.",
  },
  {
    id: "clean-core-architecture",
    name: "Clean Core extension architecture",
    purpose: "Extend SAP S/4HANA functionality without custom code inside the core, keeping upgrades and cloud migration viable.",
    problem: "Years of custom ABAP code inside the SAP core make every upgrade slower and riskier, and block a path to SAP's cloud roadmap.",
    components: ["SAP BTP as the extension platform", "SAP Integration Suite for connecting extensions to the core", "A defined policy for what may and may not be customized inside the core"],
    tradeOffs: ["Extension development requires different skills than traditional ABAP customization", "Existing custom code needs a migration plan, not just a policy going forward"],
    whoShouldCare: ["CIO", "Enterprise Architect", "SAP Solution Architect"],
    cfoNote: "Slower, more expensive upgrades are a real recurring cost this pattern reduces, but the migration of existing customizations is itself a project to budget for.",
    whatChangesIt: "If an upcoming SAP upgrade or cloud migration isn't on the roadmap, the urgency of adopting this pattern now is lower.",
  },
  {
    id: "enterprise-ai-architecture",
    name: "Enterprise AI architecture",
    purpose: "A shared foundation for AI initiatives across the company, instead of each team building its own stack.",
    problem: "AI pilots multiply across departments on inconsistent platforms, making governance, reuse and scaling nearly impossible.",
    components: ["A shared, governed data foundation feeding every AI use case", "Central model governance and monitoring", "Federated access for teams to build within defined guardrails"],
    tradeOffs: ["More upfront coordination than letting teams build independently", "Guardrails need active enforcement, not just documentation"],
    whoShouldCare: ["Chief AI Officer", "CIO", "Chief Data Officer"],
    cfoNote: "The real cost comparison isn't this architecture against nothing, it's this architecture against N independent AI stacks that don't share investment.",
    whatChangesIt: "If AI activity is genuinely limited to one team with no near-term plan to expand, a shared foundation may be premature.",
  },
];

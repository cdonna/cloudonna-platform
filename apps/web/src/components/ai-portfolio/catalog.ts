export type AIUseCaseQuadrant = "quick-win" | "strategic-bet" | "foundation-investment" | "low-value-high-complexity";

export interface AIUseCase {
  id: string;
  name: string;
  description: string;
  businessValue: string;
  dataReadiness: string;
  risk: string;
  effort: string;
  timeToValue: string;
  strategicRelevance: string;
  governanceNote: string;
  quadrant: AIUseCaseQuadrant;
}

export const AI_USE_CASES: AIUseCase[] = [
  {
    id: "claims-automation",
    name: "Claims Automation",
    description: "Automates first-pass triage, document extraction and routing for insurance or warranty claims.",
    businessValue: "Cuts manual handling time on routine claims and frees adjusters for the complex, high-value cases.",
    dataReadiness: "High — claims systems already hold structured, labeled historical data.",
    risk: "Low to moderate — wrong routing is recoverable, but fraud-adjacent claims need a human check.",
    effort: "Low to moderate — bounded process, well-understood document types.",
    timeToValue: "Weeks to a few months for the first workflow.",
    strategicRelevance: "Operational efficiency, not a differentiator on its own.",
    governanceNote: "Needs a clear escalation path to a human reviewer, not full automation from day one.",
    quadrant: "quick-win",
  },
  {
    id: "sales-copilot",
    name: "Sales Copilot",
    description: "Drafts account summaries, next-best-action suggestions and follow-up content from CRM and call data.",
    businessValue: "Reduces prep time before customer calls and keeps CRM data more current, since the copilot depends on it.",
    dataReadiness: "High if Customer 360 is reasonably mature; low otherwise.",
    risk: "Low — suggestions, not autonomous actions; a rep stays in the loop.",
    effort: "Low to moderate — mostly an integration and prompt-quality problem, not a new data platform.",
    timeToValue: "Weeks for a pilot team.",
    strategicRelevance: "Improves sales velocity, moderate differentiation.",
    governanceNote: "Content the copilot drafts should be reviewed before it reaches a customer, especially early on.",
    quadrant: "quick-win",
  },
  {
    id: "customer-service-agent",
    name: "Customer Service Agent",
    description: "Handles first-line customer inquiries via chat, escalating to a human for anything outside a defined scope.",
    businessValue: "Reduces first-response time and contains a meaningful share of repetitive tickets.",
    dataReadiness: "Moderate to high — depends on how well existing help content and ticket history are structured.",
    risk: "Moderate — a wrong or overconfident answer damages trust faster than a slow one.",
    effort: "Moderate — needs a well-scoped escalation boundary and ongoing content maintenance.",
    timeToValue: "A few months for a narrow, well-scoped first domain.",
    strategicRelevance: "Customer experience and cost-to-serve, visible to the business.",
    governanceNote: "Scope must be explicit: what the agent is allowed to promise, and what it must always escalate.",
    quadrant: "quick-win",
  },
  {
    id: "fraud-detection",
    name: "Fraud Detection",
    description: "Real-time scoring of transactions or claims for fraud likelihood, feeding an investigation queue.",
    businessValue: "Directly reduces fraud losses; also reduces false-positive friction for legitimate customers when done well.",
    dataReadiness: "Requires a reliable, low-latency transaction feed and a labeled history of confirmed fraud cases.",
    risk: "High — false positives create customer friction, false negatives create direct loss and regulatory exposure.",
    effort: "High — real-time infrastructure, model monitoring, and a human investigation workflow all have to work together.",
    timeToValue: "Six months or more to a production-grade model with acceptable false-positive rates.",
    strategicRelevance: "High — directly protects revenue and regulatory standing.",
    governanceNote: "Needs explainability for investigators and regulators, not just a fraud score.",
    quadrant: "strategic-bet",
  },
  {
    id: "demand-forecasting",
    name: "Demand Forecasting",
    description: "Predicts product or service demand across regions and channels to inform inventory and staffing decisions.",
    businessValue: "Reduces both stockouts and excess inventory; the two failure modes usually offset each other in naive forecasting.",
    dataReadiness: "Requires integrated sales, inventory, and external signal data (seasonality, promotions, macro factors).",
    risk: "Moderate — a bad forecast is expensive but rarely catastrophic on its own.",
    effort: "High — cross-functional data integration is usually the hard part, not the model.",
    timeToValue: "Four to nine months, depending on how fragmented the source data is today.",
    strategicRelevance: "High where inventory or capacity is a major cost driver.",
    governanceNote: "Forecast confidence should be visible to planners, not presented as a single certain number.",
    quadrant: "strategic-bet",
  },
  {
    id: "predictive-maintenance",
    name: "Predictive Maintenance",
    description: "Predicts equipment failure ahead of time from sensor and maintenance history data.",
    businessValue: "Shifts maintenance from fixed schedules to condition-based intervention, reducing unplanned downtime.",
    dataReadiness: "Usually low at first — sensor coverage and a clean maintenance event history take time to build.",
    risk: "Moderate — a missed prediction costs downtime, but the fallback is the existing maintenance schedule.",
    effort: "High — mostly a data foundation investment before the model itself becomes the hard part.",
    timeToValue: "Six to eighteen months, heavily dependent on data foundation maturity.",
    strategicRelevance: "High in asset-intensive industries; low elsewhere.",
    governanceNote: "Requires clear ownership of the maintenance event history the model is validated against.",
    quadrant: "foundation-investment",
  },
  {
    id: "treasury-forecasting",
    name: "Treasury Forecasting",
    description: "Forecasts cash position and liquidity needs from transactional, banking, and forecast data.",
    businessValue: "Improves cash management decisions and reduces reliance on conservative cash buffers.",
    dataReadiness: "Requires clean, governed financial data across entities and currencies — often the real bottleneck.",
    risk: "High if treated as authoritative without human review — treasury decisions carry real financial consequences.",
    effort: "High — data governance and reconciliation work usually dominates the effort, not the forecasting model.",
    timeToValue: "Six months or more; the data foundation work happens before the model adds value.",
    strategicRelevance: "High in multi-entity or multi-currency organizations.",
    governanceNote: "Should support treasury decisions, not replace treasury judgment.",
    quadrant: "foundation-investment",
  },
  {
    id: "procurement-ai",
    name: "Procurement AI",
    description: "Analyzes spend, supplier performance and contract data to surface savings and risk opportunities.",
    businessValue: "Identifies consolidation and negotiation opportunities that are hard to see manually across many contracts.",
    dataReadiness: "Requires clean supplier, contract and spend data — commonly fragmented across systems and business units.",
    risk: "Moderate — recommendations, not autonomous purchasing decisions.",
    effort: "High — the data cleanup across contracts and suppliers is usually the majority of the work.",
    timeToValue: "Six to twelve months to a usable, trusted supplier and spend view.",
    strategicRelevance: "Moderate to high, depending on how large and fragmented procurement spend is.",
    governanceNote: "Contract interpretation should be flagged as AI interpretation, not treated as a verified legal reading.",
    quadrant: "foundation-investment",
  },
  {
    id: "pricing-optimization",
    name: "Pricing Optimization",
    description: "Dynamically adjusts pricing based on demand, competitor signals and customer segments.",
    businessValue: "Can lift margin, but only where the business already has the operational ability to change prices quickly and explain them.",
    dataReadiness: "Requires real-time competitor, demand and inventory signals most organizations do not yet capture reliably.",
    risk: "High — customer trust and regulatory scrutiny (price discrimination) are real exposure, not theoretical.",
    effort: "Very high — real-time data feeds, experimentation infrastructure and a pricing governance process all have to exist first.",
    timeToValue: "Twelve months or more for most organizations, given the infrastructure gap.",
    strategicRelevance: "Potentially high, but usually not achievable before the foundation work above.",
    governanceNote: "Without a pricing governance process already in place, this is usually the wrong first AI investment.",
    quadrant: "low-value-high-complexity",
  },
];

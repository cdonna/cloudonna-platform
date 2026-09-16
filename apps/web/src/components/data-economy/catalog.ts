export interface DataProduct {
  id: string;
  name: string;
  description: string;
  owner: string;
  consumers: string[];
  businessValue: string;
  aiRelevance: string;
  qualityRisk: string;
  decisionDependency: string;
}

export const DATA_PRODUCTS: DataProduct[] = [
  {
    id: "customer-360",
    name: "Customer 360",
    description: "A unified, trusted view of a customer across CRM, billing, support and product usage systems.",
    owner: "Sales operations, with data engineering as technical custodian",
    consumers: ["Sales", "Marketing", "Customer success", "Executive reporting", "Churn and propensity models"],
    businessValue:
      "Removes the manual reconciliation sales and success teams do today across CRM, billing and support tickets before every renewal or upsell conversation.",
    aiRelevance:
      "The single most reused input for churn prediction, next-best-action and lifetime value models. Model quality tracks this product's completeness almost directly.",
    qualityRisk:
      "Identity resolution across systems is imperfect. Duplicate or merged accounts can silently double count revenue in downstream reporting.",
    decisionDependency:
      "Any decision about a CDP, CRM replacement or churn model build vs buy should treat this product's maturity as a precondition, not an afterthought.",
  },
  {
    id: "predictive-maintenance-signals",
    name: "Predictive Maintenance Signals",
    description: "Sensor and machine telemetry from operational equipment, cleaned and aligned to a maintenance event history.",
    owner: "Plant operations, with a data platform team providing pipelines",
    consumers: ["Maintenance planning", "Reliability engineering", "Supply chain for spare parts", "AI use case: failure prediction"],
    businessValue:
      "Shifts maintenance from fixed schedules to condition based intervention, which is the difference between planned downtime and unplanned line stoppage.",
    aiRelevance:
      "Directly feeds failure prediction and remaining-useful-life models. Without a clean, timestamped maintenance event history to train against, those models cannot be validated.",
    qualityRisk:
      "Sensor drift and gaps during connectivity loss are common. A model trained on unflagged gaps will learn the gap pattern, not the failure pattern.",
    decisionDependency:
      "A build vs buy decision on a predictive maintenance platform should weigh whether this signal history exists at sufficient quality before comparing vendor AI capability.",
  },
];

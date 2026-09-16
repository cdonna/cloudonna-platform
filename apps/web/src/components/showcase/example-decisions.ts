/**
 * Illustrative example decisions for the public "show, don't tell"
 * showcase — English only, same precedent as vendor-intelligence/
 * catalog.ts, decision-skills/catalog.ts and architects/catalog.ts: a
 * structured content catalog, not UI chrome, so it isn't threaded
 * through the five-locale dictionary. These are fictional composites,
 * not real customer engagements — every place that renders one must
 * label it illustrative. No fabricated precision: financial and cost
 * language stays qualitative or ranged, never a fake exact figure.
 */
import type { DecisionSkillCategoryId } from "@/components/decision-skills/catalog";

export interface ShortlistOption {
  name: string;
  fitSummary: string;
}

export interface ChangeTrigger {
  option: string;
  condition: string;
}

export interface PersonaTakeaway {
  persona: ShowcasePersonaId;
  takeaway: string;
}

export type ShowcasePersonaId = "ceo" | "cfo" | "cio" | "cdo" | "cao" | "architect" | "business-leader";

export interface ExampleDecision {
  id: string;
  decisionSkills: DecisionSkillCategoryId[];
  title: string;
  context: string;
  question: string;
  priorities: string[];
  shortlist: ShortlistOption[];
  /** Must exactly match one ShortlistOption.name — used to highlight
   * that row, rather than fuzzy-matching against the recommendation
   * sentence below (which is prose, not guaranteed to start with the
   * option's exact name). */
  recommendedOptionName: string;
  recommendation: string;
  recommendationRationale: string;
  tradeOffs: string[];
  risks: string[];
  assumptions: string[];
  whatWouldChange: ChangeTrigger[];
  personaTakeaways: PersonaTakeaway[];
}

export const EXAMPLE_DECISIONS: ExampleDecision[] = [
  {
    id: "sap-bw-modernization",
    decisionSkills: ["technology-strategy", "transformation"],
    title: "SAP BW modernization",
    context:
      "A global manufacturer runs SAP BW on HANA alongside a patchwork of point to point extracts feeding regional reporting. Reporting is slow to change, data is duplicated across three systems, and AI initiatives have no governed foundation to build on.",
    question: "Modernize SAP BW into SAP Business Data Cloud, Databricks, Microsoft Fabric, or a hybrid architecture?",
    priorities: ["Preserve SAP-native reporting continuity", "Create a governed foundation for AI", "Reduce duplicate data flows", "Keep migration risk manageable"],
    shortlist: [
      { name: "SAP Business Data Cloud", fitSummary: "Strongest SAP-native continuity, governed foundation ships largely pre-built" },
      { name: "Databricks", fitSummary: "Strongest AI and data science flexibility, more integration work upfront" },
      { name: "Microsoft Fabric", fitSummary: "Best fit if Power BI and Microsoft 365 are already central to reporting" },
      { name: "Hybrid (SAP BDC + Databricks)", fitSummary: "SAP-native core with open compute for advanced AI workloads" },
    ],
    recommendedOptionName: "SAP Business Data Cloud",
    recommendation: "SAP Business Data Cloud, with Databricks as a companion platform for advanced AI workloads",
    recommendationRationale:
      "The governed SAP-native foundation directly resolves the duplication problem with the least new integration work, while a companion AI platform avoids boxing in future data science ambitions.",
    tradeOffs: [
      "Faster continuity with SAP BDC trades off some of the open ecosystem flexibility a pure Databricks or Fabric path would offer",
      "Running two platforms (SAP BDC plus Databricks) adds operational surface area versus a single-platform choice",
    ],
    risks: ["Migration sequencing risk if legacy extracts aren't decommissioned on schedule", "Skills gap for teams new to the governed data product model"],
    assumptions: ["Regional reporting requirements stay materially similar during migration", "No near-term divestiture or acquisition changes the SAP landscape"],
    whatWouldChange: [
      { option: "Databricks", condition: "AI and data science ambitions grow faster than the SAP-native roadmap can support" },
      { option: "Microsoft Fabric", condition: "Power BI and the Microsoft stack become the primary reporting surface company-wide" },
      { option: "Staying on SAP BW", condition: "The AI and governance case turns out to be weaker than expected once scoped in detail" },
    ],
    personaTakeaways: [
      { persona: "ceo", takeaway: "This removes a structural blocker to every AI initiative that depends on trustworthy company-wide data." },
      { persona: "cfo", takeaway: "One governed platform reduces the ongoing cost of maintaining duplicate extracts and manual reconciliation." },
      { persona: "cio", takeaway: "Lower execution risk than a full replatform, with a clear path to modern architecture." },
      { persona: "cdo", takeaway: "This is the foundation every future data product will sit on, so governance decisions made here compound." },
      { persona: "cao", takeaway: "AI workloads finally get a governed, trustworthy data layer instead of ad hoc extracts." },
      { persona: "architect", takeaway: "Reduces point to point integration debt while preserving SAP-native semantics teams already understand." },
      { persona: "business-leader", takeaway: "Reporting that takes weeks to change today should get materially faster once duplication is resolved." },
    ],
  },
  {
    id: "enterprise-ai-platform-strategy",
    decisionSkills: ["ai-data", "technology-strategy"],
    title: "Enterprise AI platform strategy",
    context:
      "A financial services firm has six AI pilots running on three different platforms, none of them production-grade. Leadership wants one enterprise AI strategy instead of pilots multiplying independently.",
    question: "Should AI run on a single central platform, a federated model, or a hybrid?",
    priorities: ["Governance and auditability for regulated use cases", "Speed for lower-risk experimentation", "Avoid re-platforming every pilot from scratch"],
    shortlist: [
      { name: "Fully centralized platform", fitSummary: "Strongest governance, slower for teams wanting to experiment quickly" },
      { name: "Fully federated model", fitSummary: "Fastest for individual teams, weakest for regulated use cases" },
      { name: "Hybrid: central governance, federated experimentation", fitSummary: "Balances regulatory need with team-level speed" },
    ],
    recommendedOptionName: "Hybrid: central governance, federated experimentation",
    recommendation: "Hybrid model: central governance and a shared data foundation, federated experimentation within guardrails",
    recommendationRationale:
      "Regulated use cases (credit, fraud) need centralized auditability that a fully federated model can't provide, but forcing every low-risk experiment through the same central process would slow the exact speed leadership also wants.",
    tradeOffs: ["More coordination overhead than a single fully centralized model", "Requires clear guardrails so federated teams don't drift from governance standards"],
    risks: ["Guardrails not being enforced consistently across federated teams", "Regulatory scrutiny increasing faster than governance maturity"],
    assumptions: ["Regulated use cases stay a minority of total AI initiatives, not the majority", "A central data foundation already exists or is being built in parallel"],
    whatWouldChange: [
      { option: "Fully centralized platform", condition: "Regulatory requirements tighten enough that federated experimentation becomes untenable" },
      { option: "Fully federated model", condition: "Regulated use cases turn out to be a small minority of total AI activity" },
    ],
    personaTakeaways: [
      { persona: "ceo", takeaway: "One strategy instead of six independent pilots is what turns AI spend into AI results." },
      { persona: "cfo", takeaway: "Avoids re-platforming pilots twice, which is where AI budgets usually get wasted." },
      { persona: "cio", takeaway: "Central governance closes the biggest audit exposure without freezing every team's roadmap." },
      { persona: "cdo", takeaway: "A shared data foundation only works if governance is centralized while access stays federated." },
      { persona: "cao", takeaway: "This is the difference between six AI experiments and one AI capability." },
      { persona: "architect", takeaway: "Guardrails need to be enforced in the platform, not just written in a policy document." },
      { persona: "business-leader", takeaway: "Teams keep the ability to move fast on lower-risk ideas without waiting on a central queue." },
    ],
  },
  {
    id: "databricks-snowflake-fabric",
    decisionSkills: ["technology-strategy", "vendor"],
    title: "Databricks versus Snowflake versus Microsoft Fabric",
    context: "A retailer needs one analytics and AI platform for its next five years, replacing a legacy on-premise warehouse.",
    question: "Which platform best fits governed analytics plus growing AI ambitions?",
    priorities: ["Multi-cloud flexibility", "AI and machine learning maturity", "Cost predictability at scale", "Time to first value"],
    shortlist: [
      { name: "Databricks", fitSummary: "Strongest for AI and machine learning maturity, more setup complexity" },
      { name: "Snowflake", fitSummary: "Strongest for governed, predictable analytics; AI capability growing but younger" },
      { name: "Microsoft Fabric", fitSummary: "Fastest time to value if Microsoft is already the default stack" },
    ],
    recommendedOptionName: "Databricks",
    recommendation: "Databricks",
    recommendationRationale:
      "AI and machine learning maturity was the deciding priority, and the retailer's roadmap leans heavily on demand forecasting and personalization use cases that benefit most from that maturity.",
    tradeOffs: ["Higher initial setup complexity than Fabric", "Requires more specialized skills than a fully managed warehouse-first platform"],
    risks: ["Skills availability for Databricks-native engineering", "Cost governance discipline needed for consumption-based pricing"],
    assumptions: ["AI and machine learning use cases remain the primary growth driver, not just reporting", "Multi-cloud flexibility stays a real requirement, not just a preference"],
    whatWouldChange: [
      { option: "Snowflake", condition: "Governed, predictable analytics becomes more important than AI maturity" },
      { option: "Microsoft Fabric", condition: "The organization consolidates further onto the Microsoft stack" },
    ],
    personaTakeaways: [
      { persona: "ceo", takeaway: "This platform choice determines how fast AI-driven personalization can actually ship." },
      { persona: "cfo", takeaway: "Consumption pricing needs active governance, or costs can grow with usage in ways that are hard to predict." },
      { persona: "cio", takeaway: "Higher setup complexity today, but the strongest platform fit for where the roadmap is headed." },
      { persona: "cdo", takeaway: "Strongest option for the AI and ML data science tooling the team already wants to use." },
      { persona: "cao", takeaway: "This is the platform where the demand forecasting and personalization roadmap will actually run." },
      { persona: "architect", takeaway: "Multi-cloud flexibility is preserved without locking into a single hyperscaler's native stack." },
      { persona: "business-leader", takeaway: "Personalization and forecasting initiatives get the platform best suited to deliver them." },
    ],
  },
  {
    id: "build-vs-buy-enterprise-ai",
    decisionSkills: ["investment", "ai-data"],
    title: "Build versus buy for enterprise AI",
    context: "A logistics company needs a customer service AI capability and is deciding between building on foundation models directly or buying a specialized vendor platform.",
    question: "Build a custom AI capability, or buy a specialized platform?",
    priorities: ["Speed to a working capability", "Differentiation versus commodity capability", "Total cost over three years", "Ongoing maintenance burden"],
    shortlist: [
      { name: "Build on foundation models", fitSummary: "Maximum differentiation and control, slowest to a production capability" },
      { name: "Buy a specialized platform", fitSummary: "Fastest to production, less differentiation versus competitors using the same platform" },
    ],
    recommendedOptionName: "Buy a specialized platform",
    recommendation: "Buy a specialized platform for the initial capability, revisit build once the use case is proven",
    recommendationRationale:
      "Customer service AI is not this company's core differentiator. Buying gets a working capability to market fastest, and the build option can be reconsidered later if the use case proves valuable enough to justify the investment.",
    tradeOffs: ["Less differentiation versus competitors on the same vendor platform", "Some vendor dependency until a build decision is revisited"],
    risks: ["Vendor platform limitations discovered only after deeper implementation", "Switching cost if a build decision is made later"],
    assumptions: ["Customer service AI is not a core competitive differentiator for this company", "The vendor platform can integrate with existing customer data within the required timeline"],
    whatWouldChange: [
      { option: "Build on foundation models", condition: "The capability proves valuable enough to justify becoming a genuine differentiator" },
      { option: "A different vendor platform", condition: "Integration limitations with existing customer data prove more severe than expected" },
    ],
    personaTakeaways: [
      { persona: "ceo", takeaway: "Fastest path to a working capability, with the option to invest further once value is proven." },
      { persona: "cfo", takeaway: "Lower upfront investment and a clearer near-term cost than an open-ended build." },
      { persona: "cio", takeaway: "Vendor dependency is real but bounded, and revisited once the use case is validated." },
      { persona: "cdo", takeaway: "Integration with existing customer data is the main technical risk to validate early." },
      { persona: "cao", takeaway: "Buying now doesn't close the door on building later if the capability proves valuable." },
      { persona: "architect", takeaway: "Keep integration points loosely coupled so a future build decision doesn't require a rewrite." },
      { persona: "business-leader", takeaway: "Customer service gets a working AI capability sooner rather than waiting on a long build." },
    ],
  },
  {
    id: "centralized-vs-federated-data-platform",
    decisionSkills: ["operating-model", "transformation"],
    title: "Centralized versus federated data platform",
    context: "A multi-division industrial group has five business units, each historically running its own data infrastructure with little consistency.",
    question: "Should data infrastructure become fully centralized, stay federated, or move to a data mesh model?",
    priorities: ["Consistency and governance across divisions", "Speed for divisions with urgent local needs", "Cost efficiency at group level", "Respecting real differences between divisions"],
    shortlist: [
      { name: "Fully centralized platform", fitSummary: "Strongest consistency and cost efficiency, slowest for divisions with urgent local needs" },
      { name: "Fully federated (status quo)", fitSummary: "Fastest locally, weakest consistency and highest total group cost" },
      { name: "Data mesh: federated ownership, shared platform standards", fitSummary: "Balances division autonomy with group-level consistency" },
    ],
    recommendedOptionName: "Data mesh: federated ownership, shared platform standards",
    recommendation: "Data mesh model: shared platform standards and governance, federated ownership of data products by division",
    recommendationRationale:
      "The divisions have genuinely different data needs that a fully centralized model would slow down, but the current fully federated approach has produced real duplication and inconsistency. A shared-standards model addresses both.",
    tradeOffs: ["Requires more upfront investment in shared standards than either extreme", "Federated ownership needs strong cross-division governance discipline to avoid drifting back toward the status quo"],
    risks: ["Divisions reverting to fully independent practices without sustained governance", "Shared standards becoming a bottleneck if not designed with division input"],
    assumptions: ["Divisions are willing to adopt shared standards in exchange for keeping local ownership", "Group leadership will sustain governance investment beyond the initial rollout"],
    whatWouldChange: [
      { option: "Fully centralized platform", condition: "Divisions prove unable to sustain federated governance discipline over time" },
      { option: "Fully federated (status quo)", condition: "Shared standards turn out to slow divisions down more than expected" },
    ],
    personaTakeaways: [
      { persona: "ceo", takeaway: "This resolves years of division-level inconsistency without forcing a slow, centralized rebuild." },
      { persona: "cfo", takeaway: "Reduces group-level duplication cost while preserving the local investments divisions have already made." },
      { persona: "cio", takeaway: "Shared standards reduce integration debt without a disruptive full replatform." },
      { persona: "cdo", takeaway: "Federated ownership only works if data product standards are enforced, not just recommended." },
      { persona: "cao", takeaway: "A consistent data foundation across divisions is what makes group-wide AI use cases possible at all." },
      { persona: "architect", takeaway: "Shared platform standards need to be designed with division architects, not imposed on them." },
      { persona: "business-leader", takeaway: "Divisions keep control of their own priorities while gaining consistency where it actually matters." },
    ],
  },
  {
    id: "single-hyperscaler-vs-multi-cloud",
    decisionSkills: ["risk", "technology-strategy"],
    title: "Single hyperscaler versus multi cloud",
    context:
      "A pharmaceutical company runs nearly everything on one hyperscaler today. A new regulatory requirement raises the question of whether that concentration is now a liability.",
    question: "Stay single hyperscaler, or deliberately introduce a second cloud provider?",
    priorities: ["Reduce vendor concentration risk", "Avoid unnecessary operational complexity", "Maintain negotiating leverage", "Meet regulatory expectations on resilience"],
    shortlist: [
      { name: "Stay single hyperscaler", fitSummary: "Lowest operational complexity, highest concentration risk" },
      { name: "Introduce a second cloud for critical workloads only", fitSummary: "Targeted risk reduction without full multi-cloud overhead" },
      { name: "Full multi-cloud architecture", fitSummary: "Lowest concentration risk, highest ongoing operational cost" },
    ],
    recommendedOptionName: "Introduce a second cloud for critical workloads only",
    recommendation: "Introduce a second cloud provider, scoped to the specific workloads the new regulation actually concerns",
    recommendationRationale:
      "A full multi-cloud architecture would address a risk that, on closer inspection, only applies to a narrow set of regulated workloads. Scoping the second provider to those workloads gets the regulatory benefit without paying for full multi-cloud complexity everywhere.",
    tradeOffs: ["Two providers to operate, even if scoped narrowly, adds real operational surface area", "Negotiating leverage improves only partially versus a full multi-cloud commitment"],
    risks: ["Scope creep if the second provider's use expands without a deliberate decision", "Skills investment needed for a second cloud provider's operational model"],
    assumptions: ["The regulation's concentration concern is genuinely limited to the workloads identified today", "The primary hyperscaler relationship stays otherwise stable"],
    whatWouldChange: [
      { option: "Full multi-cloud architecture", condition: "Regulatory scope expands well beyond the workloads currently identified" },
      { option: "Stay single hyperscaler", condition: "The regulatory requirement is clarified or narrowed before implementation begins" },
    ],
    personaTakeaways: [
      { persona: "ceo", takeaway: "This addresses the regulatory exposure directly instead of over-rotating into full multi-cloud complexity." },
      { persona: "cfo", takeaway: "Contains the cost of risk reduction to the workloads that actually need it." },
      { persona: "cio", takeaway: "Bounded operational complexity versus a full second-provider commitment." },
      { persona: "cdo", takeaway: "Data residency and portability only need to be solved for the workloads actually in scope." },
      { persona: "cao", takeaway: "AI workloads outside the regulated scope keep running on the primary provider without disruption." },
      { persona: "architect", takeaway: "A scoped second provider is far easier to operate well than a full multi-cloud estate." },
      { persona: "business-leader", takeaway: "Most of the business sees no operational change at all." },
    ],
  },
  {
    id: "ai-use-case-prioritization",
    decisionSkills: ["prioritization", "ai-data"],
    title: "AI use case prioritization",
    context:
      "A telecommunications company has twelve candidate AI use cases proposed across departments, and a budget that realistically covers three to start.",
    question: "Which AI use cases should be funded first?",
    priorities: ["Business value if successful", "Data readiness today", "Implementation effort", "Time to first value"],
    shortlist: [
      { name: "Customer churn prediction", fitSummary: "High value, data already largely ready, moderate effort" },
      { name: "Network fault prediction", fitSummary: "High value, but data readiness is the weakest of the shortlist" },
      { name: "Customer service copilot", fitSummary: "Fast time to value, moderate business value" },
      { name: "Demand forecasting", fitSummary: "High value, high effort, longer time to first result" },
    ],
    recommendedOptionName: "Customer churn prediction",
    recommendation: "Fund customer churn prediction and customer service copilot first, sequence network fault prediction and demand forecasting behind them",
    recommendationRationale:
      "The two funded first both combine real business value with data that's actually ready today, which is what turns a use case into a working result instead of another stalled pilot. The other two are worth doing, but need more groundwork first.",
    tradeOffs: ["Network fault prediction has the highest long-term value on this list but is sequenced behind two lower-effort use cases", "Sequencing means some departments wait longer than they'd like"],
    risks: ["Data readiness for the deferred use cases doesn't improve on its own without a deliberate investment", "Departments whose use cases are deferred may lose momentum"],
    assumptions: ["Budget realistically supports two to three use cases at a time, not all twelve in parallel", "Data readiness for churn prediction and the copilot holds up under closer technical review"],
    whatWouldChange: [
      { option: "Network fault prediction", condition: "A parallel data quality investment closes its readiness gap faster than expected" },
      { option: "Demand forecasting", condition: "A near-term business event makes forecasting accuracy urgent rather than merely valuable" },
    ],
    personaTakeaways: [
      { persona: "ceo", takeaway: "Two working AI results beat four AI pilots that stall for lack of ready data." },
      { persona: "cfo", takeaway: "Sequencing avoids spending across twelve use cases at once and getting a working result from none of them." },
      { persona: "cio", takeaway: "Execution risk is lowest where data readiness is already highest, not where the idea is most exciting." },
      { persona: "cdo", takeaway: "This makes data readiness, not just business value, a first-class part of prioritization." },
      { persona: "cao", takeaway: "Sequencing by readiness is how a portfolio actually ships results instead of accumulating pilots." },
      { persona: "architect", takeaway: "The deferred use cases can be prepared architecturally in parallel, not left idle." },
      { persona: "business-leader", takeaway: "Departments with use cases deferred get a clear reason and a real path back onto the roadmap." },
    ],
  },
];

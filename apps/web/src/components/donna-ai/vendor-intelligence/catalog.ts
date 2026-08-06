import type { PlatformCategory, VendorPlatformProfile } from "./types";

export const CATEGORY_LABELS: Record<PlatformCategory, string> = {
  "data-platform": "Data platform",
  "hyperscale-cloud": "Hyperscale cloud",
  "operational-database": "Operational database",
  "enterprise-legacy": "Enterprise legacy",
  "decision-ops-intelligence": "Decision & ops intelligence",
};

const SOURCE_NOTES =
  "Curated summary based on general public vendor positioning. Not sourced from live market data, analyst subscriptions, or vendor certification. Maturity bands are qualitative editorial judgments, not benchmark results, market share, or live pricing. Directional and illustrative, not a procurement-grade evaluation.";

const LAST_REVIEWED = "2026-08-05";

export const VENDOR_CATALOG: VendorPlatformProfile[] = [
  {
    id: "sap-bdc",
    vendor: "SAP",
    productName: "Business Data Cloud",
    category: "data-platform",
    vendorCategory: "Governed Business Data Foundation",
    shortDescription:
      "Governed data product layer unifying SAP's transactional systems (S/4HANA, BW, Datasphere) into a managed analytical foundation.",
    executivePositioning:
      "The default choice when your business already runs on SAP and you want governed analytics without re-platforming your core.",
    idealCustomerProfile:
      "Mid-market to global enterprises with SAP S/4HANA or BW as their transactional backbone, prioritizing governed, audit-ready data over maximum architectural flexibility.",
    executiveSummary:
      "SAP Business Data Cloud is best understood as a continuity play: it extends deep governance and semantic modeling over an existing SAP estate rather than asking you to leave it. That makes it the strongest fit for SAP-centric organizations and a weak fit for anyone evaluating from a clean slate. The primary trade-off is commercial and architectural concentration in a single vendor.",

    idealUseCases: [
      "Modernizing analytics on top of SAP S/4HANA or BW without a disruptive platform switch",
      "Building a governed, semantic data foundation for finance and operations reporting",
      "Reducing duplicate data marts spun up around an SAP core",
    ],
    antiPatterns: [
      "Greenfield analytics selection with no existing SAP footprint",
      "Organizations prioritizing minimal vendor concentration above all else",
      "Teams needing full low-level infrastructure control outside a managed layer",
    ],
    typicalStrengths: [
      "Native alignment with SAP transactional data",
      "Strong governance and semantic business layer",
      "Reduces integration complexity for SAP-heavy landscapes",
    ],
    typicalWeaknesses: [
      "High commercial and architectural lock-in to SAP",
      "Less mature for non-SAP data sources",
      "Premium pricing tied to broader SAP licensing",
    ],
    migrationScenarios: [
      "Migrating from SAP BW on-premise to a governed cloud data foundation",
      "Consolidating scattered SAP ECC/S4 data marts into one semantic layer",
    ],

    architectureCharacteristics: [
      "Governed data products",
      "Built on SAP Datasphere",
      "Semantic business layer over transactional systems",
    ],
    cloudModel: "hybrid",
    deploymentModels: ["saas"],

    governance: "leading",
    security: "established",
    compliance: "established",
    aiCapabilities: "established",
    machineLearning: "developing",
    generativeAi: "developing",
    ecosystemStrength: "established",
    partnerNetwork: "leading",

    sapIntegration: "leading",
    erpIntegration: "established",
    crmIntegration: "developing",
    dataWarehouseIntegration: "leading",
    multiCloudSupport: "developing",
    lakehouseCapabilities: "developing",
    dataVirtualization: "established",
    dataSharing: "established",
    metadataManagement: "leading",
    masterDataManagement: "established",
    streaming: "developing",

    implementationComplexity: "medium",
    timeToValue: "1-3-months",
    vendorLockInRisk: "high",

    pricingModel: "Subscription bundled with SAP commercial agreements",
    costTier: "premium",
    costCharacteristics:
      "Cost is typically absorbed into broader SAP licensing rather than standing alone — favorable if you're already committed, harder to isolate and justify if you're not.",

    industryFit: ["manufacturing", "financial-services", "retail", "healthcare", "public-sector"],
    companySizeFit: ["mid-market", "enterprise", "global-enterprise"],
    integrationStrengths: ["SAP S/4HANA", "SAP BW", "SAP Datasphere", "Broader SAP ecosystem tools"],
    traits: ["sap-native", "governed-data", "modern-architecture", "enterprise-scale", "ai-ready"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
  {
    id: "snowflake",
    vendor: "Snowflake",
    productName: "Snowflake Data Cloud",
    category: "data-platform",
    vendorCategory: "Cloud-Agnostic Data Warehouse",
    shortDescription:
      "Cloud-agnostic data warehouse separating storage and compute, widely adopted for multi-cloud analytics and BI.",
    executivePositioning:
      "The low-friction default when you want strong analytics without betting on one hyperscaler.",
    idealCustomerProfile:
      "Organizations of any size running BI-heavy workloads across more than one cloud, or wanting the option to, without a large dedicated data engineering team.",
    executiveSummary:
      "Snowflake's core promise is operational simplicity paired with genuine cloud portability — it runs the same way on any major hyperscaler and asks little of your team to operate well. That makes it a strong default for BI-centric organizations. It is not the strongest choice for teams whose real workload is advanced ML engineering rather than analytics, and consumption costs need active governance to stay predictable.",

    idealUseCases: [
      "Multi-cloud or cloud-neutral analytics strategy",
      "BI-heavy reporting and dashboarding at scale",
      "Fast time-to-value without a large infrastructure team",
    ],
    antiPatterns: [
      "Deep custom ML/engineering-heavy workloads better served by a lakehouse",
      "Cost-constrained teams without consumption governance in place",
      "Organizations wanting one bundled, single-vendor stack",
    ],
    typicalStrengths: [
      "Strong cloud portability",
      "Simple operational model",
      "Mature ecosystem of BI/ETL integrations",
    ],
    typicalWeaknesses: [
      "Consumption costs can scale unpredictably without governance",
      "Less native depth for advanced ML/engineering than Databricks",
      "Feature-level lock-in despite data portability",
    ],
    migrationScenarios: [
      "Consolidating multiple cloud-specific warehouses into one cloud-agnostic platform",
      "Moving off an on-premise warehouse without picking a single hyperscaler dependency",
    ],

    architectureCharacteristics: [
      "Separated storage and compute",
      "Cloud-agnostic (runs on AWS, Azure, or GCP)",
      "SQL-first analytics engine",
    ],
    cloudModel: "multi-cloud",
    deploymentModels: ["saas"],

    governance: "established",
    security: "established",
    compliance: "established",
    aiCapabilities: "developing",
    machineLearning: "developing",
    generativeAi: "developing",
    ecosystemStrength: "leading",
    partnerNetwork: "leading",

    sapIntegration: "developing",
    erpIntegration: "developing",
    crmIntegration: "established",
    dataWarehouseIntegration: "leading",
    multiCloudSupport: "leading",
    lakehouseCapabilities: "established",
    dataVirtualization: "developing",
    dataSharing: "leading",
    metadataManagement: "developing",
    masterDataManagement: "emerging",
    streaming: "developing",

    implementationComplexity: "low",
    timeToValue: "weeks",
    vendorLockInRisk: "medium",

    pricingModel: "Consumption-based, per-credit compute plus storage",
    costTier: "mid",
    costCharacteristics:
      "Consumption-based pricing scales smoothly at moderate usage but can creep quickly without query and warehouse-sizing governance — cost predictability is a discipline, not a default.",

    industryFit: ["financial-services", "retail", "healthcare", "technology", "manufacturing"],
    companySizeFit: ["smb", "mid-market", "enterprise", "global-enterprise"],
    integrationStrengths: ["Multi-cloud (AWS/Azure/GCP)", "BI tools (Tableau, Power BI, Looker)", "ETL/ELT ecosystem (Fivetran, dbt)"],
    traits: ["multi-cloud", "modern-architecture", "cost-efficient", "ai-ready", "vendor-neutral"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
  {
    id: "databricks",
    vendor: "Databricks",
    productName: "Databricks Lakehouse Platform",
    category: "data-platform",
    vendorCategory: "AI-Native Lakehouse Platform",
    shortDescription:
      "Engineering-first lakehouse unifying data engineering, ML, and analytics on open data formats (Delta Lake).",
    executivePositioning:
      "The strongest choice when AI and ML are the actual workload, not an add-on to BI.",
    idealCustomerProfile:
      "Organizations with a real data engineering and data science practice, building AI/ML products rather than only consuming dashboards.",
    executiveSummary:
      "Databricks leads on AI/ML maturity and open-format data portability, which lowers long-term lock-in risk relative to closed warehouse formats. That strength is also its constraint: it rewards organizations with real engineering capacity and asks more of teams whose need is primarily BI reporting. Governance tooling (Unity Catalog) is maturing quickly but is newer than SAP's or the established warehouse players' governance layers.",

    idealUseCases: [
      "AI/ML-heavy workloads and active data science teams",
      "Wanting open-format data portability to reduce long-term lock-in",
      "Complex, engineering-driven data pipelines",
    ],
    antiPatterns: [
      "Primarily BI/reporting-only needs with limited engineering capacity",
      "Wanting a fully managed, low-ops experience",
      "Fast, minimal-setup analytics without dedicated data engineers",
    ],
    typicalStrengths: [
      "Open Delta Lake format reduces data lock-in",
      "Strong native ML/AI tooling",
      "Unifies engineering, analytics, and ML in one platform",
    ],
    typicalWeaknesses: [
      "Requires stronger internal data engineering skill",
      "Operational complexity higher than pure SaaS warehouses",
      "Cost scales with both usage and the headcount needed to run it well",
    ],
    migrationScenarios: [
      "Moving from a closed-format warehouse to an open lakehouse to reduce lock-in",
      "Consolidating separate BI, ML, and engineering platforms into one",
    ],

    architectureCharacteristics: ["Lakehouse (open Delta format)", "Unified batch/streaming/ML", "Spark-based compute engine"],
    cloudModel: "multi-cloud",
    deploymentModels: ["paas"],

    governance: "developing",
    security: "established",
    compliance: "established",
    aiCapabilities: "leading",
    machineLearning: "leading",
    generativeAi: "leading",
    ecosystemStrength: "established",
    partnerNetwork: "established",

    sapIntegration: "emerging",
    erpIntegration: "emerging",
    crmIntegration: "developing",
    dataWarehouseIntegration: "established",
    multiCloudSupport: "leading",
    lakehouseCapabilities: "leading",
    dataVirtualization: "developing",
    dataSharing: "established",
    metadataManagement: "established",
    masterDataManagement: "emerging",
    streaming: "established",

    implementationComplexity: "high",
    timeToValue: "3-6-months",
    vendorLockInRisk: "medium",

    pricingModel: "Consumption-based (DBU compute units) plus cloud infrastructure costs",
    costTier: "mid",
    costCharacteristics:
      "Total cost includes both platform consumption and the engineering headcount required to operate it well — the platform bill alone understates true cost of ownership.",

    industryFit: ["technology", "financial-services", "healthcare", "manufacturing", "retail"],
    companySizeFit: ["mid-market", "enterprise", "global-enterprise"],
    integrationStrengths: ["Multi-cloud (AWS/Azure/GCP)", "Open source ecosystem (Spark, MLflow, Delta)", "ML/AI tooling"],
    traits: ["multi-cloud", "modern-architecture", "ai-ready", "vendor-neutral"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
  {
    id: "ms-fabric",
    vendor: "Microsoft",
    productName: "Fabric",
    category: "data-platform",
    vendorCategory: "Unified Analytics Platform",
    shortDescription:
      "Unified analytics platform merging Power BI, Synapse, and Data Factory on a shared OneLake foundation.",
    executivePositioning:
      "The natural choice when Microsoft 365 and Azure are already the backbone of the business.",
    idealCustomerProfile:
      "Organizations already standardized on Microsoft 365 and Azure, wanting Power BI-native analytics without assembling a separate stack.",
    executiveSummary:
      "Fabric's value is almost entirely about reducing integration friction for organizations already committed to Microsoft — Power BI, Copilot, and Azure services connect natively rather than through third-party connectors. Outside that context, its differentiation narrows considerably, and OneLake's lakehouse capabilities are still maturing relative to Databricks. The commercial trade-off is deep, deliberate dependency on a single ecosystem.",

    idealUseCases: [
      "Already standardized on Microsoft 365/Azure",
      "Wanting Power BI-native analytics with less integration overhead",
      "Mixed BI plus light engineering workloads",
    ],
    antiPatterns: [
      "Non-Microsoft, multi-cloud-first organizations",
      "Heavy custom ML/engineering workloads better suited to a dedicated lakehouse",
      "Wanting to avoid Microsoft ecosystem dependency",
    ],
    typicalStrengths: [
      "Deep Power BI and Microsoft 365 integration",
      "Bundled commercial simplicity for Microsoft shops",
      "Fast time-to-value for existing Azure/Power BI users",
    ],
    typicalWeaknesses: [
      "High dependency on the Microsoft ecosystem",
      "Less mature than Databricks for advanced ML workloads",
      "OneLake still maturing relative to established lakehouse competitors",
    ],
    migrationScenarios: [
      "Consolidating standalone Power BI, Synapse, and Data Factory deployments into one",
      "Moving off a legacy on-premise Microsoft BI stack to a cloud-native equivalent",
    ],

    architectureCharacteristics: ["OneLake unified storage", "Merges Power BI, Synapse, and Data Factory", "SaaS-managed analytics"],
    cloudModel: "single-cloud",
    deploymentModels: ["saas"],

    governance: "established",
    security: "established",
    compliance: "established",
    aiCapabilities: "established",
    machineLearning: "developing",
    generativeAi: "established",
    ecosystemStrength: "leading",
    partnerNetwork: "leading",

    sapIntegration: "developing",
    erpIntegration: "developing",
    crmIntegration: "established",
    dataWarehouseIntegration: "established",
    multiCloudSupport: "emerging",
    lakehouseCapabilities: "developing",
    dataVirtualization: "developing",
    dataSharing: "developing",
    metadataManagement: "developing",
    masterDataManagement: "developing",
    streaming: "developing",

    implementationComplexity: "low",
    timeToValue: "weeks",
    vendorLockInRisk: "high",

    pricingModel: "Bundled into Microsoft 365/Azure commercial agreements, capacity-based",
    costTier: "mid",
    costCharacteristics:
      "Capacity-based pricing is easy to reason about for existing Microsoft customers, but bundling makes true incremental cost harder to isolate from broader Microsoft spend.",

    industryFit: ["financial-services", "retail", "healthcare", "manufacturing", "public-sector"],
    companySizeFit: ["smb", "mid-market", "enterprise", "global-enterprise"],
    integrationStrengths: ["Microsoft 365", "Power BI", "Azure services"],
    traits: ["azure-aligned", "modern-architecture", "enterprise-scale", "ai-ready"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
  {
    id: "oracle",
    vendor: "Oracle",
    productName: "Oracle Cloud Infrastructure / Autonomous Database",
    category: "enterprise-legacy",
    vendorCategory: "Enterprise Database & Applications Vendor",
    shortDescription:
      "Broad enterprise stack spanning database, cloud infrastructure, and applications — most relevant to organizations already on Oracle's database or ERP estate. Product naming spans multiple distinct offerings.",
    executivePositioning:
      "Rarely a new choice today — the relevant question is usually how to work with an existing Oracle estate, not whether to adopt one.",
    idealCustomerProfile:
      "Large, often regulated organizations with a substantial existing Oracle Database or Oracle ERP footprint that continuity, not modernization speed, is the priority for.",
    executiveSummary:
      "Oracle's real strength is deep maturity for mission-critical transactional workloads on its own database and applications — a genuine asset for organizations already committed. For a greenfield platform decision, the calculus is different: licensing practices have a well-known reputation for being aggressive, and the product naming spans several distinct offerings that need disambiguating before any serious evaluation.",

    idealUseCases: [
      "Existing large-scale Oracle Database or Oracle ERP footprint",
      "Mission-critical transactional workloads requiring Oracle-specific tuning",
      "Regulated industries with existing Oracle compliance investment",
    ],
    antiPatterns: [
      "Greenfield analytics or AI platform selection with no existing Oracle estate",
      "Prioritizing low commercial lock-in",
      "Wanting transparent, predictable licensing",
    ],
    typicalStrengths: [
      "Deep maturity for transactional, mission-critical database workloads",
      "Strong presence in regulated, legacy-heavy industries",
      "Autonomous Database reduces operational overhead for existing Oracle workloads",
    ],
    typicalWeaknesses: [
      "Product naming and packaging is broad and can be unclear without a specific use case",
      "Historically aggressive licensing and audit practices",
      "Weaker default positioning for modern analytics/AI-first use cases",
    ],
    migrationScenarios: [
      "Modernizing an on-premise Oracle Database estate to Autonomous Database rather than migrating away",
      "Extending an existing Oracle ERP investment with cloud infrastructure rather than replacing it",
    ],

    architectureCharacteristics: ["Relational database core", "Autonomous (self-tuning) database options", "Enterprise applications (ERP/HCM) suite"],
    cloudModel: "hybrid",
    deploymentModels: ["iaas", "managed-service"],

    governance: "established",
    security: "established",
    compliance: "established",
    aiCapabilities: "developing",
    machineLearning: "developing",
    generativeAi: "emerging",
    ecosystemStrength: "developing",
    partnerNetwork: "established",

    sapIntegration: "emerging",
    erpIntegration: "leading",
    crmIntegration: "developing",
    dataWarehouseIntegration: "established",
    multiCloudSupport: "developing",
    lakehouseCapabilities: "emerging",
    dataVirtualization: "developing",
    dataSharing: "emerging",
    metadataManagement: "developing",
    masterDataManagement: "established",
    streaming: "developing",

    implementationComplexity: "high",
    timeToValue: "3-6-months",
    vendorLockInRisk: "very-high",

    pricingModel: "Enterprise licensing, often audit-driven with core-based or subscription pricing",
    costTier: "enterprise-custom",
    costCharacteristics:
      "Licensing terms and audit exposure are frequently cited as a larger planning risk than the sticker price itself — commercial and legal review is warranted before commitment.",

    industryFit: ["financial-services", "healthcare", "public-sector", "manufacturing"],
    companySizeFit: ["enterprise", "global-enterprise"],
    integrationStrengths: ["Oracle Database", "Oracle ERP/HCM applications", "Existing Oracle-licensed estates"],
    traits: ["legacy-integration", "enterprise-scale"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
  {
    id: "aws",
    vendor: "Amazon Web Services",
    productName: "AWS (Redshift, EMR, SageMaker, and the broader platform)",
    category: "hyperscale-cloud",
    vendorCategory: "Hyperscale Cloud Infrastructure Provider",
    shortDescription:
      "The largest hyperscale cloud infrastructure provider — not a packaged data platform itself, but the foundation many are built on.",
    executivePositioning:
      "The choice for teams building a custom architecture, not buying a packaged product.",
    idealCustomerProfile:
      "Organizations with real cloud engineering capability who want to assemble a bespoke data/AI architecture from best-of-breed managed services rather than adopt one packaged platform.",
    executiveSummary:
      "AWS offers the broadest catalog of managed services and the largest ecosystem of any provider evaluated here, which is a genuine advantage for teams with the engineering capacity to assemble their own architecture. That same breadth is a liability for teams wanting a single packaged product — there is no one 'AWS data platform,' only components to integrate. Deep integration across those services increases operational lock-in gradually, even though the underlying data can in principle move.",

    idealUseCases: [
      "Building a custom data/AI architecture rather than buying a packaged platform",
      "Wanting the broadest managed-service catalog and ecosystem",
      "Workloads needing granular infrastructure control",
    ],
    antiPatterns: [
      "Wanting a single packaged analytics product with minimal assembly",
      "Limited in-house cloud engineering capability",
      "Fast, low-effort time-to-value without dedicated cloud expertise",
    ],
    typicalStrengths: [
      "Broadest managed-service catalog of any cloud provider",
      "Largest ecosystem and marketplace",
      "Strong economies of scale at high volume",
    ],
    typicalWeaknesses: [
      "Requires assembling multiple services rather than buying one product",
      "Complexity and cost management require dedicated expertise",
      "Deep integration increases operational lock-in over time",
    ],
    migrationScenarios: [
      "Re-platforming from on-premise infrastructure onto managed cloud services",
      "Consolidating multiple point solutions onto one cloud provider's managed-service catalog",
    ],

    architectureCharacteristics: ["Hyperscale IaaS/PaaS infrastructure", "Modular managed services (Redshift, EMR, SageMaker)", "Global multi-region footprint"],
    cloudModel: "single-cloud",
    deploymentModels: ["iaas", "paas"],

    governance: "established",
    security: "leading",
    compliance: "leading",
    aiCapabilities: "established",
    machineLearning: "leading",
    generativeAi: "established",
    ecosystemStrength: "leading",
    partnerNetwork: "leading",

    sapIntegration: "developing",
    erpIntegration: "emerging",
    crmIntegration: "emerging",
    dataWarehouseIntegration: "established",
    multiCloudSupport: "emerging",
    lakehouseCapabilities: "developing",
    dataVirtualization: "developing",
    dataSharing: "developing",
    metadataManagement: "developing",
    masterDataManagement: "emerging",
    streaming: "established",

    implementationComplexity: "high",
    timeToValue: "3-6-months",
    vendorLockInRisk: "medium",

    pricingModel: "Consumption-based across dozens of individual services",
    costTier: "mid",
    costCharacteristics:
      "Individually competitive service pricing can still add up to a large, complex bill across dozens of services without dedicated cost governance (FinOps) practice.",

    industryFit: ["technology", "financial-services", "retail", "healthcare", "manufacturing"],
    companySizeFit: ["smb", "mid-market", "enterprise", "global-enterprise"],
    integrationStrengths: ["Broadest third-party SaaS/marketplace ecosystem", "Custom architecture flexibility", "Global infrastructure footprint"],
    traits: ["hyperscale-infra", "aws-aligned", "ai-ready"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
  {
    id: "google-cloud",
    vendor: "Google Cloud",
    productName: "Google Cloud Platform (BigQuery and the broader platform)",
    category: "hyperscale-cloud",
    vendorCategory: "Hyperscale Cloud Infrastructure Provider",
    shortDescription:
      "Hyperscale cloud infrastructure with a differentiated serverless analytics engine (BigQuery) as its strongest data-specific offering.",
    executivePositioning:
      "The strongest choice when the workload is genuinely large-scale analytics and AI, not general-purpose infrastructure breadth.",
    idealCustomerProfile:
      "Organizations with large-scale analytics workloads and real AI/ML ambitions who value BigQuery's serverless simplicity and Google's AI tooling over the broadest possible service catalog.",
    executiveSummary:
      "Google Cloud's differentiation is concentrated and genuine rather than broad: BigQuery's serverless model and Vertex AI's tooling are strong, and pricing is generally more transparent than AWS's. What it does not offer is AWS or Azure's breadth of enterprise ecosystem and partner network, which raises adoption friction for organizations without existing GCP familiarity.",

    idealUseCases: [
      "Large-scale analytics workloads well-suited to BigQuery's serverless model",
      "Wanting simpler, more transparent pricing than AWS",
      "Strong data science/ML ambitions aligned to Google's AI tooling",
    ],
    antiPatterns: [
      "Wanting the broadest third-party ecosystem/marketplace (smaller than AWS/Azure)",
      "No existing GCP or BigQuery familiarity",
      "Requiring extensive enterprise application ecosystem depth",
    ],
    typicalStrengths: [
      "BigQuery is genuinely differentiated for large-scale serverless analytics",
      "Generally more transparent pricing than AWS",
      "Strong native AI/ML tooling (Vertex AI)",
    ],
    typicalWeaknesses: [
      "Smaller enterprise ecosystem and partner network than AWS or Azure",
      "Less common as an existing enterprise standard, raising adoption friction",
      "Narrower breadth of packaged enterprise services",
    ],
    migrationScenarios: [
      "Moving a large-scale analytical workload to BigQuery for its serverless cost/performance model",
      "Adopting Vertex AI alongside an existing warehouse to accelerate an ML initiative",
    ],

    architectureCharacteristics: ["Serverless analytics engine (BigQuery)", "Hyperscale IaaS/PaaS infrastructure", "Native AI/ML platform (Vertex AI)"],
    cloudModel: "single-cloud",
    deploymentModels: ["paas", "iaas"],

    governance: "developing",
    security: "established",
    compliance: "established",
    aiCapabilities: "leading",
    machineLearning: "leading",
    generativeAi: "leading",
    ecosystemStrength: "developing",
    partnerNetwork: "developing",

    sapIntegration: "emerging",
    erpIntegration: "emerging",
    crmIntegration: "emerging",
    dataWarehouseIntegration: "leading",
    multiCloudSupport: "emerging",
    lakehouseCapabilities: "developing",
    dataVirtualization: "developing",
    dataSharing: "developing",
    metadataManagement: "developing",
    masterDataManagement: "emerging",
    streaming: "established",

    implementationComplexity: "medium",
    timeToValue: "1-3-months",
    vendorLockInRisk: "medium",

    pricingModel: "Consumption-based, generally transparent per-query/storage pricing for BigQuery",
    costTier: "mid",
    costCharacteristics:
      "BigQuery's per-query pricing is generally easier to forecast than compute-cluster models, though on-demand query costs still need monitoring for ad hoc, unoptimized workloads.",

    industryFit: ["technology", "retail", "financial-services", "healthcare"],
    companySizeFit: ["smb", "mid-market", "enterprise", "global-enterprise"],
    integrationStrengths: ["BigQuery serverless analytics", "Vertex AI", "Google Workspace (for Workspace-standardized orgs)"],
    traits: ["gcp-aligned", "ai-ready", "vendor-neutral"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
  {
    id: "palantir",
    vendor: "Palantir",
    productName: "Palantir Foundry / AIP",
    category: "decision-ops-intelligence",
    vendorCategory: "Ontology-Based Decision Intelligence Platform",
    shortDescription:
      "Ontology-based data integration and operational decision platform, historically strongest in defense, government, and complex industrial operations.",
    executivePositioning:
      "Reserved for complex, high-stakes operational decisions — not a candidate for standard BI or reporting needs.",
    idealCustomerProfile:
      "Large organizations in defense, government, or complex industrial/healthcare operations needing deep integration across fragmented legacy systems and willing to fund a high-touch, consulting-heavy implementation.",
    executiveSummary:
      "Palantir's ontology-based approach to integrating fragmented operational data is proven in some of the most demanding environments in defense and government, and that heritage carries real security maturity. It is not designed to compete with standard analytics platforms on cost or speed — the delivery model is consulting-intensive by design, and applying it to a standard BI use case would be a significant mismatch of cost and complexity to need.",

    idealUseCases: [
      "Complex, high-stakes operational decision-making (defense, government, supply chain, healthcare operations)",
      "Deep cross-system data integration with an operational ontology layer",
      "Budget for a high-touch, consulting-heavy implementation",
    ],
    antiPatterns: [
      "Standard BI/reporting or general-purpose analytics needs",
      "Cost-sensitive or fast-time-to-value evaluations",
      "Wanting a self-service, low-touch platform",
    ],
    typicalStrengths: [
      "Deep operational data integration across fragmented legacy systems",
      "Proven in complex, high-stakes environments",
      "Strong ontology-based modeling of real-world operations",
    ],
    typicalWeaknesses: [
      "Very high cost and consulting-heavy delivery model",
      "Slower initial time-to-value",
      "Overkill for standard analytics or reporting use cases",
    ],
    migrationScenarios: [
      "Consolidating fragmented, siloed operational systems under one ontology layer for a large-scale operational transformation",
    ],

    architectureCharacteristics: ["Ontology-based data model", "Deep legacy system integration", "Operational decision workflows"],
    cloudModel: "hybrid",
    deploymentModels: ["managed-service"],

    governance: "established",
    security: "leading",
    compliance: "leading",
    aiCapabilities: "established",
    machineLearning: "established",
    generativeAi: "developing",
    ecosystemStrength: "developing",
    partnerNetwork: "developing",

    sapIntegration: "developing",
    erpIntegration: "developing",
    crmIntegration: "emerging",
    dataWarehouseIntegration: "developing",
    multiCloudSupport: "developing",
    lakehouseCapabilities: "emerging",
    dataVirtualization: "established",
    dataSharing: "developing",
    metadataManagement: "established",
    masterDataManagement: "established",
    streaming: "developing",

    implementationComplexity: "very-high",
    timeToValue: "6-plus-months",
    vendorLockInRisk: "very-high",

    pricingModel: "Enterprise contract plus significant implementation/consulting services",
    costTier: "enterprise-custom",
    costCharacteristics:
      "The platform license is only part of the cost — implementation and ongoing consulting services typically represent a substantial, recurring share of total spend.",

    industryFit: ["public-sector", "healthcare", "manufacturing", "financial-services"],
    companySizeFit: ["enterprise", "global-enterprise"],
    integrationStrengths: ["Complex legacy system integration", "Cross-domain operational data", "Government/defense-grade deployments"],
    traits: ["high-touch-enterprise", "enterprise-scale", "governed-data"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
  {
    id: "ibm",
    vendor: "IBM",
    productName: "IBM Cloud / Db2 / watsonx",
    category: "enterprise-legacy",
    vendorCategory: "Legacy Enterprise Technology Vendor",
    shortDescription:
      "Legacy enterprise technology vendor with particular strength in mainframe integration and established database systems — a fragmented modern portfolio without one clear flagship data platform.",
    executivePositioning:
      "Most relevant as a continuity option for an existing IBM/mainframe estate, not as a first choice for a modern greenfield platform.",
    idealCustomerProfile:
      "Large, often regulated organizations with an existing IBM mainframe or Db2 estate prioritizing integration continuity over adopting a new modern stack.",
    executiveSummary:
      "IBM's genuine strength is deep, decades-proven mainframe and legacy-system integration — a real asset for organizations that depend on it. Its modern data/AI portfolio (watsonx, Cloud Pak) is real but fragmented across several products without one obvious flagship, which makes it a harder recommendation for a clean, modern platform decision than for an integration-continuity decision.",

    idealUseCases: [
      "Existing IBM mainframe or Db2 estate needing integration continuity",
      "Highly regulated legacy environments prioritizing continuity over modernization speed",
      "Hybrid mainframe-to-cloud integration needs",
    ],
    antiPatterns: [
      "Greenfield, modern analytics/AI platform selection",
      "No existing IBM infrastructure",
      "Wanting a single, clearly-scoped product rather than a broad portfolio",
    ],
    typicalStrengths: [
      "Deep mainframe and legacy system integration expertise",
      "Established presence in regulated industries",
      "Long enterprise support lifecycle",
    ],
    typicalWeaknesses: [
      "Portfolio is fragmented across many products (Cloud, Db2, watsonx, Cognos) without one clear modern flagship",
      "Weaker modern cloud-native ecosystem than the major hyperscalers",
      "Often perceived as a legacy rather than growth-oriented choice for new platform decisions",
    ],
    migrationScenarios: [
      "Bridging an existing mainframe/Db2 estate to cloud-based analytics without a full mainframe exit",
    ],

    architectureCharacteristics: ["Mainframe and legacy system integration", "Db2 relational database", "watsonx AI/data portfolio (emerging, fragmented)"],
    cloudModel: "hybrid",
    deploymentModels: ["managed-service", "self-hosted"],

    governance: "established",
    security: "established",
    compliance: "established",
    aiCapabilities: "developing",
    machineLearning: "developing",
    generativeAi: "developing",
    ecosystemStrength: "developing",
    partnerNetwork: "established",

    sapIntegration: "developing",
    erpIntegration: "developing",
    crmIntegration: "emerging",
    dataWarehouseIntegration: "developing",
    multiCloudSupport: "developing",
    lakehouseCapabilities: "emerging",
    dataVirtualization: "developing",
    dataSharing: "emerging",
    metadataManagement: "developing",
    masterDataManagement: "established",
    streaming: "developing",

    implementationComplexity: "high",
    timeToValue: "3-6-months",
    vendorLockInRisk: "high",

    pricingModel: "Enterprise contract; product-specific licensing varies significantly by portfolio component",
    costTier: "enterprise-custom",
    costCharacteristics:
      "Cost varies significantly by which portfolio component is in scope — pricing an IBM engagement requires nailing down the specific product mix before any total cost estimate is meaningful.",

    industryFit: ["financial-services", "public-sector", "healthcare", "manufacturing"],
    companySizeFit: ["enterprise", "global-enterprise"],
    integrationStrengths: ["Mainframe integration", "Db2", "Existing IBM-licensed estates"],
    traits: ["legacy-integration", "enterprise-scale"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
  {
    id: "mongodb",
    vendor: "MongoDB",
    productName: "MongoDB Atlas",
    category: "operational-database",
    vendorCategory: "Operational Document Database",
    shortDescription:
      "Document-oriented operational database for application data — solves a fundamentally different problem than enterprise analytics or decision platforms, and typically coexists with them rather than competing.",
    executivePositioning:
      "Not a decision-intelligence platform at all — the right comparison point is application data infrastructure, not analytics.",
    idealCustomerProfile:
      "Developer-centric teams building or scaling applications that need a flexible, horizontally scalable operational data store, typically alongside a separate analytics platform.",
    executiveSummary:
      "MongoDB Atlas is genuinely excellent at what it does — flexible, horizontally scalable operational data storage for applications — and genuinely not a substitute for an analytics or decision-intelligence platform. Including it in a like-for-like comparison against the other platforms in this catalog is itself a category error worth flagging explicitly; the realistic scenario is running it alongside one of the other platforms, not choosing between them.",

    idealUseCases: [
      "Application/transactional data storage with flexible, evolving schemas",
      "Developer-centric teams building modern applications",
      "Operational workloads needing horizontal scalability",
    ],
    antiPatterns: [
      "Enterprise analytics, BI, or decision-intelligence use cases — a different problem category entirely",
      "Complex multi-table relational/transactional integrity requirements",
      "Data warehousing or large-scale historical analytical queries",
    ],
    typicalStrengths: [
      "Flexible document schema well-suited to fast-moving application development",
      "Strong horizontal scalability for operational workloads",
      "Broad developer adoption and tooling maturity",
    ],
    typicalWeaknesses: [
      "Not an analytics or decision-intelligence platform — frequently miscompared against tools solving a different problem",
      "Less suited to complex relational integrity requirements",
      "Analytical workloads typically require pairing with a separate data platform",
    ],
    migrationScenarios: [
      "Moving application data off a rigid relational schema to accommodate faster product iteration",
    ],

    architectureCharacteristics: ["Document-oriented NoSQL database", "Horizontally scalable (sharding)", "Managed cloud service (Atlas) or self-hosted"],
    cloudModel: "multi-cloud",
    deploymentModels: ["saas", "self-hosted"],

    governance: "developing",
    security: "established",
    compliance: "established",
    aiCapabilities: "developing",
    machineLearning: "developing",
    generativeAi: "developing",
    ecosystemStrength: "established",
    partnerNetwork: "developing",

    sapIntegration: "emerging",
    erpIntegration: "emerging",
    crmIntegration: "emerging",
    dataWarehouseIntegration: "emerging",
    multiCloudSupport: "leading",
    lakehouseCapabilities: "emerging",
    dataVirtualization: "emerging",
    dataSharing: "emerging",
    metadataManagement: "emerging",
    masterDataManagement: "emerging",
    streaming: "developing",

    implementationComplexity: "low",
    timeToValue: "weeks",
    vendorLockInRisk: "medium",

    pricingModel: "Consumption/subscription-based (Atlas), or self-hosted licensing",
    costTier: "entry",
    costCharacteristics:
      "Entry cost is low and scales predictably with usage for most application workloads; cost grows more with data volume and cluster tier than with the kind of complex-query costs seen in analytical platforms.",

    industryFit: ["technology", "retail", "financial-services", "healthcare"],
    companySizeFit: ["smb", "mid-market", "enterprise", "global-enterprise"],
    integrationStrengths: ["Application development frameworks", "Multi-cloud deployment (Atlas)", "Developer tooling ecosystem"],
    traits: ["operational-workload", "vendor-neutral"],
    sourceNotes: SOURCE_NOTES,
    lastReviewedDate: LAST_REVIEWED,
  },
];

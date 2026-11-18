/**
 * Mirrors the capability_categories rows seeded in
 * supabase/migrations/20261117180000_vendor_intelligence_evidence_graph_v1.sql
 * exactly. The database table (an FK target for vendor_capability_claims)
 * is the actual source of truth for what is insertable; this constant
 * exists for compile-time-checked UI labels and client-side validation
 * before a write is even attempted — the same "TS mirror, DB enforces"
 * relationship research/types.ts's SourceType already has with the real
 * check constraint on research_evidence.
 */
import type { CapabilityCategory } from "./types";

export const CAPABILITY_CATEGORIES: CapabilityCategory[] = [
  { key: "architecture", label: "Architecture", categoryGroup: "Foundation", description: "Overall structural approach — monolith vs. composable, layered data/compute separation, open vs. proprietary formats." },
  { key: "data_integration", label: "Data Integration", categoryGroup: "Foundation", description: "Moving and connecting data across systems — batch, CDC, API-based." },
  { key: "data_engineering", label: "Data Engineering", categoryGroup: "Foundation", description: "Pipeline authoring, orchestration, transformation tooling." },
  { key: "data_warehouse", label: "Data Warehouse", categoryGroup: "Foundation", description: "Structured, SQL-first analytical storage and query engines." },
  { key: "lakehouse", label: "Lakehouse", categoryGroup: "Foundation", description: "Open-table-format storage unifying warehouse and lake workloads." },
  { key: "streaming", label: "Streaming", categoryGroup: "Foundation", description: "Real-time/event-driven data ingestion and processing." },
  { key: "governance", label: "Governance", categoryGroup: "Trust", description: "Cataloging, lineage, access policy and stewardship over data assets." },
  { key: "data_quality", label: "Data Quality", categoryGroup: "Trust", description: "Validation, profiling, and quality-rule enforcement." },
  { key: "master_data", label: "Master Data", categoryGroup: "Trust", description: "Golden-record and reference-data management." },
  { key: "semantic_layer", label: "Semantic Layer", categoryGroup: "Trust", description: "A shared, governed business-metric/definition layer above raw data." },
  { key: "analytics", label: "Analytics", categoryGroup: "Insight", description: "BI, dashboarding and ad hoc query capability." },
  { key: "planning", label: "Planning", categoryGroup: "Insight", description: "Forecasting, budgeting and enterprise planning workflows." },
  { key: "ai_ml", label: "AI / ML", categoryGroup: "Intelligence", description: "Classical machine learning model development and serving." },
  { key: "genai", label: "GenAI", categoryGroup: "Intelligence", description: "Generative AI / LLM-based capability, including retrieval-augmented generation." },
  { key: "agentic_ai", label: "Agentic AI", categoryGroup: "Intelligence", description: "Autonomous or semi-autonomous multi-step AI agents acting on data/systems." },
  { key: "security", label: "Security", categoryGroup: "Trust", description: "Authentication, encryption, network isolation and platform security posture." },
  { key: "compliance", label: "Compliance", categoryGroup: "Trust", description: "Formal certifications and regulatory attestations (e.g. ISO, SOC, FedRAMP)." },
  { key: "data_sovereignty", label: "Data Sovereignty", categoryGroup: "Trust", description: "Data residency guarantees and sovereign-cloud operating models." },
  { key: "observability", label: "Observability", categoryGroup: "Operations", description: "Monitoring, cost/usage visibility and operational telemetry." },
  { key: "developer_experience", label: "Developer Experience", categoryGroup: "Operations", description: "SDKs, CLIs, local development and API ergonomics." },
  { key: "operations", label: "Operations", categoryGroup: "Operations", description: "Day-to-day platform operability — patching, scaling, SRE surface." },
  { key: "cost_management", label: "Cost Management", categoryGroup: "Operations", description: "Consumption visibility, budgeting and cost-control tooling." },
  { key: "hybrid_multicloud", label: "Hybrid / Multi-cloud", categoryGroup: "Foundation", description: "Operating across more than one cloud or on-prem plus cloud." },
  { key: "sap_integration", label: "SAP Integration", categoryGroup: "Ecosystem", description: "Native or certified integration with SAP transactional systems." },
  { key: "microsoft_integration", label: "Microsoft Integration", categoryGroup: "Ecosystem", description: "Native or certified integration with the Microsoft/Azure ecosystem." },
  { key: "google_integration", label: "Google Integration", categoryGroup: "Ecosystem", description: "Native or certified integration with the Google Cloud ecosystem." },
  { key: "aws_integration", label: "AWS Integration", categoryGroup: "Ecosystem", description: "Native or certified integration with the AWS ecosystem." },
  { key: "open_ecosystem", label: "Open Ecosystem", categoryGroup: "Ecosystem", description: "Support for open standards/formats not owned by any single vendor (e.g. Iceberg, Delta, Parquet)." },
];

export const CAPABILITY_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(CAPABILITY_CATEGORIES.map((c) => [c.key, c.label]));

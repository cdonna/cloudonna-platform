/**
 * One illustrative cost scenario — English only, same precedent as the
 * other showcase catalogs. Every value here is qualitative (a band or
 * a note), never an invented number: "Do not invent precise numbers
 * where the evidence does not support them. Use ranges and
 * assumptions" applies as much to this file as to any customer-facing
 * screen.
 */
export type CostExposure = "mostly fixed" | "mixed" | "mostly variable";

export interface CostDriver {
  label: string;
  description: string;
}

export interface PlatformCostProfile {
  platform: string;
  exposure: CostExposure;
  commitmentNote: string;
  dataMovementNote: string;
  operationsNote: string;
}

export const COST_VALUE_SCENARIO = {
  title: "Data platform for a mid-size enterprise",
  parameters: [
    "15 TB of governed data",
    "300 BI users",
    "50 data engineers",
    "Growing AI workloads",
    "SAP integration required",
    "EU data residency required",
  ],
  drivers: [
    { label: "Compute for AI workloads", description: "The largest and least predictable driver once AI workloads scale beyond pilots." },
    { label: "Data movement", description: "Moving data across regions or platforms to satisfy residency requirements adds cost that's easy to underestimate." },
    { label: "User concurrency", description: "300 BI users querying concurrently drives compute differently than a smaller, steadier workload." },
    { label: "Integration complexity", description: "SAP integration depth changes implementation cost more than the platform choice itself." },
  ] as CostDriver[],
  profiles: [
    {
      platform: "SAP Business Data Cloud",
      exposure: "mostly fixed",
      commitmentNote: "Bundled with existing SAP commercial agreements, less exposure to standalone consumption spikes.",
      dataMovementNote: "Lowest data movement cost for SAP-native data, since it stays close to source.",
      operationsNote: "Lower operations overhead, more of the platform is managed.",
    },
    {
      platform: "Databricks",
      exposure: "mostly variable",
      commitmentNote: "Consumption-based; AI workload growth directly drives spend unless actively governed.",
      dataMovementNote: "Moderate, depends on source system proximity to the chosen cloud region.",
      operationsNote: "Higher operations overhead, more configuration and tuning responsibility.",
    },
    {
      platform: "Snowflake",
      exposure: "mixed",
      commitmentNote: "Credit-based consumption with optional capacity commitments that reduce unit cost.",
      dataMovementNote: "Moderate, cross-cloud data sharing can add movement cost.",
      operationsNote: "Lower operations overhead for core analytics; AI workloads add more.",
    },
    {
      platform: "Microsoft Fabric",
      exposure: "mixed",
      commitmentNote: "Capacity-based pricing; needs sizing before commitment to avoid over- or under-provisioning.",
      dataMovementNote: "Lowest if already inside the Microsoft ecosystem, higher if not.",
      operationsNote: "Lower operations overhead where Microsoft tooling is already standard.",
    },
  ] as PlatformCostProfile[],
  notComparable: [
    "List prices alone, without factoring in existing commercial agreements and discounts",
    "AI compute costs across platforms without a defined workload profile, since usage patterns vary widely",
    "Implementation cost estimates without a validated integration scope",
  ],
};

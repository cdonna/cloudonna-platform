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
  /**
   * What the business gets for the spend. Kept strictly qualitative:
   * "avoided engineering time" is a real, defensible claim; "€1.4m of
   * avoided cost" would be an invented one, and a CFO can tell the
   * difference faster than anyone.
   */
  businessValue: [
    { label: "Avoided engineering time", description: "Hours currently spent maintaining duplicate extracts and reconciling numbers before executive reporting." },
    { label: "Faster time to a governed AI foundation", description: "AI initiatives build on data that is already governed rather than each one re-solving governance." },
    { label: "Fewer integration points to maintain", description: "A smaller number of governed data products in place of a web of point-to-point extracts." },
    { label: "Reporting continuity", description: "The value of regional reporting not going dark, which only becomes visible if it does." },
  ] as CostDriver[],
  /**
   * Cost of delay. Direction and mechanism, never a monthly figure —
   * the figure depends entirely on the organization's own contracts.
   */
  costOfDelay: [
    { label: "Duplicate data flows keep running", description: "Every month of delay is another month of paying to maintain the thing the decision is meant to remove." },
    { label: "Commercial terms move", description: "Vendor pricing models shift during an evaluation; a quote that shaped the shortlist can expire before the decision lands." },
    { label: "AI initiatives start without a foundation", description: "Teams that cannot wait build their own ungoverned path, which then has to be unpicked." },
  ] as CostDriver[],
  notComparable: [
    "List prices alone, without factoring in existing commercial agreements and discounts",
    "AI compute costs across platforms without a defined workload profile, since usage patterns vary widely",
    "Implementation cost estimates without a validated integration scope",
  ],
};

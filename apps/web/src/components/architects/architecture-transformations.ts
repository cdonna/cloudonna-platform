/**
 * Illustrative before/after transformation views — English only, same
 * precedent as the pattern and ADR catalogs in this directory.
 */
export interface ArchitectureTransformation {
  id: string;
  title: string;
  beforeItems: string[];
  afterItems: string[];
  architectureImpact: string;
  businessImpact: string;
}

export const ARCHITECTURE_TRANSFORMATIONS: ArchitectureTransformation[] = [
  {
    id: "sap-bw-modernization",
    title: "SAP BW modernization",
    beforeItems: [
      "SAP BW as the sole reporting layer",
      "Multiple extracts feeding different downstream tools",
      "Point-to-point integration between systems",
      "The same data duplicated across several targets",
      "Manual reconciliation before executive reporting",
      "Fragmented analytics owned by different teams with different numbers",
    ],
    afterItems: [
      "A modern, governed data architecture with a single source of truth",
      "Reusable data products instead of one-off extracts",
      "A shared semantic layer so metrics mean the same thing everywhere",
      "Data prepared and governed well enough for AI workloads, not just BI",
      "Modern, self-service analytics on top of governed data",
      "Meaningfully less redundant data movement between systems",
    ],
    architectureImpact:
      "Trades a web of point-to-point extracts for a smaller number of governed data products with clear ownership — fewer integration points to maintain, but each one now carries more responsibility.",
    businessImpact:
      "Executive reporting stops requiring manual reconciliation between teams' numbers, and new analytics use cases (including AI) can build on data that is already governed instead of starting from scratch.",
  },
];

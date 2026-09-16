/**
 * A single, fully worked illustrative case study — English only, same
 * precedent as the other showcase catalogs. Built from the same
 * sap-bw-modernization facts as example-decisions.ts and
 * architecture-transformations.ts so the numbers and claims stay
 * consistent across the site rather than diverging into a separate
 * fictional narrative.
 */
export interface CaseStudy {
  id: string;
  title: string;
  situation: string;
  decisionQuestion: string;
  options: string[];
  constraints: string[];
  recommendation: string;
  why: string;
  tradeOffs: string[];
  architectureImpact: string;
  financialImpact: string;
  risks: string[];
  outcome: string;
}

export const CASE_STUDY: CaseStudy = {
  id: "sap-bw-modernization",
  title: "Global manufacturer modernizes its data platform",
  situation:
    "A global manufacturer runs SAP BW on HANA alongside a patchwork of point-to-point extracts feeding regional reporting. Reporting is slow to change, the same data is duplicated across three systems, and AI initiatives have no governed foundation to build on.",
  decisionQuestion: "Modernize SAP BW into SAP Business Data Cloud, Databricks, Microsoft Fabric, or a hybrid architecture?",
  options: [
    "SAP Business Data Cloud — strongest SAP-native continuity, governed foundation ships largely pre-built",
    "Databricks — strongest AI and data science flexibility, more integration work upfront",
    "Microsoft Fabric — best fit if Power BI and Microsoft 365 are already central to reporting",
    "Hybrid (SAP BDC + Databricks) — SAP-native core with open compute for advanced AI workloads",
  ],
  constraints: [
    "Regional reporting could not go dark during migration",
    "The existing SAP skills base needed a viable path forward, not a full platform replacement",
    "No appetite for a multi-year, big-bang replatforming program",
  ],
  recommendation: "SAP Business Data Cloud, with Databricks as a companion platform for advanced AI workloads",
  why:
    "The governed SAP-native foundation directly resolved the duplication problem with the least new integration work, while a companion AI platform avoided boxing in future data science ambitions.",
  tradeOffs: [
    "Faster continuity with SAP BDC traded off some of the open ecosystem flexibility a pure Databricks or Fabric path would have offered",
    "Running two platforms (SAP BDC plus Databricks) added operational surface area versus a single-platform choice",
  ],
  architectureImpact:
    "Traded a web of point-to-point extracts for a smaller number of governed data products with clear ownership — fewer integration points to maintain, but each one now carries more responsibility.",
  financialImpact:
    "The primary financial case was avoided cost: less engineering time spent maintaining duplicate extracts and manually reconciling numbers before executive reporting, not a headline platform saving. Migration and dual-running cost were treated as a one-time investment against that ongoing avoided cost.",
  risks: [
    "Migration sequencing risk if legacy extracts weren't decommissioned on schedule",
    "Skills gap for teams new to the governed data product model",
  ],
  outcome:
    "Reviewed eighteen months after the decision was recorded: the governed core shipped on the SAP-native timeline, and two of the three duplicate extract paths were decommissioned. The Databricks companion platform saw slower adoption than planned, since AI initiatives ramped up more gradually than assumed at decision time — a reminder that the recommendation's own \"what would change this\" condition (AI ambitions growing faster than assumed) can also resolve in the other direction.",
};

/**
 * The illustrative decision that runs through the homepage's 01–05
 * journey. English only, the same precedent as every other content
 * catalog in this repo (example-decisions.ts, case-study.ts,
 * architecture-patterns.ts): a structured content catalog, not UI
 * chrome, so it isn't threaded through the five-locale dictionary — the
 * labels around it are. See en.ts's own header comment.
 *
 * Deliberately the *same* decision as EXAMPLE_DECISIONS[0], CASE_STUDY
 * and ARCHITECTURE_TRANSFORMATIONS[0] — the SAP BW modernization
 * composite. One decision followed from "understand" through to
 * "remember" is the whole argument of the homepage; five unrelated
 * screenshots would not be.
 *
 * Nothing here is a real customer engagement, and nothing here invents
 * a precise figure: cost and value language stays qualitative, which is
 * the same rule the real decision engine follows.
 */

export interface LandscapeEntry {
  label: string;
  value: string;
}

export interface CompareRow {
  name: string;
  architecture: string;
  commercial: string;
  risk: string;
  dependency: string;
  /** Highlights the row the recommendation lands on, so "compare" and
   * "decide" visibly agree. */
  recommended?: boolean;
}

export interface AlignReading {
  role: "ceo" | "cfo" | "cio" | "architect";
  question: string;
  reading: string;
}

export type MemoryEventKind = "created" | "evidence" | "assumption" | "vendor" | "review";

export interface MemoryEvent {
  kind: MemoryEventKind;
  when: string;
  title: string;
  body: string;
}

export const JOURNEY_DECISION = {
  title: "SAP BW modernization",
  question: "Modernize SAP BW into SAP Business Data Cloud, Databricks, Microsoft Fabric, or a hybrid architecture?",

  context:
    "A global manufacturer needs a governed foundation for AI, but reporting cannot go dark during the migration and the existing SAP skills base needs a path forward rather than a replacement.",

  landscape: [
    { label: "Core ERP", value: "SAP S/4HANA" },
    { label: "Reporting layer", value: "SAP BW on HANA" },
    { label: "Integration", value: "Point-to-point extracts, three targets" },
    { label: "Cloud", value: "Azure, primary" },
    { label: "BI", value: "Power BI, ~3,000 users" },
  ] as LandscapeEntry[],

  constraints: [
    "Regional reporting cannot go dark during migration",
    "No appetite for a multi-year big-bang replatforming program",
    "EU data residency required",
  ],

  priorities: [
    "Preserve SAP-native reporting continuity",
    "Create a governed foundation for AI",
    "Reduce duplicate data flows",
    "Keep migration risk manageable",
  ],

  stakeholders: ["CIO (decision owner)", "CFO", "Chief Data Officer", "Enterprise Architecture", "Regional finance leads"],

  compare: [
    {
      name: "SAP Business Data Cloud",
      architecture: "Governed SAP-native core, data products ship largely pre-built",
      commercial: "Mostly fixed; bundled into existing SAP agreements",
      risk: "Less open-ecosystem flexibility later",
      dependency: "SAP roadmap for non-SAP data",
      recommended: true,
    },
    {
      name: "Databricks",
      architecture: "Open lakehouse, strongest AI and data science surface",
      commercial: "Mostly variable; AI workload growth drives spend directly",
      risk: "Most new integration work upfront",
      dependency: "Internal platform engineering capacity",
    },
    {
      name: "Microsoft Fabric",
      architecture: "Native fit where Power BI is already the reporting surface",
      commercial: "Capacity-based; needs sizing before commitment",
      risk: "Weaker SAP-native continuity",
      dependency: "Microsoft becoming the company-wide reporting standard",
    },
    {
      name: "Hybrid (SAP BDC + Databricks)",
      architecture: "SAP-native core with open compute alongside it",
      commercial: "Two commercial relationships to govern",
      risk: "Most operational surface area",
      dependency: "Clear ownership of the boundary between the two",
    },
  ] as CompareRow[],

  align: [
    {
      role: "ceo",
      question: "Does this move us faster than it slows us down?",
      reading:
        "Continuity first: reporting keeps running while a governed foundation for AI gets built underneath it. The flexibility we give up is recoverable; the reporting outage we avoid is not.",
    },
    {
      role: "cfo",
      question: "What are we committing to, and for how long?",
      reading:
        "Mostly fixed cost inside an agreement we already hold, with the companion AI platform as the variable part. The business case is avoided cost — engineering time currently spent maintaining duplicate extracts — not a headline platform saving.",
    },
    {
      role: "cio",
      question: "Can my organization actually deliver this?",
      reading:
        "The existing SAP skills base stays relevant, which is the single largest delivery risk removed. The new capability to build is the governed data product model, not a new platform discipline from scratch.",
    },
    {
      role: "architect",
      question: "What does this lock in, and what stays reversible?",
      reading:
        "A smaller number of governed data products replaces a web of point-to-point extracts: fewer integration points, each carrying more responsibility. Open compute stays attachable, so the AI path is not closed off.",
    },
  ] as AlignReading[],

  memory: [
    {
      kind: "created",
      when: "Month 0",
      title: "Decision created",
      body: "SAP Business Data Cloud recommended, with Databricks as a companion platform for advanced AI workloads.",
    },
    {
      kind: "evidence",
      when: "Month 3",
      title: "Evidence updated",
      body: "Vendor documentation on non-SAP data product support superseded. The newer source strengthens the governed-core case rather than weakening it.",
    },
    {
      kind: "assumption",
      when: "Month 7",
      title: "Assumption changed",
      body: "\"AI initiatives ramp quickly\" no longer holds — adoption is slower than assumed at decision time. The companion platform matters less than expected, not more.",
    },
    {
      kind: "vendor",
      when: "Month 11",
      title: "Vendor condition changed",
      body: "A shortlisted alternative moved further toward consumption pricing, increasing its cost exposure under this workload profile.",
    },
    {
      kind: "review",
      when: "Month 18",
      title: "Review triggered",
      body: "Two of the three duplicate extract paths are decommissioned and the governed core shipped on the SAP-native timeline.",
    },
  ] as MemoryEvent[],

  /** Which verdict the timeline resolves to. Both states are real UI;
   * this illustrative decision happens to resolve to "holds", and the
   * reasons it holds are the changes above, not a fresh argument. */
  verdict: "holds" as "holds" | "review",
  verdictReason:
    "Every change since the decision was recorded pushed in the same direction as the original recommendation. The one assumption that broke made the alternative less attractive, not more.",
};

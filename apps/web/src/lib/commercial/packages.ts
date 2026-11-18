/**
 * Commercial Engine V1 (brief §2-§5) — the single source of truth for
 * ClouDonna's three public commercial packages plus the sales-led
 * Strategic Decision Program. Website copy (CommercialPaths, the
 * /commercial page) and sales collateral
 * (docs/commercial/*.md) both describe these same four offers — this
 * file is what keeps the website and the internal commercial model
 * from drifting apart, not a duplicate of either.
 *
 * Pricing here is indicative commercial entry points (brief §7),
 * never a fixed price and never a self-service checkout — every real
 * engagement is scoped with the ClouDonna team. These numbers are
 * deliberately NOT read by billing_foundation's `plans` table (which
 * governs actual Stripe/invoice billing and stays gated behind its
 * own, separate Commercial Activation approval) — this is marketing
 * and sales positioning, not live billing configuration.
 */

export type CommercialPackageId = "decision_sprint" | "team" | "enterprise" | "strategic_decision_program";

export interface CommercialPackageDefinition {
  id: CommercialPackageId;
  name: string;
  tagline: string;
  /** Null for packages with no public indicative price at all
   * (Enterprise, Strategic Decision Program) — "Talk to ClouDonna" is
   * the honest answer, never a fabricated number. */
  startingAtChf: number | null;
  /** How the price should read, e.g. "Starting from CHF 25,000" or
   * "From CHF 75,000 / year" — kept here, not derived, since the unit
   * ("/ year" vs. one-time) is a genuine product fact, not a format
   * detail. */
  priceDisplay: string;
  typicalDurationWeeks: [number, number] | null;
  /** Real, already-shipped product capabilities this package draws
   * on — every entry here must correspond to something actually live
   * (see docs/capabilities/*.md), never a roadmap promise. */
  outputs: string[];
  /** True only for the two public, click-to-inquire packages this
   * sprint adds a distinct inquiry_type for. Enterprise and the
   * Strategic Decision Program are reached via the general enterprise
   * inquiry type — they are sales conversations from the first
   * contact, not a distinct form. */
  hasDedicatedInquiryType: boolean;
}

export const DECISION_SPRINT: CommercialPackageDefinition = {
  id: "decision_sprint",
  name: "Decision Sprint",
  tagline: "Make one critical technology decision defensible.",
  startingAtChf: 25_000,
  priceDisplay: "Starting from CHF 25,000",
  typicalDurationWeeks: [2, 4],
  outputs: [
    "Decision context and structured options",
    "Evidence and Vendor Intelligence, with provenance",
    "Research findings against the real options considered",
    "Constraint evaluation",
    "Business case: deterministic TCO / ROI / NPV / payback",
    "Economic scenarios and financial sensitivity",
    "Decision Challenger review",
    "Executive Recommendation across strategic, architecture and economic lenses",
    "A saved Decision Record in Decision Memory",
    "An executive brief",
  ],
  hasDedicatedInquiryType: true,
};

export const TEAM: CommercialPackageDefinition = {
  id: "team",
  name: "Team",
  tagline: "Decision Intelligence for teams that decide repeatedly.",
  startingAtChf: 75_000,
  priceDisplay: "From CHF 75,000 / year",
  typicalDurationWeeks: null,
  outputs: [
    "A shared Decision Workspace across multiple decisions",
    "Multiple users with team governance",
    "Decision Memory across every decision the team makes",
    "Research, Business Case, Scenario and Challenger tooling for each decision",
    "Vendor Intelligence shared across the team",
    "Onboarding for the team",
  ],
  hasDedicatedInquiryType: true,
};

export const ENTERPRISE: CommercialPackageDefinition = {
  id: "enterprise",
  name: "Enterprise",
  tagline: "A governed decision layer across the enterprise.",
  startingAtChf: null,
  priceDisplay: "Talk to ClouDonna",
  typicalDurationWeeks: null,
  outputs: [
    "Multiple teams on one governed decision layer",
    "Decision governance and role-based access",
    "Organization-private evidence, kept separate from shared vendor knowledge",
    "Decision Memory at enterprise scale",
    "Enterprise reporting",
    "A security review with ClouDonna before rollout",
  ],
  hasDedicatedInquiryType: false,
};

/**
 * Not a homepage pricing card (brief §5) — an internal sales
 * positioning range for large, multi-decision transformation
 * programs. Deliberately not surfaced in CommercialPaths/the public
 * /commercial grid; referenced from the sales playbook and proposal
 * template, and from the internal commercial dashboard's package
 * breakdown, never hardcoded into any deterministic product logic
 * (the Decision Engine has no notion of this package at all).
 */
export const STRATEGIC_DECISION_PROGRAM: CommercialPackageDefinition = {
  id: "strategic_decision_program",
  name: "Strategic Decision Program",
  tagline: "For transformation programs made of several interconnected decisions.",
  startingAtChf: 300_000,
  priceDisplay: "CHF 300,000–750,000+ (sales-led, scoped per program)",
  typicalDurationWeeks: null,
  outputs: [
    "Multiple linked Decision Sprints covering one transformation program",
    "A shared evidence and vendor-intelligence base across all linked decisions",
    "Program-level executive recommendation across all constituent decisions",
  ],
  hasDedicatedInquiryType: false,
};

export const COMMERCIAL_PACKAGES: Record<CommercialPackageId, CommercialPackageDefinition> = {
  decision_sprint: DECISION_SPRINT,
  team: TEAM,
  enterprise: ENTERPRISE,
  strategic_decision_program: STRATEGIC_DECISION_PROGRAM,
};

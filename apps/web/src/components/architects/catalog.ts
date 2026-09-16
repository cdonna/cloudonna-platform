/**
 * Illustrative Architecture Decision Records, English only for now
 * (same precedent as vendor-intelligence/catalog.ts). Follows the ADR
 * pattern architects already use (context, decision, consequences),
 * with one addition ClouDonna's own trust rules require: an executive
 * translation, in plain business language, not a technical summary.
 * No fabricated numbers anywhere — qualitative trade-offs only, same
 * rule the real decision engine follows.
 */
export interface ArchitectureDecisionExample {
  id: string;
  title: string;
  context: string;
  decision: string;
  consequences: string;
  executiveTranslation: string;
}

export const ARCHITECTURE_DECISION_EXAMPLES: ArchitectureDecisionExample[] = [
  {
    id: "lakehouse-or-warehouse",
    title: "Lakehouse or data warehouse for the next platform",
    context:
      "Analytics and early AI workloads both need to sit on the same platform, but the two patterns optimize for different things: a warehouse for governed, structured reporting, a lakehouse for flexible, large-scale data and model work.",
    decision:
      "Choose the pattern that matches where most future workload growth actually comes from, not where most data sits today.",
    consequences:
      "A lakehouse buys flexibility for AI and unstructured data at the cost of a steeper governance and skills curve. A warehouse keeps governance simple but can slow down AI ambitions later.",
    executiveTranslation:
      "This decision trades near-term simplicity against how fast the company can act on AI in two to three years.",
  },
  {
    id: "single-or-multi-cloud",
    title: "Single cloud or multi cloud",
    context:
      "One cloud provider already hosts most of the estate. A second provider offers a genuinely better fit for one upcoming workload.",
    decision:
      "Stay single cloud unless a second provider creates a clear, durable advantage that outweighs the operational cost of running two.",
    consequences:
      "Single cloud keeps operations, skills and vendor leverage concentrated. Multi cloud adds real flexibility and negotiating power, at the cost of duplicated tooling and skills.",
    executiveTranslation:
      "This is a trade between negotiating leverage and operating cost, not a technology preference.",
  },
  {
    id: "central-or-point-to-point",
    title: "Central integration platform or point to point integrations",
    context:
      "The number of systems that need to talk to each other has grown past what point to point connections can support cleanly.",
    decision:
      "Move to a central integration layer once the cost of maintaining point to point connections starts slowing delivery down, not before.",
    consequences:
      "A central platform reduces long term complexity but is a real upfront investment. Point to point stays cheap short term but compounds risk with every new system added.",
    executiveTranslation:
      "This decision is about paying down complexity now versus paying it back later, with interest.",
  },
  {
    id: "build-or-buy-core-capability",
    title: "Build or buy a core capability",
    context: "A capability central to the business could be built in house or bought as a platform.",
    decision:
      "Build only where the capability is a genuine source of competitive advantage. Buy everywhere else.",
    consequences:
      "Building keeps full control and differentiation but carries ongoing engineering cost and delivery risk. Buying is faster and lower risk but creates a real dependency on the vendor.",
    executiveTranslation:
      "The real question for the business is whether this capability is where the company wins, or where it just needs to keep up.",
  },
];

import type { Metadata } from "next";
import Footer from "@/components/landing/Footer";
import { PageCta, PageHeader, Section, Shell } from "@/components/editorial/primitives";
import { GlobalNav } from "@/components/layout/GlobalNav";

export const metadata: Metadata = {
  title: "Discovery: How ClouDonna Reaches a Decision · ClouDonna",
  description:
    "How ClouDonna moves from a business goal to an evidence-based, vendor-neutral technology recommendation.",
  alternates: { canonical: "/discovery" },
};

const steps = [
  {
    label: "Business Goal",
    body: "Discovery starts with what you're actually trying to achieve, not a product category. A goal like \"reduce time to close the books\" points to a different answer than \"unify data across a merger.\"",
  },
  {
    label: "Business Context",
    body: "Your industry, scale, and current technology landscape shape which approaches are realistic. The same goal can have a different right answer depending on what you're starting from.",
  },
  {
    label: "Required Capabilities",
    body: "The goal and context together imply a set of capabilities that have to exist (governance, scalability, integration reach) before any product enters the conversation.",
  },
  {
    label: "Requirements",
    body: "Capabilities get made specific: which regulations apply, which systems must integrate, which teams need access, and on what timeline.",
  },
  {
    label: "Constraints",
    body: "Budget, existing contracts, skills on your team, and risk appetite all narrow the field before a single vendor is named.",
  },
  {
    label: "Solution Approaches",
    body: "Only now does Discovery move to categories of answer, such as buy vs. build or centralized vs. federated, evaluated on fit to what's above, not on brand recognition.",
  },
  {
    label: "Technology Options",
    body: "Specific platforms are scored against every dimension above using the Donna Score model, a documented, evidence-based method, not a black box.",
  },
  {
    label: "Vendor Options",
    body: "Who actually offers the technology, and how they're positioned to deliver it, gets evaluated separately from the technology itself.",
  },
  {
    label: "Implementation Approach",
    body: "How the solution actually gets delivered (in-house, staged rollout, phased migration) affects time to value as much as the technology choice does.",
  },
  {
    label: "Partner Options",
    body: "Where delivery capacity or specialist expertise is needed, qualified implementation partners are surfaced against the same evidence standard.",
  },
  {
    label: "Executive Decision Report",
    body: "Everything above is synthesized into a single report: the recommendation, the evidence behind it, the trade-offs, and what to do next. This is what Donna AI produces today.",
  },
];

export default function DiscoveryPage() {
  return (
    // Not part of the localized route tree (see the localization
    // report's "KNOWN LIMITATIONS") — stays English-only. Renders its
    // own GlobalNav and Footer explicitly (with default English props)
    // now that the root layout no longer renders either globally for
    // every route (see src/app/layout.tsx). showLanguageSwitcher is
    // off — LanguageSwitcher calls useLocale(), which throws outside
    // the LocaleProvider this page deliberately sits outside of.
    <div className="min-h-screen bg-paper">
      <GlobalNav showLanguageSwitcher={false} />

      <PageHeader
        eyebrow="Discovery"
        title="How ClouDonna reaches a decision"
        lede="Every recommendation ClouDonna produces follows the same reasoning, in the same order. No product is named until the case for it has already been established."
      />

      {/* The eleven discovery steps are a *sequence*, so they are
          numbered on one continuous rule rather than rendered as eleven
          identical bordered cards with an icon each — the order is the
          content here, and cards actively hid it. */}
      <Section size="lg">
        <Shell>
          <ol className="max-w-[72rem] border-t border-rule">
            {steps.map((step, index) => (
              <li
                key={step.label}
                className="grid gap-3 border-b border-rule py-8 lg:grid-cols-[4rem_18rem_1fr] lg:items-baseline lg:gap-10"
              >
                <span className="font-mono text-label font-medium text-accent tabular-nums uppercase">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="text-[1.0625rem] font-medium tracking-[-0.018em] text-ink">{step.label}</h2>
                <p className="max-w-[62ch] text-[0.9375rem] leading-7 text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </Shell>
      </Section>

      <PageCta
        heading="See the full path in action"
        body="Donna AI runs this exact sequence through a guided, conversational assessment and produces a real Executive Decision Report."
        primaryHref="/donna-ai"
        primaryLabel="Try Donna AI"
      />
      <Footer />
    </div>
  );
}

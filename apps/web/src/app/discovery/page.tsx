import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Compass,
  FileCheck2,
  Landmark,
  ListChecks,
  Scale,
  Search,
  ShieldCheck,
  Target,
  Users,
  Wrench,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Discovery — How ClouDonna Reaches a Decision · ClouDonna",
  description:
    "How ClouDonna moves from a business goal to an evidence-based, vendor-neutral technology recommendation — step by step.",
  alternates: { canonical: "/discovery" },
};

const steps = [
  {
    icon: Target,
    label: "Business Goal",
    body: "Discovery starts with what you're actually trying to achieve — not a product category. A goal like \"reduce time to close the books\" points to a different answer than \"unify data across a merger.\"",
  },
  {
    icon: Landmark,
    label: "Business Context",
    body: "Your industry, scale, and current technology landscape shape which approaches are realistic. The same goal can have a different right answer depending on what you're starting from.",
  },
  {
    icon: ListChecks,
    label: "Required Capabilities",
    body: "The goal and context together imply a set of capabilities that have to exist — governance, scalability, integration reach — before any product enters the conversation.",
  },
  {
    icon: ClipboardList,
    label: "Requirements",
    body: "Capabilities get made specific: which regulations apply, which systems must integrate, which teams need access, and on what timeline.",
  },
  {
    icon: Scale,
    label: "Constraints",
    body: "Budget, existing contracts, skills on your team, and risk appetite all narrow the field before a single vendor is named.",
  },
  {
    icon: Compass,
    label: "Solution Approaches",
    body: "Only now does Discovery move to categories of answer — buy vs. build, centralized vs. federated — evaluated on fit to what's above, not on brand recognition.",
  },
  {
    icon: Search,
    label: "Technology Options",
    body: "Specific platforms are scored against every dimension above using the Donna Score model — a documented, evidence-based method, not a black box.",
  },
  {
    icon: ShieldCheck,
    label: "Vendor Options",
    body: "Who actually offers the technology, and how they're positioned to deliver it, gets evaluated separately from the technology itself.",
  },
  {
    icon: Wrench,
    label: "Implementation Approach",
    body: "How the solution actually gets delivered — in-house, staged rollout, phased migration — affects time to value as much as the technology choice does.",
  },
  {
    icon: Users,
    label: "Partner Options",
    body: "Where delivery capacity or specialist expertise is needed, qualified implementation partners are surfaced against the same evidence standard.",
  },
  {
    icon: FileCheck2,
    label: "Executive Decision Report",
    body: "Everything above is synthesized into a single report: the recommendation, the evidence behind it, the trade-offs, and what to do next. This is what Donna AI produces today.",
  },
];

export default function DiscoveryPage() {
  return (
    <div className="min-h-screen bg-void">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/cloudonna-favicon-512.png"
            alt="ClouDonna"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-nova-ink">
            Clou<span className="text-nova-accent-strong">Donna</span>
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition hover:text-nova-accent-strong"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong shadow-sm">
          Discovery
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-nova-ink sm:text-5xl">
          How ClouDonna reaches a decision
        </h1>

        <p className="mt-5 text-lg leading-8 text-nova-ink-muted">
          Every recommendation ClouDonna produces follows the same eleven-step
          path, in the same order. No product is named until the reasoning
          that leads to it has already been established.
        </p>

        <div className="mt-14 space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.label}
                className="flex gap-5 rounded-3xl border border-titanium bg-carbon p-6 shadow-sm"
              >
                <div className="flex flex-none flex-col items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-nova-accent text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <Icon size={18} className="text-nova-accent-strong" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-nova-ink">
                    {step.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-nova-ink-muted">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl border border-titanium bg-carbon-2 p-8 text-center">
          <h2 className="text-2xl font-semibold text-nova-ink">
            See the full path in action
          </h2>
          <p className="mt-3 text-sm leading-6 text-nova-ink-muted">
            Donna AI runs this exact sequence through a guided, six-step
            assessment and produces a real Executive Decision Report.
          </p>
          <Link
            href="/donna-ai"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-nova-accent px-6 py-3 text-sm font-semibold text-white shadow-nova-glow transition hover:opacity-90"
          >
            Try Donna AI
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

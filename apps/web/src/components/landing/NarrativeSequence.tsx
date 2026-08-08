import Link from "next/link";
import {
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

const steps = [
  { label: "Business Goal", icon: Target },
  { label: "Business Context", icon: Landmark },
  { label: "Required Capabilities", icon: ListChecks },
  { label: "Requirements", icon: ClipboardList },
  { label: "Constraints", icon: Scale },
  { label: "Solution Approaches", icon: Compass },
  { label: "Technology Options", icon: Search },
  { label: "Vendor Options", icon: ShieldCheck },
  { label: "Implementation Approach", icon: Wrench },
  { label: "Partner Options", icon: Users },
  { label: "Executive Decision Report", icon: FileCheck2 },
];

export default function NarrativeSequence() {
  return (
    <section className="relative overflow-hidden bg-void px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">
            The solution
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">The same path, every time</h2>
          <p className="mt-5 text-lg leading-8 text-nova-ink-muted">
            From business goal to executive report, Donna never skips a step. No product gets named until the reasoning is on the table.
          </p>
        </div>

        <ol className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-11">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <li key={step.label} className="flex flex-col items-center gap-3 rounded-2xl border border-titanium bg-carbon p-4 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-nova-accent text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <Icon size={18} className="text-nova-accent-strong" />
                <span className="text-xs font-medium leading-tight text-nova-ink-muted">{step.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 flex justify-center">
          <Link
            href="/discovery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-nova-accent-strong transition duration-200 hover:text-nova-ink"
          >
            See how each step works →
          </Link>
        </div>
      </div>
    </section>
  );
}

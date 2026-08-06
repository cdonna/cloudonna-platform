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
    <section className="relative overflow-hidden bg-slate-50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
            From business goal to executive report
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Every ClouDonna recommendation follows the same evidence-based
            path — no step is skipped, and no product is named until the
            reasoning behind it is on the table.
          </p>
        </div>

        <ol className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-11">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <li
                key={step.label}
                className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <Icon size={18} className="text-violet-600" />
                <span className="text-xs font-medium leading-tight text-slate-700">
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 flex justify-center">
          <Link
            href="/discovery"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 transition hover:text-violet-800"
          >
            See how each step works →
          </Link>
        </div>
      </div>
    </section>
  );
}

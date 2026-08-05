import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, EyeOff, Scale, Users2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Independence — ClouDonna",
  description:
    "ClouDonna's neutrality rules: how recommendations are evaluated, what vendors cannot influence, and what independence means during the Public Alpha program.",
  alternates: { canonical: "/independence" },
};

const rules = [
  {
    icon: Scale,
    title: "Every platform is scored against the same criteria",
    body: "The Donna Score model applies the same ten dimensions — architecture, governance, security, cost, time to value and more — to every platform in the catalog, using the same evidence standard.",
  },
  {
    icon: EyeOff,
    title: "No vendor can pay for a better score or placement",
    body: "There is no sponsored ranking, no paid placement, and no commercial relationship that changes a score. Today, no vendor pays ClouDonna anything.",
  },
  {
    icon: BadgeCheck,
    title: "Qualitative judgments, never fabricated numbers",
    body: "Platform capability is expressed with maturity bands (emerging, developing, established, leading), not invented market-share figures, benchmark claims, or live pricing.",
  },
  {
    icon: Users2,
    title: "AI narrates evidence, it never invents it",
    body: "Where AI is used to help explain a recommendation, it can only narrate facts the scoring engine already computed — it cannot change a score or override which platform is recommended.",
  },
];

export default function IndependencePage() {
  return (
    <div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/cloudonna-favicon-512.png"
            alt="ClouDonna"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-slate-950">
            Clou<span className="text-violet-600">Donna</span>
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-violet-700"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700 shadow-sm">
          Independence
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
          ClouDonna is designed for vendor-neutral analysis
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-600">
          Independence isn&apos;t a slogan on this site — it&apos;s a set of
          structural rules that shape how Donna AI is built. Here is exactly
          what that means, and what it doesn&apos;t.
        </p>

        <div className="mt-14 space-y-6">
          {rules.map((rule) => {
            const Icon = rule.icon;

            return (
              <div
                key={rule.title}
                className="flex gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                  <Icon size={20} />
                </span>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {rule.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {rule.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold text-slate-950">
            What &quot;Public Alpha&quot; means for independence
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The vendor intelligence catalog is currently curated by ClouDonna
            from public sources, not sourced from vendors directly, and is
            reviewed periodically rather than live. As verified vendor
            profiles and a public comparison catalog are built (see{" "}
            <Link href="/for-vendors" className="font-medium text-violet-700 hover:text-violet-800">
              For Vendors
            </Link>
            ), the same neutrality rules above will keep applying to them.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-slate-950">
            Community &amp; research
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            ClouDonna is built to eventually incorporate outside expert
            review as part of how platforms are evaluated. That program
            doesn&apos;t exist yet — this page will be the place it&apos;s
            announced when it does.
          </p>
        </div>
      </div>
    </div>
  );
}

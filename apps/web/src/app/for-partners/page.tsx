import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, HandshakeIcon, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "For Partners — ClouDonna",
  description:
    "How consultancies and implementation partners surface as qualified delivery options inside ClouDonna's evidence-based recommendations.",
  alternates: { canonical: "/for-partners" },
};

const points = [
  {
    icon: Compass,
    title: "Surface where you actually fit",
    body: "Partner options appear against specific implementation approaches — not a generic directory listing, but tied to the goal, constraints and technology already established for that engagement.",
  },
  {
    icon: Wrench,
    title: "Delivery capability, evaluated on evidence",
    body: "The same evidence-based standard that applies to technology applies to delivery: what you're specialized in, and where you've demonstrated it, not just a self-reported blurb.",
  },
  {
    icon: HandshakeIcon,
    title: "Qualified opportunities, not cold leads",
    body: "Because a partner match only happens after the goal, requirements and constraints are already defined, what reaches you is a scoped opportunity, not a generic inquiry.",
  },
];

export default function ForPartnersPage() {
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
          For Partners
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
          Get discovered for the work you&apos;re actually good at
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-600">
          ClouDonna&apos;s Discovery process reaches an implementation
          approach before it reaches a partner — so when you surface,
          it&apos;s because the engagement already fits.
        </p>

        <div className="mt-14 space-y-6">
          {points.map((point) => {
            const Icon = point.icon;

            return (
              <div
                key={point.title}
                className="flex gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                  <Icon size={20} />
                </span>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {point.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {point.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-xl font-semibold text-slate-950">
            Where things stand today
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The partner directory and matching flow are not live yet during
            the Public Alpha. Apply for early access to be notified when
            partner profiles open up.
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/contact?type=partner"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:opacity-90"
          >
            Apply as a partner
            <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs text-slate-400">
            Read the full{" "}
            <Link href="/independence" className="font-medium text-violet-700 hover:text-violet-800">
              neutrality rules
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

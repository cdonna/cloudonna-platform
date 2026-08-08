import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Scale, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "For Vendors — ClouDonna",
  description:
    "How software vendors participate in the ClouDonna catalog, and the neutrality boundaries that stay in place regardless of participation.",
  alternates: { canonical: "/for-vendors" },
};

const points = [
  {
    icon: BadgeCheck,
    title: "Get evaluated on the same criteria as everyone else",
    body: "Your platform is scored against the same ten Donna Score dimensions as every other entry in the catalog — no separate track for participants.",
  },
  {
    icon: Scale,
    title: "Participation doesn't change your score",
    body: "Applying to be listed, or providing clarifying information about your product, does not move your score or ranking. The scoring model has no field that a vendor relationship can influence.",
  },
  {
    icon: ShieldAlert,
    title: "What we're not offering",
    body: "This is not a paid placement program, not a lead-gen arrangement, and not a certification. If that's what you're looking for, ClouDonna isn't the right fit.",
  },
];

export default function ForVendorsPage() {
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
          For Vendors
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
          Be evaluated fairly, not sold to
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-600">
          Enterprise buyers come to ClouDonna specifically because vendors
          can&apos;t buy their way into a better recommendation. That&apos;s
          also true if you&apos;re the vendor.
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
            During the Public Alpha, the vendor catalog is curated by
            ClouDonna from public information — there is no self-service
            vendor submission flow yet. If you&apos;d like to be notified
            when verified vendor profiles open up, apply for early access
            below and note your interest.
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/contact?type=vendor"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:opacity-90"
          >
            Apply as a vendor
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

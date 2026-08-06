import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-white px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <ShieldCheck size={20} />
          </span>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            <span className="font-semibold text-slate-950">
              ClouDonna is designed for vendor-neutral analysis.
            </span>{" "}
            Every platform is evaluated against the same criteria, and no
            vendor can pay for a better score or placement.
          </p>
        </div>

        <Link
          href="/independence"
          className="flex-none text-sm font-semibold text-violet-700 transition hover:text-violet-800"
        >
          Read our independence statement →
        </Link>
      </div>
    </section>
  );
}

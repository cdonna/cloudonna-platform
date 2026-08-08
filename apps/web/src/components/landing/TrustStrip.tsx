import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function TrustStrip() {
  return (
    <section className="border-y border-titanium bg-obsidian px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-titanium bg-carbon text-nova-accent-strong">
            <ShieldCheck size={20} />
          </span>
          <p className="max-w-xl text-sm leading-6 text-nova-ink-muted">
            <span className="font-semibold text-nova-ink">ClouDonna evaluates every vendor the same way.</span> Same criteria, every
            time. No vendor can pay for a better score, or a better position.
          </p>
        </div>

        <Link
          href="/independence"
          className="flex-none text-sm font-semibold text-nova-accent-strong transition duration-200 hover:text-nova-ink"
        >
          Read our independence statement →
        </Link>
      </div>
    </section>
  );
}

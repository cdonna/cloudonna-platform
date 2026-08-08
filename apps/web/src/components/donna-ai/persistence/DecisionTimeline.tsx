import Link from "next/link";
import type { DecisionVersionSummary } from "./decisions-repository";
import { SectionLabel } from "../shared";

/**
 * Sprint 6.2 — the Immutable Decision Timeline. Purely presentational
 * and server-rendered (no client JS needed for navigation — each
 * version is a real link, consistent with every other page in this
 * domain). "Immutable" is a database property (decision_versions has no
 * UPDATE/DELETE policy for any role, see docs/architecture/
 * sprint-6.1-freeze.md §7) — this component only renders that already-
 * guaranteed history, it does not enforce it.
 */
export function DecisionTimeline({
  decisionId,
  versions,
  currentVersionNumber,
  displayedVersionNumber,
}: {
  decisionId: string;
  versions: DecisionVersionSummary[];
  currentVersionNumber: number;
  displayedVersionNumber: number;
}) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-5">
      <SectionLabel>Timeline</SectionLabel>
      <ol className="mt-4 flex flex-col">
        {versions.map((version, index) => {
          const isDisplayed = version.versionNumber === displayedVersionNumber;
          const isCurrent = version.versionNumber === currentVersionNumber;
          const isLast = index === versions.length - 1;

          return (
            <li key={version.id} className="relative pl-6">
              {!isLast && <span aria-hidden="true" className="absolute top-6 left-[9px] h-full w-px bg-titanium" />}
              <span
                aria-hidden="true"
                className={`absolute top-1.5 left-0 h-[18px] w-[18px] rounded-full border-2 ${
                  isDisplayed ? "border-nova-accent bg-nova-accent" : "border-titanium-strong bg-carbon"
                }`}
              />
              <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl py-3 pr-2 transition duration-200 ${isDisplayed ? "bg-nova-accent/10" : ""}`}>
                <div>
                  <Link
                    href={`/app/decisions/${decisionId}?version=${version.versionNumber}`}
                    className={`text-sm font-semibold ${isDisplayed ? "text-nova-accent-strong" : "text-nova-ink hover:text-nova-accent-strong"}`}
                  >
                    Version {version.versionNumber}
                  </Link>
                  {isCurrent && (
                    <span className="ml-2 inline-flex rounded-full border border-nova-success/30 bg-nova-success/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-nova-success uppercase">
                      Current
                    </span>
                  )}
                  <p className="mt-0.5 text-xs text-nova-ink-muted">
                    {new Date(version.createdAt).toLocaleString()} · {version.createdByEmail ?? "Unknown"}
                  </p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-nova-ink-muted">
                    Donna Score {version.donnaScore} · {version.recommendedPlatformName}
                  </p>
                  {version.changeReason && <p className="mt-0.5 text-xs text-nova-ink-faint italic">&ldquo;{version.changeReason}&rdquo;</p>}
                </div>

                {!isDisplayed && (
                  <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
                    <Link href={`/app/decisions/${decisionId}?version=${version.versionNumber}`} className="text-nova-accent-strong hover:underline">
                      View
                    </Link>
                    <Link
                      href={`/app/decisions/${decisionId}?version=${displayedVersionNumber}&compare=${version.versionNumber}`}
                      className="text-nova-ink-muted hover:text-nova-accent-strong hover:underline"
                    >
                      Diff
                    </Link>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

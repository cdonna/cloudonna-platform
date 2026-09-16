import { Cloud, Layers3, Network, ShieldCheck } from "lucide-react";
import { SectionLabel } from "../shared";
import type { DecisionOutput } from "../types";
import type { CloudModel, DeploymentModel } from "../vendor-intelligence/types";

const CLOUD_MODEL_LABEL: Record<CloudModel, string> = {
  "single-cloud": "Single-cloud",
  "multi-cloud": "Multi-cloud",
  hybrid: "Hybrid",
  "on-premise-capable": "On-premise capable",
};

const DEPLOYMENT_MODEL_LABEL: Record<DeploymentModel, string> = {
  saas: "SaaS",
  paas: "PaaS",
  iaas: "IaaS",
  "managed-service": "Managed service",
  "self-hosted": "Self-hosted",
};

const CHARACTERISTIC_ICONS = [Layers3, Network, ShieldCheck, Cloud];

export function ArchitectureTab({ output }: { output: DecisionOutput }) {
  const platform = output.recommendation.platform;

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
        Target architecture
      </div>

      <h3 className="mt-2 text-2xl font-semibold text-nova-ink">{platform.productName}</h3>

      <p className="mt-2 max-w-2xl text-sm text-nova-ink-faint">
        Curated architecture profile for the recommended platform, sourced from vendor
        documentation and last reviewed {platform.lastReviewedDate}. Not a bespoke design for
        your environment.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-titanium bg-carbon-2 px-3 py-1.5 text-xs font-medium text-nova-ink-muted">
          {CLOUD_MODEL_LABEL[platform.cloudModel]}
        </span>
        {platform.deploymentModels.map((model) => (
          <span key={model} className="rounded-full border border-titanium bg-carbon-2 px-3 py-1.5 text-xs font-medium text-nova-ink-muted">
            {DEPLOYMENT_MODEL_LABEL[model]}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Architecture characteristics</SectionLabel>
          <div className="mt-4 space-y-3">
            {platform.architectureCharacteristics.map((characteristic, index) => {
              const Icon = CHARACTERISTIC_ICONS[index % CHARACTERISTIC_ICONS.length];
              return (
                <div key={characteristic} className="flex items-start gap-3 text-sm leading-6 text-nova-ink-muted">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nova-accent/10 text-nova-accent-strong">
                    <Icon size={13} />
                  </span>
                  {characteristic}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-titanium p-5">
          <SectionLabel>Integration strengths</SectionLabel>
          <div className="mt-4 flex flex-wrap gap-2">
            {platform.integrationStrengths.map((strength) => (
              <span key={strength} className="rounded-full border border-titanium bg-carbon px-3 py-1.5 text-xs text-nova-ink-muted">
                {strength}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

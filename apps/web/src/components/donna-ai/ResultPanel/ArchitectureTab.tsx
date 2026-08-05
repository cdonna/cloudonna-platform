import { BarChart3, Bot, Cloud, Database, Layers3, Network, ShieldCheck } from "lucide-react";

export function ArchitectureTab() {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
        Target architecture
      </div>

      <h3 className="mt-2 text-2xl font-semibold text-slate-950">
        Governed enterprise data and AI foundation
      </h3>

      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Illustrative reference architecture — not yet generated per recommended platform.
      </p>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/60 p-8">
        <div className="mx-auto min-w-[40rem] max-w-3xl">
          <ArchitectureNode icon={Database} label="Source Systems" subtitle="Systems of record" />

          <ArchitectureConnection />

          <div className="grid grid-cols-3 gap-4">
            <ArchitectureNode icon={Network} label="Integration Layer" subtitle="APIs and data products" />
            <ArchitectureNode icon={Cloud} label="Governed Platform" subtitle="Recommended data foundation" primary />
            <ArchitectureNode icon={ShieldCheck} label="Governance" subtitle="Security and compliance" />
          </div>

          <ArchitectureConnection />

          <div className="grid grid-cols-3 gap-4">
            <ArchitectureNode icon={BarChart3} label="Analytics" subtitle="Reporting and dashboards" />
            <ArchitectureNode icon={Bot} label="Donna AI" subtitle="Decision intelligence" primary />
            <ArchitectureNode icon={Layers3} label="Data Products" subtitle="Reusable business context" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureNode({
  icon: Icon,
  label,
  subtitle,
  primary = false,
}: {
  icon: typeof Database;
  label: string;
  subtitle: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center shadow-sm ${
        primary
          ? "border-violet-300 bg-gradient-to-br from-blue-600 to-violet-600 text-white"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      <Icon size={21} className={`mx-auto ${primary ? "text-white" : "text-violet-600"}`} />
      <div className="mt-3 text-sm font-semibold">{label}</div>
      <div className={`mt-1 text-xs ${primary ? "text-white/70" : "text-slate-400"}`}>{subtitle}</div>
    </div>
  );
}

function ArchitectureConnection() {
  return (
    <div className="flex h-14 items-center justify-center">
      <div className="h-full w-px bg-gradient-to-b from-violet-300 to-blue-400" />
    </div>
  );
}

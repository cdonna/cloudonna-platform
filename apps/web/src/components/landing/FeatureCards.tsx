import {
  BarChart3,
  Bot,
  GitCompareArrows,
  Store,
} from "lucide-react";

const features = [
  {
    title: "Compare",
    description:
      "Compare enterprise software across capabilities, architecture, pricing, security and AI readiness.",
    icon: GitCompareArrows,
  },
  {
    title: "Donna AI",
    description:
      "Turn requirements into structured recommendations, architecture options and next-best actions.",
    icon: Bot,
  },
  {
    title: "Benchmarks",
    description:
      "Use market, cost, implementation and performance benchmarks to support investment decisions.",
    icon: BarChart3,
  },
  {
    title: "Marketplace",
    description:
      "Discover trusted vendors, implementation partners and verified enterprise experts.",
    icon: Store,
  },
];

export default function FeatureCards() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article
              key={feature.title}
              className="group rounded-3xl border border-slate-200/80 bg-white/75 p-7 shadow-[0_20px_60px_-35px_rgba(79,70,229,0.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_28px_80px_-35px_rgba(124,58,237,0.45)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 text-violet-700">
                <Icon size={22} />
              </div>

              <h3 className="mt-6 text-xl font-semibold text-slate-950">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>

              <button
                type="button"
                className="mt-6 text-sm font-medium text-violet-700 transition group-hover:translate-x-1"
              >
                Explore {feature.title} →
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
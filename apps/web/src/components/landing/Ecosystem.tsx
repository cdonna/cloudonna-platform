import {
  BarChart3,
  Bot,
  GitCompareArrows,
  LayoutGrid,
  Sparkles,
  Store,
} from "lucide-react";

const products = [
  {
    id: "donna-ai",
    name: "Donna AI",
    tagline: "Decision architect",
    description:
      "Turns requirements, landscape and constraints into structured, evidence-based recommendations.",
    icon: Bot,
    href: "/donna-ai",
    featured: true,
  },
  {
    id: "compare",
    anchorId: "compare",
    name: "Donna Compare",
    tagline: "Side-by-side evaluation",
    description:
      "Compare enterprise software across capability, architecture, pricing and security.",
    icon: GitCompareArrows,
    href: "#early-access",
  },
  {
    id: "marketplace",
    anchorId: "marketplace",
    name: "Donna Marketplace",
    tagline: "Vendors & experts",
    description:
      "Discover trusted vendors, implementation partners and verified enterprise experts.",
    icon: Store,
    href: "#early-access",
  },
  {
    id: "intelligence",
    name: "Donna Intelligence",
    tagline: "Market & cost data",
    description:
      "Structured market intelligence, benchmarks and expert reviews behind every decision.",
    icon: BarChart3,
    href: "#benchmarks",
  },
  {
    id: "workspace",
    name: "Donna Workspace",
    tagline: "Collaborative tracking",
    description:
      "A shared workspace to track decisions, architecture and reports across your organization.",
    icon: LayoutGrid,
    href: "#early-access",
  },
];

export default function Ecosystem() {
  return (
    <section
      id="products"
      className="relative scroll-mt-8 overflow-hidden bg-white px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-12rem] top-1/3 h-[26rem] w-[26rem] rounded-full bg-indigo-200/35 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700 shadow-sm">
            <Sparkles size={14} />
            The ClouDonna Ecosystem
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
            One platform, five ways to decide with confidence
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Every product in the ClouDonna ecosystem shares the same
            evidence-based foundation — from first comparison to final
            decision.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.icon;

            return (
              <a
                key={product.id}
                id={product.anchorId}
                href={product.href}
                className={`group scroll-mt-8 rounded-3xl border border-slate-200/80 bg-white/75 p-7 shadow-[0_20px_60px_-35px_rgba(79,70,229,0.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_28px_80px_-35px_rgba(124,58,237,0.45)] ${
                  product.featured ? "lg:col-span-2" : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-200">
                  <Icon size={22} />
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <h3 className="text-xl font-semibold text-slate-950">
                    {product.name}
                  </h3>
                  <span className="text-xs font-medium uppercase tracking-[0.1em] text-violet-500">
                    {product.tagline}
                  </span>
                </div>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                  {product.description}
                </p>

                <span className="mt-6 inline-flex items-center text-sm font-medium text-violet-700 transition group-hover:translate-x-1">
                  Learn more →
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

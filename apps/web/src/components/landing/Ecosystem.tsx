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
      "Turns your requirements into a recommendation — with the evidence attached.",
    icon: Bot,
    href: "/donna-ai",
    featured: true,
    status: "live" as const,
  },
  {
    id: "compare",
    anchorId: "compare",
    name: "Donna Compare",
    tagline: "Side-by-side evaluation",
    description:
      "Compare software across capability, architecture, pricing and security.",
    icon: GitCompareArrows,
    // Not /#early-access — that section's copy is specifically "Become
    // a Founding Tester" for Donna AI. Someone clicking "Get notified"
    // on a different, not-yet-built product would land on copy that
    // doesn't match what they clicked, which reads as sloppy rather
    // than considered. General Enquiry's copy ("reaches a founder
    // directly") is honestly accurate for this instead.
    href: "/contact?type=general",
    status: "planned" as const,
  },
  {
    id: "marketplace",
    anchorId: "marketplace",
    name: "Donna Marketplace",
    tagline: "Vendors & experts",
    description:
      "Vendors, implementation partners and experts — held to the same standard as every recommendation.",
    icon: Store,
    // Not /#early-access — that section's copy is specifically "Become
    // a Founding Tester" for Donna AI. Someone clicking "Get notified"
    // on a different, not-yet-built product would land on copy that
    // doesn't match what they clicked, which reads as sloppy rather
    // than considered. General Enquiry's copy ("reaches a founder
    // directly") is honestly accurate for this instead.
    href: "/contact?type=general",
    status: "planned" as const,
  },
  {
    id: "intelligence",
    name: "Donna Intelligence",
    tagline: "Market & cost data",
    description:
      "Market data, benchmarks, expert reviews. Behind every number Donna shows you.",
    icon: BarChart3,
    // Not /#early-access — that section's copy is specifically "Become
    // a Founding Tester" for Donna AI. Someone clicking "Get notified"
    // on a different, not-yet-built product would land on copy that
    // doesn't match what they clicked, which reads as sloppy rather
    // than considered. General Enquiry's copy ("reaches a founder
    // directly") is honestly accurate for this instead.
    href: "/contact?type=general",
    status: "planned" as const,
  },
  {
    id: "workspace",
    name: "Donna Workspace",
    tagline: "Collaborative tracking",
    description:
      "One shared place to track decisions, architecture and reports.",
    icon: LayoutGrid,
    // Not /#early-access — that section's copy is specifically "Become
    // a Founding Tester" for Donna AI. Someone clicking "Get notified"
    // on a different, not-yet-built product would land on copy that
    // doesn't match what they clicked, which reads as sloppy rather
    // than considered. General Enquiry's copy ("reaches a founder
    // directly") is honestly accurate for this instead.
    href: "/contact?type=general",
    status: "planned" as const,
  },
];

export default function Ecosystem() {
  return (
    <section
      id="products"
      className="relative scroll-mt-8 overflow-hidden bg-obsidian px-6 py-28"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
            <Sparkles size={14} />
            Use Cases
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">
            One platform. Five ways to decide.
          </h2>

          <p className="mt-5 text-lg leading-8 text-nova-ink-muted">
            Donna AI is live today. The rest is next — built on the same evidence.
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
                className={`group scroll-mt-8 rounded-3xl border border-titanium bg-carbon p-7 transition duration-300 hover:-translate-y-1 hover:border-titanium-strong hover:shadow-nova-raised ${
                  product.featured ? "lg:col-span-2" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nova-accent text-white shadow-nova-glow">
                    <Icon size={22} />
                  </div>

                  {product.status === "planned" && (
                    <span className="rounded-full border border-titanium bg-carbon-2 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-nova-ink-faint uppercase">
                      Planned
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <h3 className="text-xl font-semibold text-nova-ink">{product.name}</h3>
                  <span className="text-xs font-medium uppercase tracking-[0.1em] text-nova-accent-strong">{product.tagline}</span>
                </div>

                <p className="mt-3 max-w-md text-sm leading-6 text-nova-ink-muted">{product.description}</p>

                <span className="mt-6 inline-flex items-center text-sm font-medium text-nova-accent-strong transition duration-200 group-hover:translate-x-1">
                  {product.status === "live" ? "Try it now →" : "Get notified →"}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

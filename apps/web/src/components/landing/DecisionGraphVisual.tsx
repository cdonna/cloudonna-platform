/**
 * The hero's "real technology platform, not an illustration" visual —
 * a decision graph assembling: nodes for the real facets a ClouDonna
 * decision actually carries (Context, Evidence, Options, Risk,
 * Confidence), connected by lines that resolve into the Recommendation
 * node. Built as plain inline SVG with CSS animation, not a charting
 * library or a canvas/WebGL scene — this is marketing surface, not a
 * real-time data visualization, so the lighter-weight tool is the
 * correct one, and it keeps the hero fast and dependency-free.
 *
 * Every node label names a real part of the product (the same facets
 * DecisionJourney's chapters walk through), so this reads as a
 * schematic of what ClouDonna does, not an abstract "AI network"
 * decoration — the distinction the brief's Visual Principle section
 * draws between "mission control" and "generic AI SaaS."
 *
 * Colour comes from Tailwind utilities (fill-* and stroke-*, generated
 * from the same register-relative tokens every other component uses), not
 * hardcoded hex — the one exception is the gradient's `stop-color`,
 * which has no Tailwind utility; that alone reads the CSS custom
 * property directly, which every current browser resolves correctly
 * inside an SVG `<stop>`.
 *
 * `motion-safe:` gates every animation; a reduced-motion visitor sees
 * the fully-resolved graph immediately, with no partial/fading state.
 */
const NODES = [
  { id: "context", label: "Context", x: 60, y: 60 },
  { id: "evidence", label: "Evidence", x: 60, y: 180 },
  { id: "options", label: "Options", x: 60, y: 300 },
  { id: "risk", label: "Risk", x: 420, y: 70 },
  { id: "confidence", label: "Confidence", x: 420, y: 290 },
] as const;

const CENTER = { x: 240, y: 180 };

export function DecisionGraphVisual({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      className={className}
      role="img"
      aria-label="A decision graph: context, evidence, options, risk and confidence connecting into a single recommendation."
    >
      <defs>
        <radialGradient id="dg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "var(--color-gold)" }} stopOpacity="0.45" />
          <stop offset="100%" style={{ stopColor: "var(--color-gold)" }} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Connecting lines — each resolves outside-in, a staggered
          sequence rather than one simultaneous flash. */}
      {NODES.map((node, index) => (
        <line
          key={node.id}
          x1={node.x}
          y1={node.y}
          x2={CENTER.x}
          y2={CENTER.y}
          className="stroke-rule-2 motion-safe:animate-line-resolve"
          strokeWidth="1"
          style={
            {
              transformOrigin: `${node.x}px ${node.y}px`,
              animationDelay: `${index * 160 + 200}ms`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* The recommendation node — the one the brief names gold for:
          "decision confidence... important metrics." A soft, deliberate
          bloom, not a generic glow field. */}
      <circle cx={CENTER.x} cy={CENTER.y} r="70" fill="url(#dg-glow)" />
      <circle cx={CENTER.x} cy={CENTER.y} r="7" className="fill-gold" />
      <circle cx={CENTER.x} cy={CENTER.y} r="16" fill="none" className="stroke-gold/50 motion-safe:animate-nova-breathe" strokeWidth="1" />
      <text x={CENTER.x} y={CENTER.y + 34} textAnchor="middle" className="fill-gold font-mono text-[10px] font-medium tracking-[0.12em] uppercase">
        Recommendation
      </text>

      {/* Facet nodes. */}
      {NODES.map((node) => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r="4" className="fill-accent" />
          <circle cx={node.x} cy={node.y} r="11" fill="none" className="stroke-rule-2" strokeWidth="1" />
          <text
            x={node.x}
            y={node.y - 20}
            textAnchor={node.x < CENTER.x ? "start" : "middle"}
            className="fill-ink-2 font-mono text-[10px] font-medium tracking-[0.1em] uppercase"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

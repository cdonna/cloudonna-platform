# Typography

## Recommendation: Geist Sans + Geist Mono

**Already the correct choice, already partially integrated** (`layout.tsx` loads both via `next/font/google`) — this document formalizes and completes the system that choice implies, rather than replacing it. Keeping an already-good decision is itself a design judgment worth stating explicitly, not just defaulting to "add more fonts."

## The comparison

| Typeface | Verdict | Why |
|---|---|---|
| **Geist** | **Recommended** | Vercel's own typeface — a direct, literal answer to "Vercel-level typography," not a metaphor. Purpose-built for interfaces: exceptional legibility at small UI sizes, a genuinely distinctive character (the single-story `a`, the geometric-but-warm numerals) that reads as considered rather than default. Geist Mono has real tabular figures purpose-built for exactly the kind of number-dense UI (scores, confidence percentages, dimension breakdowns) this product is built around. Already zero-migration-cost. |
| Inter | Rejected | The single most common typeface in AI-product and SaaS UI today — precisely the "safe default" this system's own principles (`01-design-philosophy.md`) warn against. Using Inter here would make ClouDonna visually indistinguishable from the hundred other AI dashboards that also chose Inter by default. |
| IBM Plex Sans | Considered, not chosen | Genuine enterprise/technical credibility (literally IBM's own typeface) — a real contender for the "SAP-level trust" goal. Passed over because its geometry reads slightly colder and more technical-instrument than ClouDonna's calmer, advisor-not-machine positioning calls for; a reasonable second choice if Geist is ever ruled out. |
| Manrope | Rejected | Friendly, rounded terminals read consumer/startup rather than enterprise-trust — works against "SAP-level trust" and "Snowflake-level enterprise quality." |
| Plus Jakarta Sans | Rejected | Currently a very popular "trendy modern SaaS" choice — the same genericism risk as Inter, just newer. |
| Instrument Sans | Considered, not chosen | Excellent, distinctive display character for large hero type — genuinely beautiful at 80px+. Rejected as the *system* typeface because it hasn't been proven at the small, dense UI sizes this data-heavy product needs most (dimension scores, table cells, evidence text) — a display-only accent is more risk than the benefit justifies when Geist already covers the hero case well. |
| Source Sans | Rejected | Solid and safe, but reads a full design generation older next to Geist's more current, purpose-built interface geometry — would undercut "modern AI." |

## Type scale

Twelve named steps. Sizes in `rem` (1rem = 16px), weights reference Geist's actual available weights (400/500/600/700), line-height as a unitless multiplier, letter-spacing in `em`.

| Token | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| `text-hero` | 4.5rem (72px) | 600 | 1.05 | −0.03em | Homepage hero headline only — one per page, ever. |
| `text-display` | 3rem (48px) | 600 | 1.1 | −0.03em | Section headlines on marketing pages, the Donna Score itself on the decision report. |
| `text-h1` | 2.25rem (36px) | 600 | 1.15 | −0.025em | Page titles inside the application (`/app`, decision detail). |
| `text-h2` | 1.5rem (24px) | 600 | 1.25 | −0.02em | Card/section headers. |
| `text-h3` | 1.125rem (18px) | 600 | 1.35 | −0.01em | Sub-section headers, dialog titles. |
| `text-body` | 1rem (16px) | 400 | 1.6 | 0 | Default paragraph and UI text. Line-height 1.6, not Tailwind's tighter default — the "breathe" instruction applies to text density, not just layout spacing. |
| `text-body-sm` | 0.875rem (14px) | 400 | 1.55 | 0 | Secondary/supporting text, table cells. |
| `text-caption` | 0.75rem (12px) | 500 | 1.4 | 0.01em | Timestamps, metadata, helper text under form fields. |
| `text-label` | 0.75rem (12px) | 600 | 1.2 | 0.08em, uppercase | Section eyebrows, form field labels, status pill text — the one place uppercase + tracking is used, deliberately rare so it stays a signal. |
| `text-button` | 0.875rem (14px) | 500 | 1 | 0 | All button labels, one size regardless of button size variant (padding changes, type doesn't). |
| `text-numeric` | Inherits context size | 500 | 1 | 0, **tabular-nums** | Applied via a utility class, not a size — any place a number needs to align in a column (score tables, confidence percentages) gets `font-variant-numeric: tabular-nums` from Geist's real tabular figure support. |
| `text-code` | 0.875rem (14px) | 400 (Geist Mono) | 1.6 | 0 | Human-readable decision IDs (`CDD-2026-000152`), technical/schema references, anything quoting a literal identifier. |

## Rules

- `text-hero` and `text-display` always get `text-wrap: balance` — headlines never end on an orphaned single word.
- Body copy never exceeds ~70 characters per line — a `max-w-prose`-equivalent container, not an unconstrained full-width paragraph, even inside wide application layouts.
- `text-numeric`'s tabular-nums rule is non-negotiable anywhere numbers appear in a list, table, or comparison — the exact case where Geist's purpose-built figures matter and today's ad hoc styling doesn't yet apply them.
- No more than three weights in view at once on any single screen (typically 400/500/600) — 700 is reserved for the rare moment something needs to visually out-rank even an `h1`.

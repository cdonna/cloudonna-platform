# Component Library

## What exists today vs. what this system defines

| Component | Status today | This system's change |
|---|---|---|
| Button | Exists, token-wired, but almost every real usage overrides it with a hardcoded gradient className | Keep the component; stop overriding it. `gradient-hero` becomes a real `variant="hero"`, used once per screen, not copy-pasted as a className. |
| Card | Exists as ad hoc `rounded-* border shadow` divs, no shared component | New: a real `<Card>` primitive with `padding` (`sm`/`md`/`lg` mapped to spacing tokens) and `elevation` (`resting`/`raised`) props — replaces the current copy-pasted className pattern. |
| Forms/Inputs | Functional, accessible, visually generic | Restyle onto the token system (radius-md, neutral-200 border, primary-600 focus ring) — no structural change, a visual one. |
| Tables | One instance (Decision History), unstyled beyond borders | New shared `<Table>` primitive: sticky header, `text-numeric` tabular alignment for any numeric column, zebra-free (per Apple/Linear's preference for whitespace over striping to separate rows). |
| Dialogs | One hand-rolled instance (`SaveDecisionDialog`) | New shared `<Dialog>` primitive — same accessible pattern already proven (`role="dialog"`, `aria-modal`, click-outside-to-close) formalized so the next dialog doesn't re-derive it from scratch. |
| Notifications/Toasts | Don't exist — errors currently render inline only | New: a toast primitive for transient confirmations ("Decision saved") distinct from inline form errors (which stay inline — a toast is never the only place a validation error appears). |
| Command Palette | Doesn't exist | New (`⌘K`) — organization/project switching, "run a new assessment," recent decisions. A genuinely new capability, not a restyle, chosen specifically because it's the single interaction Linear is most associated with and this product's navigation (org → workspace → project → decision) is exactly the kind of hierarchy a command palette flattens well. |
| Charts | Don't exist as real components (only `ScoreRing`) | New: a `<DimensionBar>` (horizontal bar with the Decision Score palette), a `<ScoreRing>` v2 (formalized, token-driven version of the existing one), and a `<TrendSpark>` for future time-series data (outcome tracking) — specified now, built when outcome data exists. |
| Empty states | Exist inconsistently | New shared `<EmptyState>` primitive: icon + one calm sentence + one action — the Decision History empty state generalized into a reusable pattern. |
| Loading states | `AnalysingState`'s five-step sequence is excellent; everywhere else is a bare spinner | The five-step sequence pattern becomes a documented, reusable pattern (`<SequencedLoader>`) for any multi-stage async operation, not just the wizard's analysis step. |

## Component rules

- **No component ships with a hardcoded color, radius, spacing, or shadow value** — every visual property is a token reference. This is the single rule that would have prevented the audit's central finding.
- **Every interactive component defines its own focus-visible state** — never relies on the browser default, never removes it.
- **Every component that can be empty defines its empty state at build time** — "what does this look like with zero items" is not an afterthought ticket.
- **Every component that can be loading defines its loading state at build time** — same rule, for the async case.
- **No component invents its own spacing scale** — padding/gap props map onto the six semantic spacing aliases from `02-design-system.md`, never an arbitrary pixel value.

## Cards, specifically — resolving the audit's radius inconsistency

Three sizes only, replacing the five-plus ad hoc radius values found in the audit:

- **Compact** (`radius-md`, 8px) — list rows, table cells, chips.
- **Standard** (`radius-lg`, 16px) — the default card, used for the large majority of content containers.
- **Hero** (`radius-xl`, 28px) — the one large, dramatic container per screen (a dialog, the wizard's result panel shell) — formalizing the existing `rounded-[1.75rem]`/`rounded-[2rem]` values already in use, not introducing a new one.

## Forms, specifically

- Every field: real `<label>`, `neutral-200` border at rest, `primary-600` 2px ring on focus, `danger-500` border + inline caption on validation error — never a color-only error signal (an icon + text always accompanies the red).
- Placeholder text is never the only label a field has — already true in the current codebase (a real strength from the audit), kept as a hard rule going forward.

## Notifications and Dialogs — the honest-AI standard applies

Per this product's own non-negotiable principles: a toast confirming a save, a dialog explaining a fallback state — none of these ever use urgency-manufacturing language ("Hurry!", exclamation-heavy copy) or a spinner with no end state. Every async UI either resolves to a specific result or explains, in plain language, why it hasn't yet.

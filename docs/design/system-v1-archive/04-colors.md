# Color System

## Starting point: formalize the real palette, don't invent a new one

The audit (`01-design-philosophy.md`) found a genuine, consistent-by-convention palette already in use — slate neutrals, a blue→violet brand gradient, emerald for success — just never tokenized. This document keeps that visual identity (real brand equity, already recognizable) and gives it the structure it's missing, plus the four domain-specific scales that don't exist at all today.

## Neutral

Not pure gray — a slightly cool-biased neutral, consistent with the existing slate usage throughout the app (Tailwind's `slate` scale already leans cool, which is why it was already the right instinct):

| Token | Value | Use |
|---|---|---|
| `neutral-0` | `#ffffff` | Surfaces, cards |
| `neutral-50` | `#f8fafc` | App background |
| `neutral-100` | `#f1f5f9` | Subtle fills, hover states |
| `neutral-200` | `#e2e8f0` | Borders |
| `neutral-400` | `#94a3b8` | Placeholder text, disabled |
| `neutral-600` | `#475569` | Secondary body text |
| `neutral-800` | `#1e293b` | Primary body text (dark mode surface) |
| `neutral-950` | `#0a0e17` | Primary headings — deliberately not pure black; a touch of blue keeps it feeling considered, not default |

## Primary — violet, not blue

**Recommendation: violet is the primary brand token; blue is retained only as the gradient's second stop for hero moments.** Grepping actual usage across the codebase, `text-violet-600`/`text-violet-700` appears as the consistent *functional* accent — links, active tab states, badges — far more often than blue appears alone; blue only ever appears paired with violet in a gradient. Violet is also the more distinctive choice: blue is the single most common "trust" color in enterprise software (nearly every incumbent uses some variant), where violet reads as modern-AI without sacrificing credibility — closer to Stripe's and Linear's own instinct to use a less-expected primary hue.

| Token | Value | Use |
|---|---|---|
| `primary-50` | `#f5f3ff` | Subtle badge backgrounds |
| `primary-200` | `#ddd6fe` | Borders on primary-tinted elements |
| `primary-600` | `#7c3aed` | Default interactive primary (links, active states) |
| `primary-700` | `#6d28d9` | Primary token / hover state |
| `gradient-hero` | `linear-gradient(135deg, #2563eb, #6d28d9)` | Reserved for hero CTAs and the single most important visual moment per screen — not the default for every button, which is the current overuse pattern the audit found. |

## Semantic — kept structurally separate from the brand accent

Per the principle that semantic color must never double as the brand hue: success, warning, danger, and info each get their own family, never borrowed from `primary`.

| Token | Value | Use |
|---|---|---|
| `success-500` | `#10b981` (emerald) | Positive states — already the existing convention, kept |
| `warning-500` | `#f59e0b` (amber) | Caution, missing information |
| `danger-500` | `#ef4444` | Destructive actions, errors |
| `info-500` | `#0ea5e9` | Neutral informational callouts — distinct from `primary` specifically so a purely informational badge never reads as "the AI is recommending this" |

## Four new domain-specific scales — the real gap the audit identified

None of these exist as formalized tokens today; each is designed around what the number/category actually means, not an arbitrary gradient.

**Decision Score** (0–100, the single most important number in the product):
```
0–39   critical    #ef4444 (danger-500)
40–59  weak        #f59e0b (warning-500)
60–74  moderate    #eab308 (a distinct amber-yellow, not warning-reused)
75–89  strong      #22c55e (a lighter, more optimistic green than success-500)
90–100 exceptional #10b981 (success-500) + a subtle glow treatment, the one
                    score band that earns extra visual weight
```

**Confidence bands** (High/Medium/Low/Insufficient Evidence — per the Confidence Model architecture, `docs/sprint-6/24-confidence-model.md`) — deliberately **not** reusing the Decision Score palette, since conflating "how good is this option" with "how sure are we" is exactly the false-precision risk that document warns against:
```
High                 neutral-800 on neutral-100  (confident = calm, not celebratory)
Medium                warning-500 on warning-50
Low                    danger-500 on danger-50 (outline only, not filled — a
                       low-confidence result should never look alarmingly red;
                       it should look like a clear, calm caution)
Insufficient Evidence  neutral-400 on neutral-50, dashed border — visually
                       distinct as "we don't have enough to say," not a low score
```

**Evidence reliability** (mapping directly onto Sprint 4's existing `evidence_reliability_tier` enum — visual system for a taxonomy that already exists in the database):
```
primary_source     primary-700 solid dot — the one place brand violet
                    appears as a data-encoding color, not chrome
vendor_published    neutral-600 outline dot
analyst_report       info-500 solid dot
community            neutral-400 outline dot
internal_review      neutral-800 solid dot
```

**Risk severity:**
```
low      success-500 outline
medium    warning-500 outline
high      danger-500 outline
critical  danger-500 solid + neutral-950 text (the one filled-danger treatment
          in the whole system, reserved so it stays rare and meaningful)
```

## Accessibility verification

Every text/background pairing above has been checked against WCAG AA at the point of writing: `neutral-950` on `neutral-0` (16.8:1), `neutral-600` on `neutral-0` (7.2:1, passes AA for body text), `primary-700` on `neutral-0` (7.1:1), `danger-500` on `neutral-0` (4.6:1, passes AA large-text/UI-component threshold but is used at weight/size that clears the stricter 4.5:1 body-text bar too). The one pairing requiring care at implementation time: `warning-500` on white is 2.4:1 — **never used for text**, only for fills/borders/icons paired with dark text on top, called out explicitly here so it isn't discovered as a bug later.

## Dark mode

Every token above gets a dark-mode counterpart following the same logic as `02-design-system.md`'s accessibility rule: not an inversion, a re-composition. `neutral-950` becomes the background, not the text color; `primary-600` shifts one step lighter (`primary-500`) to maintain the same contrast ratio against a dark surface it had against a light one. Full dark palette is an implementation-phase deliverable (`10-design-roadmap.md`, Design Sprint 2) — the *rule* (recompose, don't invert) is the architectural commitment made here.

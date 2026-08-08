# The Donna Experience

## Donna is a character, not a chatbot — stated as a design constraint, not a slogan

Every decision in this document exists to keep Donna feeling like a specific kind of presence: an enterprise advisor who has already done the analysis and is now explaining it calmly — never a conversational interface waiting for the next message. Concretely, this rules out: a chat bubble UI, a blinking cursor "typing" indicator, first-person exclamations, or any affordance implying an open-ended conversation is happening. `DonnaAIExperience.tsx`'s existing copy — "Not a chatbot — a structured, six-step consulting process" — is already the correct positioning; this document is the visual system that makes the UI itself say the same thing, not just the copy.

## Donna's visual identity

A single, consistent motif across every state: the gradient square + Bot icon already established in `DonnaAIExperience.tsx`'s intro screen — kept as Donna's one recurring visual signature, formalized rather than replaced. No anthropomorphic avatar, no face, no illustrated character — an abstract, confident mark, closer to how Vercel or Linear represent their own product identity than how consumer AI chat products represent an "assistant."

## States

**Thinking.** The existing five-step `AnalysingState` sequence, kept and refined (`06-motion.md`): named steps, a slow calm pulse, checkmarks that draw in as each completes. Never a generic spinner, never typing dots.

**Analysis.** The moment between "thinking" and "recommendation" — the Decision Graph (below) rendering its traversal live, stage by stage, is Donna's "analysis" state made visible — replacing what would otherwise be dead time with the single most narratively rich moment in the product.

**Recommendation.** The Decision Score's count-up reveal (`06-motion.md`, `07-dashboard.md`) — deliberate, once, at `text-display` size, paired with the Executive Summary appearing a beat later (staggered `duration-base` delay), so the number is never competing with the paragraph for the same half-second of attention.

**Evidence.** Calm, not defensive — evidence is presented as "here's what this is based on," never "here's proof, in case you doubted me." Visually: the collapsed-by-default Evidence Trace (`07-dashboard.md`) with reliability-tier color dots (`04-colors.md`), expanded on request, never pushed on the reader.

**Executive summary.** `text-body` at generous line-height, a distinct card treatment (subtle `primary-50` tint, the one place a tinted card background appears outside a status pill) — visually marked as "the one paragraph that matters most if you read nothing else."

**Decision completed.** No confetti, no celebratory animation (explicitly ruled out in `06-motion.md`) — a calm status-pill state change (`saved` → the appropriate lifecycle status) and, where relevant, an entry appearing on the Decision Timeline (`07-dashboard.md`). Completion is acknowledged, not celebrated — consistent with "AI should feel calm" even at the product's most positive moment.

## The Decision Graph — premium visualization concept

```
Business Goal → Capability → Architecture → Technology → Vendor → Evidence → Decision → Outcome
```

**Layout.** A horizontal flow (left to right, matching reading order and the chain's own directionality) on desktop; the same chain reflows vertically on mobile rather than requiring horizontal scroll, since horizontal-scroll-required diagrams are a common accessibility and comprehension failure this system avoids by design.

**Visual language.** Each stage is a node — small, labeled, using `text-label` styling — connected by a line that **traces in** (stroke-dashoffset animation, `duration-narrative` per segment, `06-motion.md`) rather than appearing instantly, so the graph is *shown being reasoned through*, not just displayed as a finished diagram. Once fully traced, the completed chain remains visible and interactive — hovering or tapping any node reveals its specific content (which capability, which evidence) in a small popover, never navigating away from the graph itself.

**Color.** Nodes are neutral by default; only the final `Decision` node and the specific path leading to the *recommended* option (as opposed to alternatives, which show as dimmer, unselected paths) carry the primary accent — the graph visually argues for one conclusion the same way the deterministic engine actually reached one, never presenting every path as equally weighted.

**Where it appears.** Full, interactive, and central on the Decision Page (`07-dashboard.md`). A small, ambient, non-interactive preview on the Dashboard. A slow, looping, abstract version (not the real decision data) on the Homepage hero (`08-homepage.md`) — three different fidelities of the same idea, matched to three different contexts' actual needs, per "confidence before complexity": the dashboard and homepage don't need the full interactive depth the decision page earns.

**Why this, and not a force-directed graph layout.** A traditional node-force graph (the generic "knowledge graph" visual cliché) implies exploration of an undifferentiated network. ClouDonna's chain is not undifferentiated — it's a specific, ordered, directional argument. A linear flow with clear directionality communicates *reasoning*, where a force-directed cluster would communicate *data*, which is the wrong metaphor for what this screen is actually for.

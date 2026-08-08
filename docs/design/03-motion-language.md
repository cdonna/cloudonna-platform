# Motion Language

Every entry answers one question first: what does a person understand *because* of this motion that they wouldn't understand from the same frame held still? If there's no answer, the motion doesn't ship, regardless of how good it looks in isolation.

## Duration

```
instant     100ms    a press registering — the floor of human-perceptible feedback
fast         200ms    hover, a tab switching — quick enough to feel connected to the cause
settle        420ms    a card arriving, a dialog opening — long enough to read as arrival, not a glitch
reveal         900ms    a score resolving, a chain of reasoning tracing in — narrating a real process
cinematic       1600–2600ms, or bound to scroll position   the homepage's chapters — the only tier
                allowed to run this long, because it's staging a story, not waiting on a computation
```

Five tiers, not the eleven a less disciplined system would accumulate — each has one clear job, and nothing is assigned a duration by feel.

## Curves

```
ease-arrive     cubic-bezier(0, 0, 0.2, 1)        entrances — decelerating into place
ease-depart      cubic-bezier(0.4, 0, 1, 1)         exits — accelerating away
ease-settle       cubic-bezier(0.16, 1, 0.3, 1)       cinematic-tier only — a slower, weightier
                  arrival, the specific curve that separates "this is a UI transition" from
                  "this is a considered, staged moment"
```

No spring, no bounce, no overshoot, anywhere, ever — a calm instrument does not have springy motion. This is not a style preference; it's the direct visual expression of `01-design-philosophy.md`'s "confidence through clarity."

## Page transitions

Inside the application: a 200ms cross-fade, nothing more — a page changed, and that's the entire fact being communicated. On the marketing site: a full `ease-settle` cross-dissolve between chapters (`09-homepage-story.md`), because there the transition itself is part of the story being told. These are not the same system used at two speeds — they're two different jobs, and treating them identically is the single most common way a "premium" redesign accidentally makes an application feel like a toy.

## Hover

`fast` (200ms), `ease-arrive`. A 1px lift and a shadow shift from resting to raised — never a scale transform (scaling text degrades legibility mid-transition, a specific, avoidable mistake). Titanium-bordered elements (`04-material-system.md`) get their edge highlight brighten on hover instead of lifting — the material dictates the hover language, not a single global rule.

## Loading

Never a spinner as the default. A skeleton matching the real content's actual layout for a single fetch; a named, sequenced set of steps (already proven excellent in this codebase's existing `AnalysingState` pattern) for anything with real discrete stages — the difference between "something is happening" and "here is specifically what's happening, and here's how much is left," which is the entire difference between anxious and calm.

## Scrolling

Reserved for the marketing site only. Section-pinned reveals (a chain tracing in as the reader scrolls past it) rather than parallax or scroll-jacking — the reader's own scroll speed sets the pace, never a timer fighting their input. Inside the application, scroll is scroll — never intercepted, never given secondary meaning. An enterprise tool that hijacks scrolling to be clever has made itself less trustworthy for the sake of a moment nobody asked for.

## Camera movement

The one genuinely cinematic device: on the homepage's opening chapter, a slow, near-imperceptible drift of the ambient Aurora glow (`04-material-system.md`) — 60–120 second loop, ken-burns-subtle, suggesting depth and life without ever drawing the eye away from the headline in front of it. Never used on any screen with real data — a dashboard with a drifting background is a dashboard that's harder to read, not a more premium one.

## Micro-interactions

A button press: `instant` (100ms) scale-down to 98%, immediate. A form field's focus ring: appears in `instant`, no transition on the ring itself — focus states are informational, not decorative, and should feel immediate, not eased. A save confirming: the status pill's color settles over `fast` (200ms), text appears already in place, never typewriter-animated (typewriter text is a chatbot signal, the one thing `docs/design/09-donna-experience.md`'s predecessor document already correctly ruled out, restated here as a motion-language rule, not just a copy rule).

## What this language explicitly refuses

Parallax, scroll-jacking, spring/bounce easing anywhere, looping background animation on any data-bearing screen, confetti or celebration effects of any kind, motion whose only purpose is "feels alive" rather than "explains" or "marks a threshold." Every item on this list is common in the exact category of AI-product marketing this system is built to be visibly, deliberately different from.

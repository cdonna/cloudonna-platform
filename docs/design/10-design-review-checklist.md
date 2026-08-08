# Design Review Checklist

Every future UI change is checked against this list before it ships. Not a style guide — a set of yes/no questions with a specific, checkable meaning behind each one. A "yes" that can't be pointed at something concrete on the screen doesn't count.

## Does this reduce complexity?

Not "does this look simple" — does a person leave this screen knowing something, faster, than they would have from the previous version. If the change only removed visual clutter without changing what the reader understands, it's a cleanup, not a reduction in complexity, and should be logged as one honestly.

## Does this increase confidence?

Confidence through clarity, per `01-design-philosophy.md` — never confidence through tone, color, or emphasis applied to a claim the evidence doesn't support. A change that makes something *look* more certain without the underlying evidence changing fails this question, regardless of how good it looks.

## Does this strengthen trust?

Does the change make a claim more checkable, more attributable, or more honest about its own uncertainty than before? A visual change that makes the product feel more premium while making a claim *less* traceable is a net loss on this system's own terms, whatever it gains aesthetically.

## Does this feel premium?

Tested against `01-design-philosophy.md`'s specific definition — premium without luxury, expensive because considered, not because ornamented. A change that adds a decorative flourish to feel more premium has misread the brief; a change that removes one usually hasn't.

## Would Apple remove something?

The standing challenge before shipping anything new: is there an existing element on this screen that could be cut, now that the new one is here, rather than simply adding to what's already there. A screen that only ever grows has already failed this question, cumulatively, even if no single addition failed it in isolation.

## Would SpaceX simplify something?

Is the sequence of steps or the amount of visible mechanism the absolute minimum needed to convey what's actually happening — or is there a simpler staging of the same real information that would land with the same weight in less time or less space.

## Would Bloomberg improve information density?

On dense, evidence-bearing screens specifically (`07-layout-system.md`'s "dense" zones): is real, useful data being pushed into whitespace it doesn't need, at the cost of an expert reader having to scroll or click for something that could have fit on screen. Density is not a failure state everywhere in this system — on these specific screens, under-density is the failure.

## Would Linear reduce friction?

Is there a click, a page load, or a modal in this flow that a keyboard-first, speed-conscious user would find unnecessary — and if there is, is there a real reason it's there beyond "that's how it's usually done."

## What a "no" means

A "no" on any question above doesn't automatically block the change — it means the change needs a specific, written reason it's shipping anyway, reviewed the same way a Founder Compass "no" is handled (`docs/founder/12-founder-compass.md`): named, not silently overridden. The checklist's job is making sure every trade-off was actually chosen, not that every answer is always yes.

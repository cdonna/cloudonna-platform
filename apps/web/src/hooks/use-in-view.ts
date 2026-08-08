"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True once the element has scrolled into view — once only, never
 * reverts to false on scroll-away, so a reveal animation never
 * replays every time a section drifts in and out of the viewport.
 * Respects prefers-reduced-motion at the source: reduced-motion users
 * get `true` immediately, so nothing they'd perceive as motion ever
 * depends on this hook gating visibility (content must never be stuck
 * invisible because an animation didn't fire).
 */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // Reading a browser-only global (window.matchMedia) — this can
    // only happen post-mount, not during render (window doesn't exist
    // during SSR), so unlike a plain prop-derived reset this is a
    // legitimate "sync from an external system" effect, not the
    // anti-pattern react-hooks/set-state-in-effect otherwise guards
    // against.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

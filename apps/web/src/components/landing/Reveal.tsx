"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

/**
 * Wraps a homepage section so it settles into place on first scroll
 * into view, instead of simply existing on load. GPU-only properties
 * (opacity + transform), duration-reveal (550ms, the same budget the
 * Donna recommendation reveal uses — the two moments this product
 * asks someone to pay attention to share one motion language).
 * Content is never hidden from anyone — see useInView's own
 * reduced-motion handling — this only ever adds a transition on top
 * of already-visible content.
 */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-reveal ease-nova-settle motion-reduce:transition-none ${
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

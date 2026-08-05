"use client";

import { useRef } from "react";

/**
 * Roving-tabindex keyboard navigation for a WAI-ARIA tablist
 * (Arrow Left/Right, Home, End). Caller owns the active-tab state;
 * this hook only manages focus and DOM refs.
 */
export function useRovingTabs(tabCount: number) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function registerTab(index: number) {
    return (element: HTMLButtonElement | null) => {
      tabRefs.current[index] = element;
    };
  }

  function focusTab(index: number) {
    tabRefs.current[index]?.focus();
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    onSelect: (index: number) => void,
  ) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = (index + 1) % tabCount;
      onSelect(next);
      focusTab(next);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const previous = (index - 1 + tabCount) % tabCount;
      onSelect(previous);
      focusTab(previous);
    } else if (event.key === "Home") {
      event.preventDefault();
      onSelect(0);
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      const last = tabCount - 1;
      onSelect(last);
      focusTab(last);
    }
  }

  return { registerTab, handleTabKeyDown };
}

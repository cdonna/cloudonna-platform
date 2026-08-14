import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSessionStorage,
  persistToSessionStorage,
  pushDonnaHistoryState,
  readCurrentDonnaHistoryState,
  readDonnaHistoryState,
  restoreFromSessionStorage,
} from "../session-history";

/**
 * This test environment runs in plain Node (no jsdom — see
 * vitest.config.mts), so `window` doesn't exist by default; every
 * function in session-history.ts checks for that and no-ops/returns
 * null, which is correct production behavior for SSR but would make
 * these tests trivial if left unstubbed. A minimal fake `window` with
 * working sessionStorage and history.pushState/state semantics lets
 * the actual namespace-matching and round-trip logic be exercised for
 * real, not just its SSR guard clause.
 */
function installFakeWindow() {
  const store = new Map<string, string>();
  let historyState: unknown = null;

  const fakeWindow = {
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
    history: {
      get state() {
        return historyState;
      },
      pushState: (state: unknown) => {
        historyState = state;
      },
    },
    location: { href: "https://example.test/donna-ai" },
  };

  vi.stubGlobal("window", fakeWindow);
  return fakeWindow;
}

beforeEach(() => {
  installFakeWindow();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("session-history", () => {
  it("round-trips a snapshot through sessionStorage", () => {
    const snapshot = { phase: "questions", currentStep: 3 };
    persistToSessionStorage("test-key", snapshot);
    expect(restoreFromSessionStorage("test-key")).toEqual(snapshot);
  });

  it("returns null from sessionStorage when nothing was ever persisted", () => {
    expect(restoreFromSessionStorage("never-written")).toBeNull();
  });

  it("clearing sessionStorage removes exactly that key", () => {
    persistToSessionStorage("a", { x: 1 });
    persistToSessionStorage("b", { y: 2 });
    clearSessionStorage("a");
    expect(restoreFromSessionStorage("a")).toBeNull();
    expect(restoreFromSessionStorage("b")).toEqual({ y: 2 });
  });

  it("readCurrentDonnaHistoryState returns the pushed snapshot for a matching namespace", () => {
    pushDonnaHistoryState("donna-experience", { phase: "results" });
    expect(readCurrentDonnaHistoryState("donna-experience")).toEqual({ phase: "results" });
  });

  it("readCurrentDonnaHistoryState returns null for a namespace that never pushed", () => {
    pushDonnaHistoryState("donna-experience", { phase: "results" });
    expect(readCurrentDonnaHistoryState("donna-intake")).toBeNull();
  });

  it("readDonnaHistoryState only accepts a popstate event carrying its own namespace — no cross-talk between DonnaAIExperience's and AdaptiveIntake's independent history entries", () => {
    const experienceEvent = { state: { namespace: "donna-experience", snapshot: { phase: "analysing" } } } as PopStateEvent;
    const intakeEvent = { state: { namespace: "donna-intake", snapshot: { phase: "questions" } } } as PopStateEvent;
    const foreignEvent = { state: { namespace: "some-other-app" } } as PopStateEvent;
    const emptyEvent = { state: null } as PopStateEvent;

    expect(readDonnaHistoryState(experienceEvent, "donna-experience")).toEqual({ phase: "analysing" });
    expect(readDonnaHistoryState(intakeEvent, "donna-experience")).toBeNull();
    expect(readDonnaHistoryState(foreignEvent, "donna-experience")).toBeNull();
    expect(readDonnaHistoryState(emptyEvent, "donna-experience")).toBeNull();
  });

  it("never throws when window is unavailable (SSR) — every function degrades to a safe no-op/null", () => {
    vi.unstubAllGlobals(); // simulate no window at all
    expect(() => persistToSessionStorage("k", { a: 1 })).not.toThrow();
    expect(restoreFromSessionStorage("k")).toBeNull();
    expect(() => pushDonnaHistoryState("ns", { a: 1 })).not.toThrow();
    expect(readCurrentDonnaHistoryState("ns")).toBeNull();
    expect(() => clearSessionStorage("k")).not.toThrow();
  });
});

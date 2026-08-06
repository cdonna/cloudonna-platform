import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Makes the `server-only` package resolve to its harmless `empty.js`
    // export instead of throwing "cannot be imported from a Client
    // Component" — the same resolution condition Next.js's own server
    // bundler uses. Without this, any test that imports config.ts,
    // select-provider.ts, or openai-provider.ts (all server-only by
    // design) would crash at module load, not at a meaningful assertion.
    // Set on both `resolve` and `ssr.resolve`: Vitest runs test files
    // through Vite's SSR pipeline, which resolves bare specifiers via
    // `ssr.resolve.conditions`, not the plain client `resolve.conditions`.
    conditions: ["react-server"],
  },
  ssr: {
    resolve: {
      conditions: ["react-server"],
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // No *.live.test.ts files exist yet in Phase 5.1 (no external
    // provider is integrated). This exclusion is here so Phase 5.3, when
    // it adds a real OpenAI provider and live tests, does not also need
    // to touch this config — those tests will be gated behind
    // DONNA_AI_RUN_LIVE_TESTS and never run in normal CI. See
    // docs/intelligence/provider-boundaries.md.
    exclude: process.env.DONNA_AI_RUN_LIVE_TESTS ? [] : ["**/*.live.test.ts"],
  },
});

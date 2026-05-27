import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // Exclude Playwright E2E specs — they must run via `npx playwright test`.
    // Vitest picks them up by the default *.spec.ts glob but cannot execute
    // `test.describe()` from @playwright/test. Also exclude our alternate
    // vitest config file, whose `.test.mts` suffix otherwise makes Vitest try
    // to execute it as a test module.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "tests/e2e/**",
      "vitest.config.test.mts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
});
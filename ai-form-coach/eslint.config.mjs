import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/legacy-disabled/**",
    ],
  },
  {
    // Scope to TS/TSX so `npx eslint .` over the whole repo does not try to
    // apply react-hooks/typescript-eslint rules to JSON/env/mjs config files
    // (the plugins are only registered for these file types upstream).
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      // React 19 strict rules — all violations fixed, now enforced as errors.
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/refs": "error",
      "react-hooks/purity": "error",
      "react-hooks/immutability": "error",
      // Allow _-prefixed intentionally unused destructured vars.
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],
    },
  },
];

export default eslintConfig;

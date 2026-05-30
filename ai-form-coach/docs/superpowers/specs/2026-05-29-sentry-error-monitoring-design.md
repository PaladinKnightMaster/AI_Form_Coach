# Sentry Error Monitoring — Full `@sentry/nextjs` Integration (war-room #3)

**Date:** 2026-05-29
**Branch:** `feat/sentry-error-monitoring`
**War-room concern:** #3 — "Sentry verification is P0, not P1" (flying blind in beta).
**Status:** design approved, awaiting spec review.

## Problem

Error monitoring is wired only partially and has never been verified end-to-end:

- `@sentry/browser@8.36.0` is installed — the **browser SDK only**.
- `app/error.tsx` and `app/global-error.tsx` call `Sentry.captureException` (React
  render errors are captured).
- `components/ErrorBoundary.tsx` (wraps the marketing route group) **swallows** caught
  errors — it only `console.error`s, never forwarding to Sentry.
- **No server / edge / route-handler / middleware capture** — there is no
  `instrumentation.ts`, and the browser SDK cannot see server-side crashes. Stripe
  webhooks, the Supabase auth callback, API routes, and server components are all blind
  spots.
- No DSN-driven delivery has ever been confirmed against a real Sentry project.

For a beta where "the first crash burns a tester forever," a server-side crash (payment
webhook, auth callback) is exactly the failure we cannot afford to miss.

## Goal

Migrate to the full `@sentry/nextjs` SDK (client + server + edge), close the existing
gaps, and verify on a Vercel preview deploy that **both a client error and a server error
land in Sentry with readable (source-mapped) stack traces**. Then flip concern #3 to 🟢.

## Non-goals (YAGNI for Beta 1)

- **Performance tracing** — `tracesSampleRate: 0`.
- **Session Replay** — disabled.
- **User feedback widget** — not included.
- **`tunnelRoute`** — omitted; it adds a rewrite that interacts with the auth
  middleware. Documented as a future toggle, not built now.
- **`sendDefaultPii`** — left `false` (no IP/header capture) until the liability waiver
  (concern #2) lands.

## Decisions captured during brainstorming

1. **Scope:** full `@sentry/nextjs` (client + server + edge), not browser-only hardening.
2. **Sentry account:** already provisioned (org, project, DSN exist). `NEXT_PUBLIC_SENTRY_DSN`
   is already set in Vercel env.
3. **Verification gate:** trigger one client + one server error on a **Vercel preview
   deploy**; confirm both appear in Sentry with readable, source-mapped stack traces.
4. **Verification routes are temporary:** kept through testing + workflow validation +
   documentation, then **deleted as the final teardown step**.

## Architecture

### Dependency

- Remove `@sentry/browser`; add `@sentry/nextjs`. The Next SDK re-exports the browser
  API, so existing `Sentry.captureException(...)` call sites keep compiling.

### Shared init options (single source of truth)

`src/lib/observability/sentryConfig.ts` exports one plain options object consumed by all
three runtimes, so they cannot drift:

```ts
export const sentryInitOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,
  tracesSampleRate: 0,        // error-only for Beta 1
  sendDefaultPii: false,      // privacy-conservative until waiver (concern #2)
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN), // explicit no-op when unset
};
```

### Init entrypoints (project root, `ai-form-coach/`)

- **`instrumentation-client.ts`** — `Sentry.init(sentryInitOptions)` for the browser
  (replaces the old `sentry.client.config.ts` convention; confirmed against current
  `@sentry/nextjs` docs).
- **`instrumentation.ts`** —
  ```ts
  export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
    if (process.env.NEXT_RUNTIME === "edge")   await import("./sentry.edge.config");
  }
  export const onRequestError = Sentry.captureRequestError;
  ```
  `onRequestError` is what captures server-component, route-handler, and middleware
  crashes.
- **`sentry.server.config.ts`** + **`sentry.edge.config.ts`** — each calls
  `Sentry.init(sentryInitOptions)` for its runtime.

All four no-op safely when the DSN is unset (`enabled: false`), so the branch builds and
merges green before any secret is present.

### Reconcile existing wiring

- **`components/ErrorBoundary.tsx`** — add `Sentry.captureException(error)` in
  `componentDidCatch` (keep the existing `console.error`). Closes the swallow gap.
- **`app/error.tsx` + `app/global-error.tsx`** — keep `captureException`; retarget imports
  to `@sentry/nextjs`; drop the now-redundant `initSentry()` calls.
- **`components/LogSilencer.tsx`** — remove the eager `initSentry()` dynamic import (client
  init is automatic via `instrumentation-client.ts`).
- **`src/lib/observability/sentry.ts`** — collapse to `export { Sentry } from "@sentry/nextjs";`
  (drop the hand-rolled `initSentry`). `events.ts` is untouched.

### `next.config.ts`

Wrap the existing default export:

```ts
import { withSentryConfig } from "@sentry/nextjs";
export default withSentryConfig(nextConfig, {
  org: "___ORG_SLUG___",       // non-secret, filled at build step
  project: "___PROJECT_SLUG___",
  authToken: process.env.SENTRY_AUTH_TOKEN, // build-time secret (source-map upload)
  silent: !process.env.CI,
});
```

A missing `SENTRY_AUTH_TOKEN` skips source-map upload with a warning — the build still
succeeds, so the CI release-gate stays green without the secret.

### Verification surface (temporary, gated, dormant)

- **`src/app/api/sentry-check/route.ts`** — `GET` throws a server-side error.
- **`src/app/(marketing)/sentry-check/page.tsx`** — a button that throws a client error,
  and a button that fetches the API route.
- Both **no-op / return 404 when `VERCEL_ENV === "production"`** (active in dev + preview
  only), and are added to the middleware matcher exemptions so they are reachable
  unauthenticated on the preview deploy.
- **Teardown:** these three files (page, route, and any middleware-exemption lines) are
  removed in the final task, once verification + workflow + docs are complete.

## Environment variables

| Var | Where | Secret? | Purpose |
|-----|-------|---------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel (already set) | No (public) | Runtime: where errors are sent |
| `SENTRY_AUTH_TOKEN` | Vercel build env + local `.env` for local source-mapped builds | **Yes** | Build-time: source-map upload for readable traces |
| `SENTRY_ORG` / `SENTRY_PROJECT` slugs | Literals in `next.config.ts` | No | Identify the Sentry project for upload |

Needed from the user at the build step: org slug, project slug, and a created
`SENTRY_AUTH_TOKEN` (scopes: `project:releases`, `project:write`) placed in Vercel.

## Verification procedure (the #3 gate)

1. Set `SENTRY_AUTH_TOKEN` in Vercel; confirm `NEXT_PUBLIC_SENTRY_DSN` present.
2. Open the PR → Vercel builds a **preview** deploy (source maps upload during build).
3. On the preview URL, visit `/sentry-check`:
   - Click "throw client error" → confirm a new issue appears in Sentry with a readable
     `.tsx` stack trace.
   - Click "throw server error" (hits `/api/sentry-check`) → confirm a second issue with a
     readable server stack trace.
4. Both visible with source-mapped frames ⇒ verification passes.

## Testing / release-gate impact

- `npm run test` (MVP), `npm run lint`, `npm run build` must stay green locally with no DSN
  and no token (SDK no-ops, source-map upload skipped). No new unit tests — this is
  config/integration; the gate is the manual preview check.
- `release-gate.yml` build must remain green (no token in CI ⇒ upload skipped, build OK).

## Documentation

- New `docs/technical/observability.md` (or section): what's captured at each layer, the
  env vars, and the re-verification procedure.
- War-room tracker #3: 🔴 → 🟡 (code shipped, awaiting preview verification) → 🟢 after the
  user confirms both errors landed.

## Rollout / branch

- Branch `feat/sentry-error-monitoring` from `dev`. One purpose. User opens the PR
  manually (per CLAUDE.md). Verification happens on that PR's Vercel preview.
- Final teardown task removes the temporary `/sentry-check` surface before #3 → 🟢.

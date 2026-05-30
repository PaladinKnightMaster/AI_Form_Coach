# Observability — Error Monitoring (Sentry)

AI Form Coach uses `@sentry/nextjs` for error monitoring. Beta 1 is **error-only**:
no performance tracing, no session replay, no PII (`sendDefaultPii: false`).

## What is captured

| Layer | Mechanism |
|-------|-----------|
| Browser uncaught errors / rejections | `instrumentation-client.ts` (global handlers) |
| React render errors (route) | `app/error.tsx`, `app/global-error.tsx` |
| React render errors (marketing tree) | `components/ErrorBoundary.tsx` → `captureException` |
| Server components, route handlers, middleware | `instrumentation.ts` → `onRequestError` |
| Node + edge runtime errors | `sentry.server.config.ts`, `sentry.edge.config.ts` |

All init flows through `src/lib/observability/sentryConfig.ts` (`getSentryInitOptions`),
which no-ops when `NEXT_PUBLIC_SENTRY_DSN` is unset.

## Environment variables

| Var | Where | Secret | Purpose |
|-----|-------|--------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel (all envs) | No | Runtime: destination for events |
| `SENTRY_AUTH_TOKEN` | Vercel build env | **Yes** | Build: source-map upload (readable traces) |

`org`/`project` slugs are in `next.config.ts` (`paladinknightmaster` / `ai-form-coach`).

## Re-verifying capture

Restore a throwing client action and a throwing route handler (see git history of the
temporary `/sentry-check` surface), deploy to a preview, trigger both, and confirm two
issues appear in Sentry with source-mapped stack traces.

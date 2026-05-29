/**
 * Single source of truth for Sentry.init options across the browser, Node
 * server, and edge runtimes. Error-only for Beta 1 — no performance tracing,
 * no session replay, no PII (war-room concern #3; PII stays off until the
 * liability waiver, concern #2). No-ops when NEXT_PUBLIC_SENTRY_DSN is unset.
 */
export interface SentryRuntimeOptions {
  dsn: string | undefined;
  enabled: boolean;
  environment: string | undefined;
  release: string | undefined;
  tracesSampleRate: number;
  sendDefaultPii: boolean;
}

export function getSentryInitOptions(): SentryRuntimeOptions {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  };
}

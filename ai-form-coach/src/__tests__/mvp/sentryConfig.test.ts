import { afterEach, describe, expect, it } from "vitest";
import { getSentryInitOptions } from "@/lib/observability/sentryConfig";

describe("getSentryInitOptions", () => {
  const original = process.env.NEXT_PUBLIC_SENTRY_DSN;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    else process.env.NEXT_PUBLIC_SENTRY_DSN = original;
  });

  it("is disabled and dsn-less when no DSN is set", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    const opts = getSentryInitOptions();
    expect(opts.enabled).toBe(false);
    expect(opts.dsn).toBeUndefined();
  });

  it("is enabled and error-only when a DSN is set", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    const opts = getSentryInitOptions();
    expect(opts.enabled).toBe(true);
    expect(opts.tracesSampleRate).toBe(0);
    expect(opts.sendDefaultPii).toBe(false);
    expect(opts.dsn).toBe("https://examplePublicKey@o0.ingest.sentry.io/0");
    expect(opts.environment).toBe(process.env.VERCEL_ENV ?? process.env.NODE_ENV);
  });
});

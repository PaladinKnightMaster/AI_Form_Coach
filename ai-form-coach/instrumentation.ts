import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors from Server Components, route handlers, and middleware.
//
// We wrap `captureRequestError` to flush before resolving: on Vercel's
// serverless runtime the function can freeze the moment the response is sent,
// before Sentry's async transport delivers the event — so a captured error is
// silently dropped. Next.js awaits this hook, so awaiting `flush` here
// guarantees the event is sent before the function exits. (War-room #3:
// without this, server-side errors never reached Sentry while client errors
// did.)
export const onRequestError = async (
  ...args: Parameters<typeof Sentry.captureRequestError>
): Promise<void> => {
  Sentry.captureRequestError(...args);
  await Sentry.flush(2000);
};

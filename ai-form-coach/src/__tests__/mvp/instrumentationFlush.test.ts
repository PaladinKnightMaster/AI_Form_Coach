/**
 * Regression guard for war-room #3 server-side capture.
 *
 * `onRequestError` MUST flush before resolving. On Vercel's serverless runtime
 * the function can freeze before Sentry's async transport delivers the event,
 * so a captured server-side error is silently dropped unless we await a flush.
 * If someone "simplifies" this back to
 *   export const onRequestError = Sentry.captureRequestError;
 * server errors stop reaching Sentry — this test fails to catch that.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureRequestError: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
}));

import * as Sentry from "@sentry/nextjs";
import { onRequestError } from "../../../instrumentation";

describe("instrumentation onRequestError (war-room #3)", () => {
  afterEach(() => vi.clearAllMocks());

  it("captures the request error and awaits a flush so serverless delivery is guaranteed", async () => {
    const error = new Error("boom");
    const request = { path: "/api/x" } as never;
    const context = { routerKind: "App Router" } as never;

    await onRequestError(error, request, context);

    expect(Sentry.captureRequestError).toHaveBeenCalledWith(error, request, context);
    expect(Sentry.flush).toHaveBeenCalledTimes(1);
  });
});

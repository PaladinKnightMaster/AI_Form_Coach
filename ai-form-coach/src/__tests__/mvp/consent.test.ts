import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  recordConsent,
  hasAcceptedCurrentVersion,
  markPendingSignupConsent,
  flushPendingSignupConsent,
} from "@/lib/legal/consent";
import { DISCLAIMER_VERSION } from "@/lib/legal/legalContent";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const PENDING_KEY = "carriage.pendingSignupConsentV1";

function fakeClient(
  existingRows: Array<{ disclaimer_version: string }>,
  upsertError: { message: string } | null = null,
) {
  const upsert = vi.fn().mockResolvedValue({ error: upsertError });
  const limit = vi.fn().mockResolvedValue({ data: existingRows, error: null });
  const select = () => ({ eq: () => ({ eq: () => ({ eq: () => ({ limit }) }) }) });
  return {
    upsert,
    from: () => ({ upsert, select }),
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("consent helpers", () => {
  it("records consent via an idempotent upsert on the (user, context, version) key, and returns true", async () => {
    const client = fakeClient([]);
    const ok = await recordConsent(client as never, "user-1", "signup");
    expect(ok).toBe(true);
    expect(client.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", disclaimer_version: DISCLAIMER_VERSION, context: "signup" },
      { onConflict: "user_id,context,disclaimer_version", ignoreDuplicates: true },
    );
  });

  it("returns false when the consent write fails", async () => {
    const client = fakeClient([], { message: "boom" });
    expect(await recordConsent(client as never, "user-1", "signup")).toBe(false);
  });

  it("hasAcceptedCurrentVersion is false when no matching row exists", async () => {
    const client = fakeClient([]);
    expect(await hasAcceptedCurrentVersion(client as never, "user-1", "first_session")).toBe(false);
  });

  it("hasAcceptedCurrentVersion is true when a row for the current version exists", async () => {
    const client = fakeClient([{ disclaimer_version: DISCLAIMER_VERSION }]);
    expect(await hasAcceptedCurrentVersion(client as never, "user-1", "first_session")).toBe(true);
  });
});

describe("pending signup consent (email-confirmation flow)", () => {
  it("flush records signup consent and clears the marker when one was set", async () => {
    markPendingSignupConsent();
    expect(localStorage.getItem(PENDING_KEY)).toBe(DISCLAIMER_VERSION);

    const client = fakeClient([]);
    await flushPendingSignupConsent(client as never, "user-1");

    expect(client.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", disclaimer_version: DISCLAIMER_VERSION, context: "signup" },
      { onConflict: "user_id,context,disclaimer_version", ignoreDuplicates: true },
    );
    expect(localStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it("flush is a no-op when nothing is pending (e.g. existing user magic-link sign-in)", async () => {
    const client = fakeClient([]);
    await flushPendingSignupConsent(client as never, "user-1");
    expect(client.upsert).not.toHaveBeenCalled();
  });

  it("flush leaves the marker in place when the write fails, so it retries next time", async () => {
    markPendingSignupConsent();
    const client = fakeClient([], { message: "network" });
    await flushPendingSignupConsent(client as never, "user-1");
    expect(client.upsert).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(PENDING_KEY)).toBe(DISCLAIMER_VERSION);
  });
});

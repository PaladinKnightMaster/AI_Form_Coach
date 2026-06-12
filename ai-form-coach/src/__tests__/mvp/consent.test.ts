import { describe, it, expect, vi } from "vitest";
import { recordConsent, hasAcceptedCurrentVersion } from "@/lib/legal/consent";
import { DISCLAIMER_VERSION } from "@/lib/legal/legalContent";

function fakeClient(existingRows: Array<{ disclaimer_version: string }>) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return {
    insert,
    from: () => ({
      insert,
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({ data: existingRows, error: null }),
          }),
        }),
      }),
    }),
  };
}

describe("consent helpers", () => {
  it("records a consent row with the current version and given context", async () => {
    const client = fakeClient([]);
    await recordConsent(client as never, "user-1", "signup");
    expect(client.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      disclaimer_version: DISCLAIMER_VERSION,
      context: "signup",
    });
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

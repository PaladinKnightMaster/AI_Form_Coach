import { describe, expect, it } from "vitest";
import { isLoopbackAutomationAllowed, withLoopbackAutomationParams } from "@/lib/mvp/e2eAccess";

describe("loopback E2E access helpers", () => {
  it("only enables automation when the explicit loopback flag is present", () => {
    expect(isLoopbackAutomationAllowed(new URLSearchParams("e2e-access=1"), "127.0.0.1")).toBe(true);
    expect(isLoopbackAutomationAllowed(new URLSearchParams("e2e-access=1"), "localhost")).toBe(true);
    expect(isLoopbackAutomationAllowed(new URLSearchParams("e2e-access=1"), "example.com")).toBe(false);
    expect(isLoopbackAutomationAllowed(new URLSearchParams("history-script=coach-beta-history"), "127.0.0.1")).toBe(false);
  });

  it("builds deterministic loopback automation URLs", () => {
    expect(withLoopbackAutomationParams("/session/abc", { "session-script": "coach-beta-history" })).toBe(
      "/session/abc?e2e-access=1&session-script=coach-beta-history",
    );
  });
});
import { describe, it, expect } from "vitest";
import { shouldShowCoachTips, COACH_TIPS_SEEN_KEY } from "@/lib/coach/coachTips";

describe("shouldShowCoachTips", () => {
  it("shows when unseen and not e2e", () => {
    expect(shouldShowCoachTips(false, false)).toBe(true);
  });
  it("hides when already seen", () => {
    expect(shouldShowCoachTips(true, false)).toBe(false);
  });
  it("hides under e2e even if unseen (never blocks the harness)", () => {
    expect(shouldShowCoachTips(false, true)).toBe(false);
  });
  it("exposes a versioned storage key", () => {
    expect(COACH_TIPS_SEEN_KEY).toBe("carriage.coachTipsSeenV1");
  });
});

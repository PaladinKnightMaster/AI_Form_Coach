import { describe, expect, it } from "vitest";
import { getTestHistoryFixture, getTestSessionFixture } from "@/lib/history/testHistoryFixtures";

describe("scripted history fixtures", () => {
  it("returns the beta history bundle for loopback automation", () => {
    const fixture = getTestHistoryFixture("coach-beta-history");

    expect(fixture).not.toBeNull();
    expect(fixture?.sessions).toHaveLength(2);
    expect(fixture?.reps.length).toBeGreaterThan(4);
    expect(fixture?.sessions[0]?.is_demo).toBe(false);
  });

  it("can look up a single scripted session by id", () => {
    const fixture = getTestSessionFixture("coach-beta-history", "session-squat-001");

    expect(fixture?.session.exercise).toBe("squat");
    expect(fixture?.reps).toHaveLength(4);
    expect(getTestSessionFixture("coach-beta-history", "missing-session")).toBeNull();
  });
});
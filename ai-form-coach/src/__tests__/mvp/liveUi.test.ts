import { describe, expect, it } from "vitest";
import {
  LIVE_UI_COMMIT_INTERVAL_MS,
  shouldCommitCoachLiveUi,
  type CoachLiveUiSnapshot,
} from "@/lib/coach/liveUi";

function createSnapshot(overrides: Partial<CoachLiveUiSnapshot> = {}): CoachLiveUiSnapshot {
  return {
    hasPose: true,
    visibilityScore: 0.88,
    fps: 28,
    quality: "good",
    trackingStatus: "Tracking live posture.",
    repCount: 1,
    phase: "up",
    ...overrides,
  };
}

describe("coach live UI commit policy", () => {
  it("commits the first live snapshot immediately", () => {
    expect(shouldCommitCoachLiveUi(null, createSnapshot(), 0, 0)).toBe(true);
  });

  it("throttles small metric drift inside the commit window", () => {
    const previous = createSnapshot();
    const next = createSnapshot({ visibilityScore: 0.9, fps: 29 });

    expect(shouldCommitCoachLiveUi(previous, next, 40, 0)).toBe(false);
  });

  it("commits when the time budget expires even if the state barely moved", () => {
    const previous = createSnapshot();
    const next = createSnapshot({ visibilityScore: 0.89, fps: 29 });

    expect(shouldCommitCoachLiveUi(previous, next, LIVE_UI_COMMIT_INTERVAL_MS + 1, 0)).toBe(true);
  });

  it("commits immediately on rep, phase, or tracking changes", () => {
    const previous = createSnapshot();

    expect(shouldCommitCoachLiveUi(previous, createSnapshot({ repCount: 2 }), 30, 0)).toBe(true);
    expect(shouldCommitCoachLiveUi(previous, createSnapshot({ phase: "down" }), 30, 0)).toBe(true);
    expect(
      shouldCommitCoachLiveUi(
        previous,
        createSnapshot({ trackingStatus: "Move back until shoulders, hips, knees, and ankles stay in frame." }),
        30,
        0,
      ),
    ).toBe(true);
  });

  it("commits immediately on visibility loss or quality change", () => {
    const previous = createSnapshot();

    expect(shouldCommitCoachLiveUi(previous, createSnapshot({ hasPose: false, visibilityScore: 0, quality: "bad" }), 10, 0)).toBe(true);
  });
});
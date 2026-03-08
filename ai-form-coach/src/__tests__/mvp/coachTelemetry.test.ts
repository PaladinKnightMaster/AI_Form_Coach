import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  trackCoachCueFeedback,
  trackCoachExerciseChange,
  trackCoachPageVisit,
  trackCoachSessionComplete,
  trackCoachSessionPause,
  trackCoachSessionResume,
  trackCoachSessionStart,
  trackCoachSettingToggle,
} from "@/lib/coach/telemetry";
import { trackEvent, trackPageView } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
}));

describe("coach telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks the coach page visit", () => {
    trackCoachPageVisit(true);

    expect(trackPageView).toHaveBeenCalledWith("/coach", "Coach Beta");
    expect(trackEvent).toHaveBeenCalledWith("coach-page-view", { scripted: true });
  });

  it("tracks session milestones with rounded metrics", () => {
    trackCoachSessionStart("squat", false);
    trackCoachSessionPause("squat", 6200, 3, 1);
    trackCoachSessionResume("squat", 6200, 3, 1);
    trackCoachSessionComplete("squat", 12850, 5, 0.823, 2, "sync_pending", true);

    expect(trackEvent).toHaveBeenNthCalledWith(1, "coach-session-start", { exercise: "squat", scripted: false });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "coach-session-pause", {
      exercise: "squat",
      elapsedSeconds: 6,
      repCount: 3,
      pauseCount: 1,
    });
    expect(trackEvent).toHaveBeenNthCalledWith(3, "coach-session-resume", {
      exercise: "squat",
      elapsedSeconds: 6,
      repCount: 3,
      pauseCount: 1,
    });
    expect(trackEvent).toHaveBeenNthCalledWith(4, "coach-session-complete", {
      exercise: "squat",
      durationSeconds: 13,
      repCount: 5,
      averageVisibilityPercent: 82,
      pauseCount: 2,
      saveOutcome: "sync_pending",
      scripted: true,
    });
  });

  it("tracks settings, exercise changes, and cue feedback", () => {
    trackCoachSettingToggle("voice", true, "pushup", "paused");
    trackCoachExerciseChange("squat", "plank", "idle");
    trackCoachCueFeedback("plank", "clearer", 1, 4100, 0);

    expect(trackEvent).toHaveBeenNthCalledWith(1, "coach-setting-toggle", {
      setting: "voice",
      enabled: true,
      exercise: "pushup",
      sessionState: "paused",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "coach-exercise-change", {
      from: "squat",
      to: "plank",
      sessionState: "idle",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(3, "coach-cue-feedback", {
      exercise: "plank",
      feedback: "clearer",
      repCount: 1,
      durationSeconds: 4,
      pauseCount: 0,
    });
  });
});

import { trackEvent, trackPageView } from "@/lib/analytics";
import type { Exercise } from "@/lib/validators/types";

export type CoachCueFeedback = "clear" | "calmer" | "clearer";
export type CoachSaveOutcome = "saved" | "signin_required" | "sync_pending" | "sync_retry";
export type CoachSessionState = "idle" | "active" | "paused" | "completed";

type CoachEventData = Record<string, string | number | boolean>;

function toSeconds(durationMs: number): number {
  return Math.max(0, Math.round(durationMs / 1000));
}

function toPercent(value: number | null): number {
  if (value === null) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function trackCoachEvent(eventName: string, eventData: CoachEventData): void {
  trackEvent(eventName, eventData);
}

export function trackCoachPageVisit(scripted: boolean): void {
  trackPageView("/coach", "Coach Beta");
  trackCoachEvent("coach-page-view", { scripted });
}

export function trackCoachExerciseChange(from: Exercise, to: Exercise, sessionState: CoachSessionState): void {
  trackCoachEvent("coach-exercise-change", { from, to, sessionState });
}

export function trackCoachSessionStart(exercise: Exercise, scripted: boolean): void {
  trackCoachEvent("coach-session-start", { exercise, scripted });
}

export function trackCoachSessionPause(exercise: Exercise, elapsedMs: number, repCount: number, pauseCount: number): void {
  trackCoachEvent("coach-session-pause", {
    exercise,
    elapsedSeconds: toSeconds(elapsedMs),
    repCount,
    pauseCount,
  });
}

export function trackCoachSessionResume(exercise: Exercise, elapsedMs: number, repCount: number, pauseCount: number): void {
  trackCoachEvent("coach-session-resume", {
    exercise,
    elapsedSeconds: toSeconds(elapsedMs),
    repCount,
    pauseCount,
  });
}

export function trackCoachSessionComplete(
  exercise: Exercise,
  durationMs: number,
  repCount: number,
  averageVisibility: number | null,
  pauseCount: number,
  saveOutcome: CoachSaveOutcome,
  scripted: boolean,
): void {
  trackCoachEvent("coach-session-complete", {
    exercise,
    durationSeconds: toSeconds(durationMs),
    repCount,
    averageVisibilityPercent: toPercent(averageVisibility),
    pauseCount,
    saveOutcome,
    scripted,
  });
}

export function trackCoachSettingToggle(
  setting: "voice" | "mirror",
  enabled: boolean,
  exercise: Exercise,
  sessionState: CoachSessionState,
): void {
  trackCoachEvent("coach-setting-toggle", {
    setting,
    enabled,
    exercise,
    sessionState,
  });
}

export function trackCoachCueFeedback(
  exercise: Exercise,
  feedback: CoachCueFeedback,
  repCount: number,
  durationMs: number,
  pauseCount: number,
): void {
  trackCoachEvent("coach-cue-feedback", {
    exercise,
    feedback,
    repCount,
    durationSeconds: toSeconds(durationMs),
    pauseCount,
  });
}

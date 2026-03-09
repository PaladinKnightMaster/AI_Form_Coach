import { trackEvent, trackPageView } from "@/lib/analytics";
import type { CoachDeviceProfile } from "@/lib/coach/deviceReadiness";
import type { Exercise } from "@/lib/validators/types";

export type CoachCueFeedback = "clear" | "calmer" | "clearer";
export type CoachSaveOutcome = "saved" | "signin_required" | "sync_pending" | "sync_retry";
export type CoachSessionState = "idle" | "active" | "paused" | "completed";
export type CoachStageIssueKind = "camera" | "detector";

type CoachEventData = Record<string, string | number | boolean>;

function toSeconds(durationMs: number): number {
  return Math.max(0, Math.round(durationMs / 1000));
}

function toPercent(value: number | null): number {
  if (value === null) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function withDevice(profile?: CoachDeviceProfile): CoachEventData {
  if (!profile) return {};
  return {
    deviceFamily: profile.family,
    deviceBrowser: profile.browser,
    deviceOs: profile.os,
    viewportWidth: profile.viewportWidth,
    viewportHeight: profile.viewportHeight,
    touch: profile.touch,
    pixelRatio: profile.pixelRatio,
  };
}

function trackCoachEvent(eventName: string, eventData: CoachEventData): void {
  trackEvent(eventName, eventData);
}

export function trackCoachPageVisit(scripted: boolean, profile?: CoachDeviceProfile): void {
  trackPageView("/coach", "Coach Beta");
  trackCoachEvent("coach-page-view", { scripted, ...withDevice(profile) });
}

export function trackCoachExerciseChange(from: Exercise, to: Exercise, sessionState: CoachSessionState): void {
  trackCoachEvent("coach-exercise-change", { from, to, sessionState });
}

export function trackCoachSessionStart(exercise: Exercise, scripted: boolean, profile?: CoachDeviceProfile): void {
  trackCoachEvent("coach-session-start", { exercise, scripted, ...withDevice(profile) });
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
  profile?: CoachDeviceProfile,
): void {
  trackCoachEvent("coach-session-complete", {
    exercise,
    durationSeconds: toSeconds(durationMs),
    repCount,
    averageVisibilityPercent: toPercent(averageVisibility),
    pauseCount,
    saveOutcome,
    scripted,
    ...withDevice(profile),
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

export function trackCoachStageReady(profile: CoachDeviceProfile | undefined, scripted: boolean, retryCount: number): void {
  trackCoachEvent("coach-stage-ready", {
    scripted,
    retryCount,
    ...withDevice(profile),
  });
}

export function trackCoachStageIssue(
  issueKind: CoachStageIssueKind,
  message: string,
  profile: CoachDeviceProfile | undefined,
  scripted: boolean,
  retryCount: number,
): void {
  trackCoachEvent("coach-stage-issue", {
    issueKind,
    message,
    scripted,
    retryCount,
    ...withDevice(profile),
  });
}

export function trackCoachStageRetry(profile: CoachDeviceProfile | undefined, scripted: boolean, retryCount: number): void {
  trackCoachEvent("coach-stage-retry", {
    scripted,
    retryCount,
    ...withDevice(profile),
  });
}


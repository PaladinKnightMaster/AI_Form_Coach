import type { Phase } from "@/lib/validators/types";

export type CoachLiveQualityState = "good" | "warn" | "bad";

export interface CoachLiveUiSnapshot {
  hasPose: boolean;
  visibilityScore: number;
  fps: number;
  quality: CoachLiveQualityState;
  trackingStatus: string;
  repCount: number;
  phase: Phase;
}

export const LIVE_UI_COMMIT_INTERVAL_MS = 120;

const VISIBILITY_DELTA_THRESHOLD = 0.03;
const FPS_DELTA_THRESHOLD = 2;

export function shouldCommitCoachLiveUi(
  previous: CoachLiveUiSnapshot | null,
  next: CoachLiveUiSnapshot,
  now: number,
  lastCommitAt: number,
) {
  if (!previous) return true;

  const elapsed = now - lastCommitAt;
  if (elapsed >= LIVE_UI_COMMIT_INTERVAL_MS) return true;

  if (
    previous.hasPose !== next.hasPose ||
    previous.quality !== next.quality ||
    previous.trackingStatus !== next.trackingStatus ||
    previous.repCount !== next.repCount ||
    previous.phase !== next.phase
  ) {
    return true;
  }

  if (Math.abs(previous.visibilityScore - next.visibilityScore) >= VISIBILITY_DELTA_THRESHOLD) {
    return true;
  }

  if (Math.abs(previous.fps - next.fps) >= FPS_DELTA_THRESHOLD) {
    return true;
  }

  return false;
}
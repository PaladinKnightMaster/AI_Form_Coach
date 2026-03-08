export type FramingState = "searching" | "adjust" | "ready";
export type FramingTone = "success" | "warning" | "error";

export interface FramingGuidanceInput {
  cameraReady: boolean;
  visibilityScore: number;
  fps: number;
  hasPose: boolean;
}

export interface FramingGuidance {
  state: FramingState;
  tone: FramingTone;
  label: string;
  detail: string;
}

export const READY_VISIBILITY_SCORE = 0.72;
export const READY_FPS = 12;
export const MIN_VISIBILITY_SCORE = 0.55;

export function getFramingGuidance({
  cameraReady,
  visibilityScore,
  fps,
  hasPose,
}: FramingGuidanceInput): FramingGuidance {
  if (!cameraReady) {
    return {
      state: "searching",
      tone: "error",
      label: "Camera stage loading",
      detail: "Waiting for the detector and camera feed to become available.",
    };
  }

  if (!hasPose) {
    return {
      state: "searching",
      tone: "error",
      label: "Find your full body",
      detail: "Step back until shoulders, hips, knees, and ankles sit inside the guide.",
    };
  }

  if (visibilityScore >= READY_VISIBILITY_SCORE && fps >= READY_FPS) {
    return {
      state: "ready",
      tone: "success",
      label: "Full body locked",
      detail: "Hold your setup steady. The coach can start reading clean movement now.",
    };
  }

  if (visibilityScore >= MIN_VISIBILITY_SCORE) {
    return {
      state: "adjust",
      tone: "warning",
      label: "Almost framed",
      detail: "You are close. Step back a little more so ankles and wrists stay visible.",
    };
  }

  return {
    state: "searching",
    tone: "error",
    label: "Need more of your body",
    detail: "Move back and center yourself until the guide can see your whole body.",
  };
}

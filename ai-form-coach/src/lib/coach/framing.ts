import type { Exercise } from "@/lib/validators/types";

export type FramingState = "searching" | "adjust" | "ready";
export type FramingTone = "success" | "warning" | "error";

export interface FramingGuidanceInput {
  exercise: Exercise;
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
  cameraAngleLabel: string;
  cameraAngleDetail: string;
}

export const READY_VISIBILITY_SCORE = 0.72;
export const READY_FPS = 12;
export const MIN_VISIBILITY_SCORE = 0.55;

const EXERCISE_FRAMING_PROFILES: Record<Exercise, {
  cameraAngleLabel: string;
  cameraAngleDetail: string;
  searchingLabel: string;
  searchingDetail: string;
  adjustDetail: string;
  readyLabel: string;
  readyDetail: string;
}> = {
  squat: {
    cameraAngleLabel: "Quarter turn",
    cameraAngleDetail: "Keep the phone around hip height and stand 30-45 degrees to the camera so knees and torso stay readable.",
    searchingLabel: "Find your squat lane",
    searchingDetail: "Step back into a quarter turn until shoulders, hips, knees, and ankles sit inside the guide.",
    adjustDetail: "Hold the quarter turn and step back a touch more so ankles and wrists stay visible.",
    readyLabel: "Quarter turn locked",
    readyDetail: "Stay tall in that quarter turn. The coach can read squat depth cleanly now.",
  },
  pushup: {
    cameraAngleLabel: "Side profile",
    cameraAngleDetail: "Set the phone low and fully side-on so shoulders, hips, knees, and heels stay on one line.",
    searchingLabel: "Find your pushup line",
    searchingDetail: "Turn side-on and step back until shoulders, hips, knees, and heels sit inside the guide.",
    adjustDetail: "Stay side-on and give the camera a little more distance so elbows and heels stay visible.",
    readyLabel: "Side profile locked",
    readyDetail: "Hold that side profile. The coach can read elbow depth and body line cleanly now.",
  },
  plank: {
    cameraAngleLabel: "Side profile",
    cameraAngleDetail: "Keep the phone low near elbow height and stay side-on so shoulders through ankles stay visible.",
    searchingLabel: "Find your plank line",
    searchingDetail: "Turn side-on and line up shoulders, hips, knees, and ankles inside the guide.",
    adjustDetail: "Stay side-on and step back slightly so elbows, hips, and ankles all stay visible.",
    readyLabel: "Plank line locked",
    readyDetail: "Stay long in that side profile. The coach can read body-line stability cleanly now.",
  },
};

export function getFramingGuidance({
  exercise,
  cameraReady,
  visibilityScore,
  fps,
  hasPose,
}: FramingGuidanceInput): FramingGuidance {
  const profile = EXERCISE_FRAMING_PROFILES[exercise];

  if (!cameraReady) {
    return {
      state: "searching",
      tone: "error",
      label: "Camera stage loading",
      detail: "Waiting for the detector and camera feed to become available.",
      cameraAngleLabel: profile.cameraAngleLabel,
      cameraAngleDetail: profile.cameraAngleDetail,
    };
  }

  if (!hasPose) {
    return {
      state: "searching",
      tone: "error",
      label: profile.searchingLabel,
      detail: profile.searchingDetail,
      cameraAngleLabel: profile.cameraAngleLabel,
      cameraAngleDetail: profile.cameraAngleDetail,
    };
  }

  if (visibilityScore >= READY_VISIBILITY_SCORE && fps >= READY_FPS) {
    return {
      state: "ready",
      tone: "success",
      label: profile.readyLabel,
      detail: profile.readyDetail,
      cameraAngleLabel: profile.cameraAngleLabel,
      cameraAngleDetail: profile.cameraAngleDetail,
    };
  }

  if (visibilityScore >= MIN_VISIBILITY_SCORE) {
    return {
      state: "adjust",
      tone: "warning",
      label: "Almost framed",
      detail: profile.adjustDetail,
      cameraAngleLabel: profile.cameraAngleLabel,
      cameraAngleDetail: profile.cameraAngleDetail,
    };
  }

  return {
    state: "searching",
    tone: "error",
    label: profile.searchingLabel,
    detail: profile.searchingDetail,
    cameraAngleLabel: profile.cameraAngleLabel,
    cameraAngleDetail: profile.cameraAngleDetail,
  };
}

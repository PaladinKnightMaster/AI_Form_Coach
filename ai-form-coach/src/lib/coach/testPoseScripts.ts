import type { Landmark3D, PoseEstimateResult } from "@/lib/pose/engine";

export type CoachTestPoseScriptName =
  | "squat-single-rep"
  | "pushup-single-rep"
  | "plank-short-hold"
  | "squat-visibility-recovery"
  | "squat-ready-hold";

const SCRIPT_NAMES: CoachTestPoseScriptName[] = [
  "squat-single-rep",
  "pushup-single-rep",
  "plank-short-hold",
  "squat-visibility-recovery",
  "squat-ready-hold",
];
const DEFAULT_VISIBILITY = 0.98;

interface SyntheticSquatOptions {
  kneeAngle: number;
  hipShiftX?: number;
  hipLift?: number;
  visibility?: number;
}

interface SyntheticPushupOptions {
  elbowAngle: number;
  visibility?: number;
}

interface SyntheticPlankOptions {
  bodyLineAngle: number;
  visibility?: number;
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
}

function createBlankLandmarks(visibility = DEFAULT_VISIBILITY): Landmark3D[] {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility }));
}

function buildResult(landmarks: Landmark3D[], visibility: number): PoseEstimateResult {
  return {
    landmarks,
    fps: 30,
    visibilityScore: visibility,
    bestSide: "right",
    leftVisibility: visibility,
    rightVisibility: visibility,
  };
}

function buildSquatPose({ kneeAngle, hipShiftX = 0, hipLift = 0, visibility = DEFAULT_VISIBILITY }: SyntheticSquatOptions): PoseEstimateResult {
  const landmarks = createBlankLandmarks(visibility);
  const centerX = 0.5;
  const kneeRight = { x: centerX + 0.08, y: 0.67 };
  const ankleRight = { x: kneeRight.x + 0.05, y: 0.91 };
  const ankleAngle = Math.atan2(ankleRight.y - kneeRight.y, ankleRight.x - kneeRight.x) * (180 / Math.PI);
  const candidateAngles = [ankleAngle - kneeAngle, ankleAngle + kneeAngle];

  const hipVectorLength = 0.23;
  const hipVector = candidateAngles
    .map((angle) => {
      const radians = degToRad(angle);
      return {
        x: Math.cos(radians) * hipVectorLength,
        y: Math.sin(radians) * hipVectorLength,
      };
    })
    .filter((vector) => vector.x <= 0)
    .sort((left, right) => left.y - right.y)[0] ?? { x: -0.18, y: -0.11 };

  const hipRight = {
    x: kneeRight.x + hipVector.x + hipShiftX,
    y: kneeRight.y + hipVector.y - hipLift,
  };

  const shoulderRight = { x: hipRight.x + 0.02, y: hipRight.y - 0.22 };
  const elbowRight = { x: shoulderRight.x + 0.03, y: shoulderRight.y + 0.12 };
  const wristRight = { x: elbowRight.x + 0.02, y: elbowRight.y + 0.12 };

  const leftShift = 0.12;
  const hipLeft = { x: hipRight.x - leftShift, y: hipRight.y + 0.01 };
  const kneeLeft = { x: kneeRight.x - leftShift, y: kneeRight.y };
  const ankleLeft = { x: ankleRight.x - leftShift, y: ankleRight.y };
  const shoulderLeft = { x: shoulderRight.x - leftShift, y: shoulderRight.y + 0.01 };
  const elbowLeft = { x: elbowRight.x - leftShift, y: elbowRight.y };
  const wristLeft = { x: wristRight.x - leftShift, y: wristRight.y };

  landmarks[0] = { x: centerX, y: shoulderRight.y - 0.16, z: 0, visibility };
  landmarks[7] = { x: centerX - 0.03, y: shoulderRight.y - 0.14, z: 0, visibility };
  landmarks[8] = { x: centerX + 0.03, y: shoulderRight.y - 0.14, z: 0, visibility };
  landmarks[11] = { x: shoulderLeft.x, y: shoulderLeft.y, z: 0, visibility };
  landmarks[12] = { x: shoulderRight.x, y: shoulderRight.y, z: 0, visibility };
  landmarks[13] = { x: elbowLeft.x, y: elbowLeft.y, z: 0, visibility };
  landmarks[14] = { x: elbowRight.x, y: elbowRight.y, z: 0, visibility };
  landmarks[15] = { x: wristLeft.x, y: wristLeft.y, z: 0, visibility };
  landmarks[16] = { x: wristRight.x, y: wristRight.y, z: 0, visibility };
  landmarks[23] = { x: hipLeft.x, y: hipLeft.y, z: 0, visibility };
  landmarks[24] = { x: hipRight.x, y: hipRight.y, z: 0, visibility };
  landmarks[25] = { x: kneeLeft.x, y: kneeLeft.y, z: 0, visibility };
  landmarks[26] = { x: kneeRight.x, y: kneeRight.y, z: 0, visibility };
  landmarks[27] = { x: ankleLeft.x, y: ankleLeft.y, z: 0, visibility };
  landmarks[28] = { x: ankleRight.x, y: ankleRight.y, z: 0, visibility };

  return buildResult(landmarks, visibility);
}

function buildPushupPose({ elbowAngle, visibility = DEFAULT_VISIBILITY }: SyntheticPushupOptions): PoseEstimateResult {
  const landmarks = createBlankLandmarks(visibility);
  const elbowRight = { x: 0.55, y: 0.59 };
  const wristRight = { x: 0.7, y: 0.7 };
  const wristAngle = Math.atan2(wristRight.y - elbowRight.y, wristRight.x - elbowRight.x) * (180 / Math.PI);
  const candidateAngles = [wristAngle - elbowAngle, wristAngle + elbowAngle];

  const shoulderVectorLength = 0.17;
  const shoulderVector = candidateAngles
    .map((angle) => {
      const radians = degToRad(angle);
      return {
        x: Math.cos(radians) * shoulderVectorLength,
        y: Math.sin(radians) * shoulderVectorLength,
      };
    })
    .filter((vector) => vector.x <= 0 && vector.y <= 0)
    .sort((left, right) => left.y - right.y)[0] ?? { x: -0.14, y: -0.08 };

  const shoulderRight = {
    x: elbowRight.x + shoulderVector.x,
    y: elbowRight.y + shoulderVector.y,
  };
  const bodyVector = { x: 0.18, y: 0.08 };
  const hipRight = { x: shoulderRight.x + bodyVector.x, y: shoulderRight.y + bodyVector.y };
  const kneeRight = { x: hipRight.x + bodyVector.x * 0.68, y: hipRight.y + bodyVector.y * 0.68 };
  const ankleRight = { x: hipRight.x + bodyVector.x * 1.36, y: hipRight.y + bodyVector.y * 1.36 };

  const leftShift = 0.12;
  const shoulderLeft = { x: shoulderRight.x - leftShift, y: shoulderRight.y + 0.01 };
  const elbowLeft = { x: elbowRight.x - leftShift, y: elbowRight.y + 0.01 };
  const wristLeft = { x: wristRight.x - leftShift, y: wristRight.y + 0.01 };
  const hipLeft = { x: hipRight.x - leftShift, y: hipRight.y + 0.01 };
  const kneeLeft = { x: kneeRight.x - leftShift, y: kneeRight.y + 0.01 };
  const ankleLeft = { x: ankleRight.x - leftShift, y: ankleRight.y + 0.01 };
  const noseY = shoulderRight.y - 0.14;

  landmarks[0] = { x: shoulderRight.x - 0.02, y: noseY, z: 0, visibility };
  landmarks[7] = { x: shoulderRight.x - 0.05, y: noseY + 0.01, z: 0, visibility };
  landmarks[8] = { x: shoulderRight.x + 0.01, y: noseY + 0.01, z: 0, visibility };
  landmarks[11] = { x: shoulderLeft.x, y: shoulderLeft.y, z: 0, visibility };
  landmarks[12] = { x: shoulderRight.x, y: shoulderRight.y, z: 0, visibility };
  landmarks[13] = { x: elbowLeft.x, y: elbowLeft.y, z: 0, visibility };
  landmarks[14] = { x: elbowRight.x, y: elbowRight.y, z: 0, visibility };
  landmarks[15] = { x: wristLeft.x, y: wristLeft.y, z: 0, visibility };
  landmarks[16] = { x: wristRight.x, y: wristRight.y, z: 0, visibility };
  landmarks[23] = { x: hipLeft.x, y: hipLeft.y, z: 0, visibility };
  landmarks[24] = { x: hipRight.x, y: hipRight.y, z: 0, visibility };
  landmarks[25] = { x: kneeLeft.x, y: kneeLeft.y, z: 0, visibility };
  landmarks[26] = { x: kneeRight.x, y: kneeRight.y, z: 0, visibility };
  landmarks[27] = { x: ankleLeft.x, y: ankleLeft.y, z: 0, visibility };
  landmarks[28] = { x: ankleRight.x, y: ankleRight.y, z: 0, visibility };

  return buildResult(landmarks, visibility);
}

function buildPlankPose({ bodyLineAngle, visibility = DEFAULT_VISIBILITY }: SyntheticPlankOptions): PoseEstimateResult {
  const landmarks = createBlankLandmarks(visibility);
  const hipRight = { x: 0.54, y: 0.58 };
  const shoulderRight = { x: 0.38, y: 0.49 };
  const shoulderAngle = Math.atan2(shoulderRight.y - hipRight.y, shoulderRight.x - hipRight.x) * (180 / Math.PI);
  const candidateAngles = [shoulderAngle - bodyLineAngle, shoulderAngle + bodyLineAngle];

  const ankleVectorLength = 0.34;
  const ankleVector = candidateAngles
    .map((angle) => {
      const radians = degToRad(angle);
      return {
        x: Math.cos(radians) * ankleVectorLength,
        y: Math.sin(radians) * ankleVectorLength,
      };
    })
    .filter((vector) => vector.x >= 0 && vector.y >= 0)
    .sort((left, right) => right.x - left.x)[0] ?? { x: 0.27, y: 0.12 };

  const ankleRight = { x: hipRight.x + ankleVector.x, y: hipRight.y + ankleVector.y };
  const kneeRight = { x: hipRight.x + ankleVector.x * 0.55, y: hipRight.y + ankleVector.y * 0.55 };
  const elbowRight = { x: shoulderRight.x + 0.04, y: shoulderRight.y + 0.12 };
  const wristRight = { x: elbowRight.x + 0.02, y: elbowRight.y + 0.1 };

  const leftShift = 0.12;
  const shoulderLeft = { x: shoulderRight.x - leftShift, y: shoulderRight.y + 0.01 };
  const elbowLeft = { x: elbowRight.x - leftShift, y: elbowRight.y + 0.01 };
  const wristLeft = { x: wristRight.x - leftShift, y: wristRight.y + 0.01 };
  const hipLeft = { x: hipRight.x - leftShift, y: hipRight.y + 0.01 };
  const kneeLeft = { x: kneeRight.x - leftShift, y: kneeRight.y + 0.01 };
  const ankleLeft = { x: ankleRight.x - leftShift, y: ankleRight.y + 0.01 };
  const noseY = shoulderRight.y - 0.14;

  landmarks[0] = { x: shoulderRight.x - 0.02, y: noseY, z: 0, visibility };
  landmarks[7] = { x: shoulderRight.x - 0.05, y: noseY + 0.01, z: 0, visibility };
  landmarks[8] = { x: shoulderRight.x + 0.01, y: noseY + 0.01, z: 0, visibility };
  landmarks[11] = { x: shoulderLeft.x, y: shoulderLeft.y, z: 0, visibility };
  landmarks[12] = { x: shoulderRight.x, y: shoulderRight.y, z: 0, visibility };
  landmarks[13] = { x: elbowLeft.x, y: elbowLeft.y, z: 0, visibility };
  landmarks[14] = { x: elbowRight.x, y: elbowRight.y, z: 0, visibility };
  landmarks[15] = { x: wristLeft.x, y: wristLeft.y, z: 0, visibility };
  landmarks[16] = { x: wristRight.x, y: wristRight.y, z: 0, visibility };
  landmarks[23] = { x: hipLeft.x, y: hipLeft.y, z: 0, visibility };
  landmarks[24] = { x: hipRight.x, y: hipRight.y, z: 0, visibility };
  landmarks[25] = { x: kneeLeft.x, y: kneeLeft.y, z: 0, visibility };
  landmarks[26] = { x: kneeRight.x, y: kneeRight.y, z: 0, visibility };
  landmarks[27] = { x: ankleLeft.x, y: ankleLeft.y, z: 0, visibility };
  landmarks[28] = { x: ankleRight.x, y: ankleRight.y, z: 0, visibility };

  return buildResult(landmarks, visibility);
}

function repeatFrames(frame: PoseEstimateResult, count: number): PoseEstimateResult[] {
  return Array.from({ length: count }, () => frame);
}

function buildSquatSingleRepScript(): PoseEstimateResult[] {
  return [
    ...repeatFrames(buildSquatPose({ kneeAngle: 174 }), 10),
    ...repeatFrames(buildSquatPose({ kneeAngle: 166, hipShiftX: -0.01 }), 8),
    ...repeatFrames(buildSquatPose({ kneeAngle: 152, hipShiftX: -0.02 }), 8),
    ...repeatFrames(buildSquatPose({ kneeAngle: 132, hipShiftX: -0.03, hipLift: 0.005 }), 8),
    ...repeatFrames(buildSquatPose({ kneeAngle: 106, hipShiftX: -0.04, hipLift: 0.01 }), 10),
    ...repeatFrames(buildSquatPose({ kneeAngle: 128, hipShiftX: -0.03, hipLift: 0.005 }), 8),
    ...repeatFrames(buildSquatPose({ kneeAngle: 150, hipShiftX: -0.02 }), 8),
    ...repeatFrames(buildSquatPose({ kneeAngle: 168, hipShiftX: -0.01 }), 8),
    ...repeatFrames(buildSquatPose({ kneeAngle: 176 }), 12),
  ];
}

function buildPushupSingleRepScript(): PoseEstimateResult[] {
  return [
    ...repeatFrames(buildPushupPose({ elbowAngle: 174 }), 10),
    ...repeatFrames(buildPushupPose({ elbowAngle: 166 }), 8),
    ...repeatFrames(buildPushupPose({ elbowAngle: 150 }), 8),
    ...repeatFrames(buildPushupPose({ elbowAngle: 128 }), 8),
    ...repeatFrames(buildPushupPose({ elbowAngle: 102 }), 10),
    ...repeatFrames(buildPushupPose({ elbowAngle: 126 }), 8),
    ...repeatFrames(buildPushupPose({ elbowAngle: 148 }), 8),
    ...repeatFrames(buildPushupPose({ elbowAngle: 166 }), 8),
    ...repeatFrames(buildPushupPose({ elbowAngle: 176 }), 12),
  ];
}

function buildPlankShortHoldScript(): PoseEstimateResult[] {
  return [
    ...repeatFrames(buildPlankPose({ bodyLineAngle: 178 }), 16),
    ...repeatFrames(buildPlankPose({ bodyLineAngle: 180 }), 36),
    ...repeatFrames(buildPlankPose({ bodyLineAngle: 120 }), 28),
  ];
}

function buildSquatVisibilityRecoveryScript(): PoseEstimateResult[] {
  return [
    ...repeatFrames(buildSquatPose({ kneeAngle: 174, visibility: 0.98 }), 12),
    ...repeatFrames(buildSquatPose({ kneeAngle: 174, visibility: 0.34 }), 18),
    ...repeatFrames(buildSquatPose({ kneeAngle: 174, visibility: 0.98 }), 18),
  ];
}

function buildSquatReadyHoldScript(): PoseEstimateResult[] {
  return repeatFrames(buildSquatPose({ kneeAngle: 170, hipShiftX: -0.01, hipLift: 0.002 }), 90);
}

const SCRIPTS: Record<CoachTestPoseScriptName, PoseEstimateResult[]> = {
  "squat-single-rep": buildSquatSingleRepScript(),
  "pushup-single-rep": buildPushupSingleRepScript(),
  "plank-short-hold": buildPlankShortHoldScript(),
  "squat-visibility-recovery": buildSquatVisibilityRecoveryScript(),
  "squat-ready-hold": buildSquatReadyHoldScript(),
};

export function isCoachTestPoseScriptName(value: string | null): value is CoachTestPoseScriptName {
  return value !== null && SCRIPT_NAMES.includes(value as CoachTestPoseScriptName);
}

export function getCoachTestPoseScript(name: string | null): PoseEstimateResult[] | null {
  if (!isCoachTestPoseScriptName(name)) {
    return null;
  }

  return SCRIPTS[name].map((frame) => ({
    ...frame,
    landmarks: frame.landmarks.map((landmark) => ({ ...landmark })),
  }));
}

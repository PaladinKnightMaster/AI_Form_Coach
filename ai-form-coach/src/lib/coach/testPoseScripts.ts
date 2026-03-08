import type { Landmark3D, PoseEstimateResult } from "@/lib/pose/engine";

export type CoachTestPoseScriptName = "squat-single-rep";

const SCRIPT_NAMES: CoachTestPoseScriptName[] = ["squat-single-rep"];
const DEFAULT_VISIBILITY = 0.98;

interface SyntheticPoseOptions {
  kneeAngle: number;
  hipShiftX?: number;
  hipLift?: number;
  visibility?: number;
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
}

function createBlankLandmarks(visibility = DEFAULT_VISIBILITY): Landmark3D[] {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility }));
}

function buildSquatPose({ kneeAngle, hipShiftX = 0, hipLift = 0, visibility = DEFAULT_VISIBILITY }: SyntheticPoseOptions): PoseEstimateResult {
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

  return {
    landmarks,
    fps: 30,
    visibilityScore: visibility,
    bestSide: "right",
    leftVisibility: visibility,
    rightVisibility: visibility,
  };
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

const SCRIPTS: Record<CoachTestPoseScriptName, PoseEstimateResult[]> = {
  "squat-single-rep": buildSquatSingleRepScript(),
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

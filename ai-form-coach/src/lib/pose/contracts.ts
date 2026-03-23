import type { Landmark3D } from "@/lib/pose/engine";

export const RAW_POSE_LANDMARK_COUNT = 33;

export type RawPose33 = Landmark3D[];

export type FitnessJointId =
  | "nose"
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftWrist"
  | "rightWrist"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee"
  | "leftAnkle"
  | "rightAnkle"
  | "leftHeel"
  | "rightHeel"
  | "leftFootIndex"
  | "rightFootIndex";

export type DerivedJointId = "neck" | "pelvis_center" | "torso_center" | "head_center";

export interface SkeletonJoint extends Landmark3D {
  id: FitnessJointId | DerivedJointId;
  sourceIndices: number[];
}

export type FitnessSkeleton17 = Record<FitnessJointId, SkeletonJoint | null>;

export interface DerivedJoints {
  neck: SkeletonJoint | null;
  pelvis_center: SkeletonJoint | null;
  torso_center: SkeletonJoint | null;
  head_center: SkeletonJoint | null;
}

export interface MotionFeatures {
  visibilityScore: number;
  leftVisibility: number;
  rightVisibility: number;
  symmetryScore: number;
  shoulderTiltDeg: number;
  hipTiltDeg: number;
  torsoAngleDeg: number;
  cueState: "clear" | "adjust" | "low_visibility";
}

export const FITNESS_JOINT_INDEX_MAP: Record<FitnessJointId, number> = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
};

export const FITNESS_RENDER_JOINT_ORDER: Array<FitnessJointId | DerivedJointId> = [
  "head_center",
  "neck",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "torso_center",
  "pelvis_center",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle",
  "leftHeel",
  "rightHeel",
  "leftFootIndex",
  "rightFootIndex",
];

export const FITNESS_SKELETON_EDGES: Array<[FitnessJointId | DerivedJointId, FitnessJointId | DerivedJointId]> = [
  ["head_center", "neck"],
  ["neck", "leftShoulder"],
  ["neck", "rightShoulder"],
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftWrist"],
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightWrist"],
  ["neck", "torso_center"],
  ["torso_center", "pelvis_center"],
  ["pelvis_center", "leftHip"],
  ["pelvis_center", "rightHip"],
  ["leftHip", "leftKnee"],
  ["leftKnee", "leftAnkle"],
  ["leftAnkle", "leftHeel"],
  ["leftAnkle", "leftFootIndex"],
  ["rightHip", "rightKnee"],
  ["rightKnee", "rightAnkle"],
  ["rightAnkle", "rightHeel"],
  ["rightAnkle", "rightFootIndex"],
];

function cloneJoint(
  id: FitnessJointId | DerivedJointId,
  joint: Landmark3D | null | undefined,
  sourceIndices: number[],
): SkeletonJoint | null {
  if (!joint) {
    return null;
  }
  return {
    id,
    x: joint.x,
    y: joint.y,
    z: joint.z,
    visibility: joint.visibility,
    sourceIndices,
  };
}

function averageJoint(
  id: DerivedJointId,
  joints: Array<SkeletonJoint | null>,
  sourceIndices: number[],
): SkeletonJoint | null {
  const validJoints = joints.filter((joint): joint is SkeletonJoint => Boolean(joint));
  if (validJoints.length === 0) {
    return null;
  }

  const totals = validJoints.reduce(
    (acc, joint) => {
      acc.x += joint.x;
      acc.y += joint.y;
      acc.z += joint.z;
      acc.visibility += joint.visibility;
      return acc;
    },
    { x: 0, y: 0, z: 0, visibility: 0 },
  );

  return {
    id,
    x: totals.x / validJoints.length,
    y: totals.y / validJoints.length,
    z: totals.z / validJoints.length,
    visibility: totals.visibility / validJoints.length,
    sourceIndices,
  };
}

function angleBetween(a: SkeletonJoint | null, b: SkeletonJoint | null): number {
  if (!a || !b) {
    return 0;
  }
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

export function reduceToFitnessSkeleton(rawPose: RawPose33 | null | undefined): FitnessSkeleton17 {
  return Object.fromEntries(
    Object.entries(FITNESS_JOINT_INDEX_MAP).map(([id, index]) => {
      const jointId = id as FitnessJointId;
      const landmark = rawPose?.[index] ?? null;
      return [jointId, cloneJoint(jointId, landmark, [index])];
    }),
  ) as FitnessSkeleton17;
}

export function deriveJoints(skeleton: FitnessSkeleton17): DerivedJoints {
  const neck = averageJoint("neck", [skeleton.leftShoulder, skeleton.rightShoulder], [
    FITNESS_JOINT_INDEX_MAP.leftShoulder,
    FITNESS_JOINT_INDEX_MAP.rightShoulder,
  ]);
  const pelvisCenter = averageJoint("pelvis_center", [skeleton.leftHip, skeleton.rightHip], [
    FITNESS_JOINT_INDEX_MAP.leftHip,
    FITNESS_JOINT_INDEX_MAP.rightHip,
  ]);
  const torsoCenter = averageJoint("torso_center", [neck, pelvisCenter], [
    FITNESS_JOINT_INDEX_MAP.leftShoulder,
    FITNESS_JOINT_INDEX_MAP.rightShoulder,
    FITNESS_JOINT_INDEX_MAP.leftHip,
    FITNESS_JOINT_INDEX_MAP.rightHip,
  ]);
  const headCenter = averageJoint("head_center", [skeleton.nose, neck], [FITNESS_JOINT_INDEX_MAP.nose]);

  return {
    neck,
    pelvis_center: pelvisCenter,
    torso_center: torsoCenter,
    head_center: headCenter,
  };
}

export function getRenderedFitnessJoints(skeleton: FitnessSkeleton17, derived: DerivedJoints) {
  return FITNESS_RENDER_JOINT_ORDER.map((id) => {
    if (id in derived) {
      return derived[id as DerivedJointId];
    }
    return skeleton[id as FitnessJointId];
  }).filter((joint): joint is SkeletonJoint => Boolean(joint));
}

export function buildMotionFeatures(skeleton: FitnessSkeleton17, derived: DerivedJoints): MotionFeatures {
  const joints = getRenderedFitnessJoints(skeleton, derived);
  const visibilityScore = joints.length > 0 ? joints.reduce((sum, joint) => sum + joint.visibility, 0) / joints.length : 0;
  const leftVisibility = [skeleton.leftShoulder, skeleton.leftHip, skeleton.leftKnee, skeleton.leftAnkle]
    .filter((joint): joint is SkeletonJoint => Boolean(joint))
    .reduce((sum, joint, _, arr) => sum + joint.visibility / arr.length, 0);
  const rightVisibility = [skeleton.rightShoulder, skeleton.rightHip, skeleton.rightKnee, skeleton.rightAnkle]
    .filter((joint): joint is SkeletonJoint => Boolean(joint))
    .reduce((sum, joint, _, arr) => sum + joint.visibility / arr.length, 0);
  const shoulderTiltDeg = angleBetween(skeleton.leftShoulder, skeleton.rightShoulder);
  const hipTiltDeg = angleBetween(skeleton.leftHip, skeleton.rightHip);
  const torsoAngleDeg = angleBetween(derived.pelvis_center, derived.neck);
  const symmetryScore = 1 - Math.min(1, Math.abs(leftVisibility - rightVisibility));
  const cueState = visibilityScore < 0.45 ? "low_visibility" : Math.abs(shoulderTiltDeg - hipTiltDeg) > 20 ? "adjust" : "clear";

  return {
    visibilityScore,
    leftVisibility,
    rightVisibility,
    symmetryScore,
    shoulderTiltDeg,
    hipTiltDeg,
    torsoAngleDeg,
    cueState,
  };
}

export function isJointHighlighted(joint: SkeletonJoint, highlightedRawIndices: number[]): boolean {
  return joint.sourceIndices.some((index) => highlightedRawIndices.includes(index));
}

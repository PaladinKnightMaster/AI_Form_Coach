/**
 * Pose Normalization Utilities
 * 
 * Provides perspective-independent pose normalization and robust angle calculations
 * using the better-visible side for bilateral exercises.
 * 
 * Features:
 * - Normalize landmarks relative to mid-hip center
 * - Scale by hip-to-ankle distance for size invariance
 * - Preserve Z-depth if available
 * - Automatic side selection for angle calculations
 */

import { Point3, angleBetween, distance3D } from '../math/poseMath';
import type { Landmark3D, PoseEstimateResult, BestSide } from './engine';

// ============================================
// Types
// ============================================

export interface NormalizedLandmarks {
  landmarks: Landmark3D[];
  scale: number;
  center: Point3;
}

export interface RobustAngles {
  // Squat/lower body angles
  hipAngle: number | null;
  kneeAngle: number | null;
  ankleAngle: number | null;
  
  // Push-up/upper body angles
  shoulderAngle: number | null;
  elbowAngle: number | null;
  wristAngle: number | null;
  
  // Additional metrics
  bodyLineAngle: number | null; // Shoulder-hip-ankle alignment
  torsoAngle: number | null; // Torso relative to vertical
  sideLean: number | null;   // Left-right lean
  
  // Which side was used
  usedSide: BestSide;
}

// ============================================
// Normalization
// ============================================

/**
 * Normalize landmarks for perspective invariance
 * 
 * Process:
 * 1. Find mid-hip point as center
 * 2. Calculate hip-to-ankle distance as scale
 * 3. Center all points on mid-hip
 * 4. Scale by hip-ankle distance
 * 5. Preserve Z-depth if available
 */
export function normalizeForPerspective(landmarks: Landmark3D[]): NormalizedLandmarks {
  // Get hip landmarks
  const leftHip = landmarks[23];   // Left hip
  const rightHip = landmarks[24];  // Right hip
  const leftAnkle = landmarks[27]; // Left ankle
  const rightAnkle = landmarks[28]; // Right ankle

  // Calculate mid-hip as center point
  const center: Point3 = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2
  };

  // Calculate scale as average hip-to-ankle distance
  const leftHipAnkleDist = distance3D(leftHip, leftAnkle);
  const rightHipAnkleDist = distance3D(rightHip, rightAnkle);
  const scale = (leftHipAnkleDist + rightHipAnkleDist) / 2;

  // Prevent division by zero
  const safeScale = scale > 0.001 ? scale : 1;

  // Normalize all landmarks
  const normalizedLandmarks: Landmark3D[] = landmarks.map(lm => ({
    x: (lm.x - center.x) / safeScale,
    y: (lm.y - center.y) / safeScale,
    z: (lm.z - center.z) / safeScale,
    visibility: lm.visibility
  }));

  return {
    landmarks: normalizedLandmarks,
    scale: safeScale,
    center
  };
}

/**
 * Denormalize landmarks back to original coordinate system
 */
export function denormalize(
  normalized: NormalizedLandmarks
): Landmark3D[] {
  return normalized.landmarks.map(lm => ({
    x: lm.x * normalized.scale + normalized.center.x,
    y: lm.y * normalized.scale + normalized.center.y,
    z: lm.z * normalized.scale + normalized.center.z,
    visibility: lm.visibility
  }));
}

// ============================================
// Robust Angle Calculations
// ============================================

/**
 * Calculate angles using the better-visible side
 * 
 * This prevents unreliable measurements from occluded or low-visibility landmarks.
 * Automatically selects left or right side based on PoseEngine2's bestSide determination.
 */
export function getRobustAngles(result: PoseEstimateResult): RobustAngles {
  const landmarks = result.landmarks;
  const side = result.bestSide;

  // Get indices for the better-visible side
  const hipIdx = side === 'left' ? 23 : 24;
  const kneeIdx = side === 'left' ? 25 : 26;
  const ankleIdx = side === 'left' ? 27 : 28;
  const shoulderIdx = side === 'left' ? 11 : 12;
  const elbowIdx = side === 'left' ? 13 : 14;
  const wristIdx = side === 'left' ? 15 : 16;

  // Get landmarks
  const hip = landmarks[hipIdx];
  const knee = landmarks[kneeIdx];
  const ankle = landmarks[ankleIdx];
  const shoulder = landmarks[shoulderIdx];
  const elbow = landmarks[elbowIdx];
  const wrist = landmarks[wristIdx];

  // Calculate lower body angles (for squats)
  const hipAngle = calculateAngle(shoulder, hip, knee);
  const kneeAngle = calculateAngle(hip, knee, ankle);
  const ankleAngle = calculateAngle(knee, ankle, { x: ankle.x, y: 1, z: ankle.z, visibility: ankle.visibility }); // Ankle relative to ground

  const bodyLineAngle = calculateAngle(shoulder, hip, ankle);

  // Calculate upper body angles (for push-ups)
  const shoulderAngle = calculateAngle(hip, shoulder, elbow);
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  const wristAngle = calculateAngle(elbow, wrist, { x: wrist.x, y: 1, z: wrist.z, visibility: wrist.visibility }); // Wrist relative to ground

  // Calculate torso angle (relative to vertical)
  const midHip = {
    x: (landmarks[23].x + landmarks[24].x) / 2,
    y: (landmarks[23].y + landmarks[24].y) / 2,
    z: (landmarks[23].z + landmarks[24].z) / 2,
    visibility: (landmarks[23].visibility + landmarks[24].visibility) / 2
  };
  const midShoulder = {
    x: (landmarks[11].x + landmarks[12].x) / 2,
    y: (landmarks[11].y + landmarks[12].y) / 2,
    z: (landmarks[11].z + landmarks[12].z) / 2,
    visibility: (landmarks[11].visibility + landmarks[12].visibility) / 2
  };
  const verticalUp = { x: midHip.x, y: 0, z: midHip.z, visibility: midHip.visibility }; // Point above hip
  const torsoAngle = calculateAngle(verticalUp, midHip, midShoulder);

  // Calculate side lean (left-right tilt)
  const hipWidth = Math.abs(landmarks[23].x - landmarks[24].x);
  const shoulderWidth = Math.abs(landmarks[11].x - landmarks[12].x);
  const sideLean = hipWidth > 0 ? (shoulderWidth / hipWidth) * 100 : 50;

  return {
    hipAngle,
    kneeAngle,
    ankleAngle,
    bodyLineAngle,
    shoulderAngle,
    elbowAngle,
    wristAngle,
    torsoAngle,
    sideLean,
    usedSide: side
  };
}

/**
 * Get specific angle for an exercise using best side
 */
export function getExerciseAngle(
  result: PoseEstimateResult,
  exercise: 'squat' | 'pushup' | 'plank'
): number | null {
  const angles = getRobustAngles(result);

  switch (exercise) {
    case 'squat':
      // Primary angle is knee angle for squat depth
      return angles.kneeAngle;
    
    case 'pushup':
      // Primary angle is elbow angle for push-up depth
      return angles.elbowAngle;
    
    case 'plank':
      // Primary angle is shoulder-hip-ankle body line for plank alignment
      return angles.bodyLineAngle;
    
    default:
      return null;
  }
}

/**
 * Get all relevant angles for a specific exercise
 */
export function getExerciseAngles(
  result: PoseEstimateResult,
  exercise: 'squat' | 'pushup' | 'plank'
): Partial<RobustAngles> {
  const allAngles = getRobustAngles(result);

  switch (exercise) {
    case 'squat':
      return {
        hipAngle: allAngles.hipAngle,
        kneeAngle: allAngles.kneeAngle,
        ankleAngle: allAngles.ankleAngle,
        torsoAngle: allAngles.torsoAngle,
        usedSide: allAngles.usedSide
      };
    
    case 'pushup':
      return {
        shoulderAngle: allAngles.shoulderAngle,
        elbowAngle: allAngles.elbowAngle,
        wristAngle: allAngles.wristAngle,
        torsoAngle: allAngles.torsoAngle,
        usedSide: allAngles.usedSide
      };
    
    case 'plank':
      return {
        bodyLineAngle: allAngles.bodyLineAngle,
        torsoAngle: allAngles.torsoAngle,
        sideLean: allAngles.sideLean,
        usedSide: allAngles.usedSide
      };
    
    default:
      return {};
  }
}

/**
 * Calculate angle between three 3D points
 * Returns angle in degrees (0-180)
 * Returns null if landmarks are not visible enough
 */
function calculateAngle(
  pointA: Landmark3D,
  pointB: Landmark3D,
  pointC: Landmark3D
): number | null {
  // Check visibility
  const minVisibility = 0.5;
  if (pointA.visibility < minVisibility || 
      pointB.visibility < minVisibility || 
      pointC.visibility < minVisibility) {
    return null;
  }

  // Calculate angle using existing math utilities
  return angleBetween(pointA, pointB, pointC);
}

/**
 * Calculate 3D Euclidean distance between two points
 */
// Note: distance3D is now imported from poseMath.ts

/**
 * Check if a landmark is visible enough for reliable measurement
 */
export function isReliable(landmark: Landmark3D, threshold: number = 0.5): boolean {
  return landmark.visibility >= threshold;
}

/**
 * Get landmark by name and side
 */
export function getLandmarkByName(
  landmarks: Landmark3D[],
  name: string,
  side: BestSide = 'right'
): Landmark3D | null {
  const index = getLandmarkIndex(name, side);
  return index !== null ? landmarks[index] : null;
}

/**
 * Get landmark index by name and side
 */
export function getLandmarkIndex(name: string, side: BestSide = 'right'): number | null {
  const indices: Record<string, { left: number; right: number }> = {
    shoulder: { left: 11, right: 12 },
    elbow: { left: 13, right: 14 },
    wrist: { left: 15, right: 16 },
    hip: { left: 23, right: 24 },
    knee: { left: 25, right: 26 },
    ankle: { left: 27, right: 28 }
  };

  const joint = indices[name.toLowerCase()];
  if (!joint) return null;

  return joint[side];
}

/**
 * Calculate ROM (Range of Motion) score for an angle
 * 
 * Compares current angle to target range and returns a score 0-1
 */
export function calculateROMScore(
  currentAngle: number | null,
  targetMin: number,
  targetMax: number
): number {
  if (currentAngle === null) return 0;

  if (currentAngle >= targetMin && currentAngle <= targetMax) {
    return 1.0; // Perfect ROM
  }

  // Calculate how far outside the range
  let deviation: number;
  if (currentAngle < targetMin) {
    deviation = targetMin - currentAngle;
  } else {
    deviation = currentAngle - targetMax;
  }

  // Score decreases linearly with deviation (up to 30 degrees)
  const maxDeviation = 30;
  const score = Math.max(0, 1 - (deviation / maxDeviation));

  return score;
}

/**
 * Calculate average visibility for a set of landmarks
 */
export function calculateAverageVisibility(landmarks: Landmark3D[]): number {
  if (landmarks.length === 0) return 0;
  const sum = landmarks.reduce((acc, lm) => acc + lm.visibility, 0);
  return sum / landmarks.length;
}


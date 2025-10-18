/**
 * Advanced 3D Pose Analysis System
 * 
 * Provides professional-grade 3D pose analysis similar to Sword Health AI
 * 
 * Features:
 * - 3D pose reconstruction from camera perspective
 * - Biomechanical analysis and joint angle calculations
 * - 3D movement pattern recognition
 * - Advanced form scoring algorithms
 * - Real-time 3D feedback generation
 */

import { Point3, angleBetween, distance3D } from '../math/poseMath';
import type { Landmark3D, PoseEstimateResult } from './engine';

// ============================================
// 3D Pose Analysis Types
// ============================================

export interface Pose3D {
  landmarks: Landmark3D[];
  skeleton: Skeleton3D;
  biomechanics: Biomechanics3D;
  formScore: FormScore3D;
  movement: Movement3D;
}

export interface Skeleton3D {
  // Core body segments
  head: BodySegment3D;
  torso: BodySegment3D;
  leftArm: BodySegment3D;
  rightArm: BodySegment3D;
  leftLeg: BodySegment3D;
  rightLeg: BodySegment3D;
  
  // Joint angles (3D)
  jointAngles: JointAngles3D;
  
  // Body alignment
  alignment: BodyAlignment3D;
}

export interface BodySegment3D {
  start: Point3;
  end: Point3;
  length: number;
  direction: Point3; // Unit vector
  center: Point3;
}

export interface JointAngles3D {
  // Lower body
  leftHip: JointAngle3D;
  rightHip: JointAngle3D;
  leftKnee: JointAngle3D;
  rightKnee: JointAngle3D;
  leftAnkle: JointAngle3D;
  rightAnkle: JointAngle3D;
  
  // Upper body
  leftShoulder: JointAngle3D;
  rightShoulder: JointAngle3D;
  leftElbow: JointAngle3D;
  rightElbow: JointAngle3D;
  leftWrist: JointAngle3D;
  rightWrist: JointAngle3D;
  
  // Spine
  neck: JointAngle3D;
  midSpine: JointAngle3D;
  lowerSpine: JointAngle3D;
}

export interface JointAngle3D {
  angle: number; // Degrees
  flexion: number; // Flexion/extension
  abduction: number; // Abduction/adduction
  rotation: number; // Internal/external rotation
  confidence: number; // 0-1
}

export interface Biomechanics3D {
  // Center of mass
  centerOfMass: Point3;
  
  // Balance metrics
  balance: Balance3D;
  
  // Stability metrics
  stability: Stability3D;
  
  // Force vectors (estimated)
  forces: ForceVectors3D;
}

export interface Balance3D {
  // Base of support
  baseOfSupport: Point3[];
  area: number;
  
  // Center of pressure
  centerOfPressure: Point3;
  
  // Balance score (0-1)
  score: number;
  
  // Stability margin
  stabilityMargin: number;
}

export interface Stability3D {
  // Core stability
  coreStability: number;
  
  // Joint stability
  jointStability: Record<string, number>;
  
  // Overall stability score
  score: number;
}

export interface ForceVectors3D {
  // Ground reaction forces (estimated)
  leftFoot: Point3;
  rightFoot: Point3;
  
  // Joint reaction forces (estimated)
  jointForces: Record<string, Point3>;
}

export interface BodyAlignment3D {
  // Spinal alignment
  spinalAlignment: number; // 0-1
  
  // Pelvic alignment
  pelvicAlignment: number; // 0-1
  
  // Shoulder alignment
  shoulderAlignment: number; // 0-1
  
  // Overall alignment score
  score: number;
}

export interface FormScore3D {
  // Exercise-specific scores
  exercise: ExerciseFormScore3D;
  
  // Overall form quality
  overall: number; // 0-100
  
  // Detailed breakdown
  breakdown: FormBreakdown3D;
}

export interface ExerciseFormScore3D {
  squat?: SquatForm3D;
  pushup?: PushupForm3D;
  plank?: PlankForm3D;
  deadlift?: DeadliftForm3D;
  lunge?: LungeForm3D;
}

export interface SquatForm3D {
  depth: number; // 0-1
  kneeTracking: number; // 0-1
  torsoAngle: number; // 0-1
  balance: number; // 0-1
  overall: number; // 0-100
}

export interface PushupForm3D {
  depth: number; // 0-1
  bodyAlignment: number; // 0-1
  elbowTracking: number; // 0-1
  coreStability: number; // 0-1
  overall: number; // 0-100
}

export interface PlankForm3D {
  bodyAlignment: number; // 0-1
  coreStability: number; // 0-1
  shoulderStability: number; // 0-1
  hipAlignment: number; // 0-1
  overall: number; // 0-100
}

export interface DeadliftForm3D {
  hipHinge: number; // 0-1
  spineAlignment: number; // 0-1
  kneeTracking: number; // 0-1
  balance: number; // 0-1
  overall: number; // 0-100
}

export interface LungeForm3D {
  depth: number; // 0-1
  kneeTracking: number; // 0-1
  torsoAlignment: number; // 0-1
  balance: number; // 0-1
  overall: number; // 0-100
}

export interface FormBreakdown3D {
  technique: number; // 0-1
  rangeOfMotion: number; // 0-1
  stability: number; // 0-1
  alignment: number; // 0-1
  balance: number; // 0-1
}

export interface Movement3D {
  // Movement phase detection
  phase: MovementPhase;
  
  // Movement quality
  quality: MovementQuality3D;
  
  // Progression tracking
  progression: MovementProgression3D;
}

export interface MovementQuality3D {
  // Smoothness
  smoothness: number; // 0-1
  
  // Control
  control: number; // 0-1
  
  // Power
  power: number; // 0-1
  
  // Overall quality
  overall: number; // 0-1
}

export interface MovementProgression3D {
  // Range of motion improvement
  romImprovement: number; // Percentage
  
  // Strength progression
  strengthProgression: number; // Percentage
  
  // Form improvement
  formImprovement: number; // Percentage
  
  // Overall progression
  overall: number; // Percentage
}

export type MovementPhase = 
  | 'setup'
  | 'eccentric' 
  | 'bottom'
  | 'concentric'
  | 'top'
  | 'rest';

// ============================================
// 3D Pose Analysis Engine
// ============================================

export class Pose3DAnalyzer {
  private lastPose: Pose3D | null = null;
  private movementHistory: Pose3D[] = [];
  private readonly maxHistorySize = 30; // ~1 second at 30fps

  /**
   * Analyze 3D pose from MediaPipe result
   */
  analyze(result: PoseEstimateResult): Pose3D {
    const landmarks = result.landmarks;
    
    // Build 3D skeleton
    const skeleton = this.buildSkeleton3D(landmarks);
    
    // Calculate biomechanics
    const biomechanics = this.calculateBiomechanics3D(landmarks, skeleton);
    
    // Score form
    const formScore = this.scoreForm3D(skeleton, biomechanics);
    
    // Analyze movement
    const movement = this.analyzeMovement3D(skeleton, formScore);
    
    const pose3D: Pose3D = {
      landmarks,
      skeleton,
      biomechanics,
      formScore,
      movement
    };
    
    // Update history
    this.updateHistory(pose3D);
    this.lastPose = pose3D;
    
    return pose3D;
  }

  /**
   * Build 3D skeleton from landmarks
   */
  private buildSkeleton3D(landmarks: Landmark3D[]): Skeleton3D {
    // Calculate body segments
    const head = this.calculateBodySegment(landmarks[0], landmarks[1]); // Nose to left eye
    const torso = this.calculateBodySegment(
      this.midpoint(landmarks[11], landmarks[12]), // Mid shoulder
      this.midpoint(landmarks[23], landmarks[24])  // Mid hip
    );
    
    const leftArm = this.calculateBodySegment(landmarks[11], landmarks[13]); // Left shoulder to elbow
    const rightArm = this.calculateBodySegment(landmarks[12], landmarks[14]); // Right shoulder to elbow
    
    const leftLeg = this.calculateBodySegment(landmarks[23], landmarks[25]); // Left hip to knee
    const rightLeg = this.calculateBodySegment(landmarks[24], landmarks[26]); // Right hip to knee
    
    // Calculate 3D joint angles
    const jointAngles = this.calculateJointAngles3D(landmarks);
    
    // Calculate body alignment
    const alignment = this.calculateBodyAlignment3D(landmarks, jointAngles);
    
    return {
      head,
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      jointAngles,
      alignment
    };
  }

  /**
   * Calculate body segment from two points
   */
  private calculateBodySegment(start: Point3, end: Point3): BodySegment3D {
    const length = distance3D(start, end);
    const direction = {
      x: (end.x - start.x) / length,
      y: (end.y - start.y) / length,
      z: (end.z - start.z) / length
    };
    const center = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
      z: (start.z + end.z) / 2
    };
    
    return { start, end, length, direction, center };
  }

  /**
   * Calculate midpoint between two points
   */
  private midpoint(p1: Point3, p2: Point3): Point3 {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      z: (p1.z + p2.z) / 2
    };
  }

  /**
   * Calculate 3D joint angles
   */
  private calculateJointAngles3D(landmarks: Landmark3D[]): JointAngles3D {
    return {
      // Lower body
      leftHip: this.calculateJointAngle3D(landmarks[11], landmarks[23], landmarks[25]), // Shoulder-hip-knee
      rightHip: this.calculateJointAngle3D(landmarks[12], landmarks[24], landmarks[26]),
      leftKnee: this.calculateJointAngle3D(landmarks[23], landmarks[25], landmarks[27]), // Hip-knee-ankle
      rightKnee: this.calculateJointAngle3D(landmarks[24], landmarks[26], landmarks[28]),
      leftAnkle: this.calculateJointAngle3D(landmarks[25], landmarks[27], this.groundPoint(landmarks[27])),
      rightAnkle: this.calculateJointAngle3D(landmarks[26], landmarks[28], this.groundPoint(landmarks[28])),
      
      // Upper body
      leftShoulder: this.calculateJointAngle3D(landmarks[23], landmarks[11], landmarks[13]), // Hip-shoulder-elbow
      rightShoulder: this.calculateJointAngle3D(landmarks[24], landmarks[12], landmarks[14]),
      leftElbow: this.calculateJointAngle3D(landmarks[11], landmarks[13], landmarks[15]), // Shoulder-elbow-wrist
      rightElbow: this.calculateJointAngle3D(landmarks[12], landmarks[14], landmarks[16]),
      leftWrist: this.calculateJointAngle3D(landmarks[13], landmarks[15], this.groundPoint(landmarks[15])),
      rightWrist: this.calculateJointAngle3D(landmarks[14], landmarks[16], this.groundPoint(landmarks[16])),
      
      // Spine
      neck: this.calculateJointAngle3D(landmarks[11], landmarks[0], landmarks[1]), // Shoulder-nose-eye
      midSpine: this.calculateJointAngle3D(landmarks[11], this.midpoint(landmarks[11], landmarks[12]), landmarks[23]),
      lowerSpine: this.calculateJointAngle3D(this.midpoint(landmarks[11], landmarks[12]), landmarks[23], landmarks[24])
    };
  }

  /**
   * Calculate 3D joint angle with flexion, abduction, and rotation
   */
  private calculateJointAngle3D(p1: Point3, p2: Point3, p3: Point3): JointAngle3D {
    const angle = angleBetween(p1, p2, p3);
    
    // Calculate flexion (forward/backward movement)
    const flexion = this.calculateFlexion(p1, p2, p3);
    
    // Calculate abduction (side-to-side movement)
    const abduction = this.calculateAbduction(p1, p2, p3);
    
    // Calculate rotation (twisting movement)
    const rotation = this.calculateRotation(p1, p2, p3);
    
    // Calculate confidence based on landmark visibility
    const confidence = ((p1 as Landmark3D).visibility + (p2 as Landmark3D).visibility + (p3 as Landmark3D).visibility) / 3;
    
    return {
      angle,
      flexion,
      abduction,
      rotation,
      confidence
    };
  }

  /**
   * Calculate flexion angle (forward/backward)
   */
  private calculateFlexion(p1: Point3, p2: Point3, p3: Point3): number {
    // Project onto sagittal plane (X-Z plane)
    const p1_sagittal = { x: p1.x, y: 0, z: p1.z };
    const p2_sagittal = { x: p2.x, y: 0, z: p2.z };
    const p3_sagittal = { x: p3.x, y: 0, z: p3.z };
    
    return angleBetween(p1_sagittal, p2_sagittal, p3_sagittal);
  }

  /**
   * Calculate abduction angle (side-to-side)
   */
  private calculateAbduction(p1: Point3, p2: Point3, p3: Point3): number {
    // Project onto frontal plane (Y-Z plane)
    const p1_frontal = { x: 0, y: p1.y, z: p1.z };
    const p2_frontal = { x: 0, y: p2.y, z: p2.z };
    const p3_frontal = { x: 0, y: p3.y, z: p3.z };
    
    return angleBetween(p1_frontal, p2_frontal, p3_frontal);
  }

  /**
   * Calculate rotation angle (twisting)
   */
  private calculateRotation(p1: Point3, p2: Point3, p3: Point3): number {
    // Calculate rotation around the joint axis
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
    
    // Cross product to find rotation axis
    const cross = {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    };
    
    // Calculate rotation angle
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    // Use cross product magnitude for more accurate rotation calculation
    const crossMag = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);
    const angle = Math.atan2(crossMag, dot) * (180 / Math.PI);
    return angle;
  }

  /**
   * Create ground reference point
   */
  private groundPoint(point: Point3): Landmark3D {
    return { x: point.x, y: 1, z: point.z, visibility: (point as Landmark3D).visibility };
  }

  /**
   * Calculate body alignment in 3D
   */
  private calculateBodyAlignment3D(landmarks: Landmark3D[], jointAngles: JointAngles3D): BodyAlignment3D {
    // Spinal alignment (shoulder-hip line)
    const shoulderMid = this.midpoint(landmarks[11], landmarks[12]);
    const hipMid = this.midpoint(landmarks[23], landmarks[24]);
    const spinalAngle = Math.abs(angleBetween(
      { x: shoulderMid.x, y: 0, z: shoulderMid.z },
      hipMid,
      { x: hipMid.x, y: 1, z: hipMid.z }
    ) - 90);
    const spinalAlignment = Math.max(0, 1 - spinalAngle / 30);
    
    // Pelvic alignment (hip level)
    const hipLevel = Math.abs(landmarks[23].y - landmarks[24].y);
    const pelvicAlignment = Math.max(0, 1 - hipLevel * 10);
    
    // Shoulder alignment (shoulder level)
    const shoulderLevel = Math.abs(landmarks[11].y - landmarks[12].y);
    const shoulderAlignment = Math.max(0, 1 - shoulderLevel * 10);
    
    // Use joint angles for enhanced alignment analysis
    const kneeAlignment = Math.max(0, 1 - Math.abs(jointAngles.leftKnee.angle - jointAngles.rightKnee.angle) / 20);
    const ankleAlignment = Math.max(0, 1 - Math.abs(jointAngles.leftAnkle.angle - jointAngles.rightAnkle.angle) / 15);
    
    const score = (spinalAlignment + pelvicAlignment + shoulderAlignment + kneeAlignment + ankleAlignment) / 5;
    
    return {
      spinalAlignment,
      pelvicAlignment,
      shoulderAlignment,
      score
    };
  }

  /**
   * Calculate 3D biomechanics
   */
  private calculateBiomechanics3D(landmarks: Landmark3D[], skeleton: Skeleton3D): Biomechanics3D {
    // Calculate center of mass (weighted average)
    const centerOfMass = this.calculateCenterOfMass(landmarks);
    
    // Calculate balance
    const balance = this.calculateBalance3D(landmarks, centerOfMass);
    
    // Calculate stability
    const stability = this.calculateStability3D(skeleton);
    
    // Estimate forces
    const forces = this.estimateForces3D(landmarks, skeleton);
    
    return {
      centerOfMass,
      balance,
      stability,
      forces
    };
  }

  /**
   * Calculate center of mass
   */
  private calculateCenterOfMass(landmarks: Landmark3D[]): Point3 {
    // Weighted by body segment mass (simplified)
    const weights = [0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07];
    
    let totalWeight = 0;
    let weightedX = 0, weightedY = 0, weightedZ = 0;
    
    landmarks.forEach((lm, i) => {
      const weight = weights[i] || 0.07;
      weightedX += lm.x * weight;
      weightedY += lm.y * weight;
      weightedZ += lm.z * weight;
      totalWeight += weight;
    });
    
    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
      z: weightedZ / totalWeight
    };
  }

  /**
   * Calculate 3D balance
   */
  private calculateBalance3D(landmarks: Landmark3D[], centerOfMass: Point3): Balance3D {
    // Base of support (feet)
    const baseOfSupport = [landmarks[27], landmarks[28]]; // Left and right ankle
    
    // Calculate base area (simplified)
    const area = distance3D(baseOfSupport[0], baseOfSupport[1]) * 0.1; // Approximate foot width
    
    // Center of pressure (midpoint of feet)
    const centerOfPressure = this.midpoint(baseOfSupport[0], baseOfSupport[1]);
    
    // Balance score based on center of mass position
    const comToBase = distance3D(centerOfMass, centerOfPressure);
    const score = Math.max(0, 1 - comToBase * 2);
    
    // Stability margin
    const stabilityMargin = Math.max(0, area - comToBase);
    
    return {
      baseOfSupport,
      area,
      centerOfPressure,
      score,
      stabilityMargin
    };
  }

  /**
   * Calculate 3D stability
   */
  private calculateStability3D(skeleton: Skeleton3D): Stability3D {
    // Core stability (torso alignment)
    const coreStability = skeleton.alignment.spinalAlignment;
    
    // Joint stability (based on joint angles)
    const jointStability: Record<string, number> = {};
    Object.entries(skeleton.jointAngles).forEach(([joint, angle]) => {
      // Ideal angles for stability (simplified)
      const idealAngles: Record<string, number> = {
        leftHip: 180, rightHip: 180,
        leftKnee: 180, rightKnee: 180,
        leftAnkle: 90, rightAnkle: 90,
        leftShoulder: 90, rightShoulder: 90,
        leftElbow: 180, rightElbow: 180
      };
      
      const ideal = idealAngles[joint] || 90;
      const deviation = Math.abs(angle.angle - ideal);
      jointStability[joint] = Math.max(0, 1 - deviation / 45);
    });
    
    const score = (coreStability + Object.values(jointStability).reduce((a, b) => a + b, 0) / Object.keys(jointStability).length) / 2;
    
    return {
      coreStability,
      jointStability,
      score
    };
  }

  /**
   * Estimate 3D forces
   */
  private estimateForces3D(landmarks: Landmark3D[], skeleton: Skeleton3D): ForceVectors3D {
    // Simplified force estimation based on body position
    const leftFoot = { x: 0, y: 0, z: 0.5 }; // Ground reaction force
    const rightFoot = { x: 0, y: 0, z: 0.5 };
    
    const jointForces: Record<string, Point3> = {};
    Object.keys(skeleton.jointAngles).forEach(joint => {
      jointForces[joint] = { x: 0, y: 0, z: 0.1 }; // Simplified
    });
    
    return {
      leftFoot,
      rightFoot,
      jointForces
    };
  }

  /**
   * Score 3D form
   */
  private scoreForm3D(skeleton: Skeleton3D, biomechanics: Biomechanics3D): FormScore3D {
    // Exercise-specific scoring (to be implemented based on detected exercise)
    const exercise: ExerciseFormScore3D = {};
    
    // Overall form quality
    const technique = (skeleton.alignment.score + biomechanics.stability.score) / 2;
    const rangeOfMotion = this.calculateRangeOfMotion(skeleton);
    const stability = biomechanics.stability.score;
    const alignment = skeleton.alignment.score;
    const balance = biomechanics.balance.score;
    
    const overall = (technique + rangeOfMotion + stability + alignment + balance) * 20; // Convert to 0-100
    
    const breakdown: FormBreakdown3D = {
      technique,
      rangeOfMotion,
      stability,
      alignment,
      balance
    };
    
    return {
      exercise,
      overall,
      breakdown
    };
  }

  /**
   * Calculate range of motion
   */
  private calculateRangeOfMotion(skeleton: Skeleton3D): number {
    // Calculate ROM based on joint angles
    const angles = Object.values(skeleton.jointAngles);
    const avgAngle = angles.reduce((sum, angle) => sum + angle.angle, 0) / angles.length;
    
    // Normalize to 0-1 (simplified)
    return Math.min(1, avgAngle / 180);
  }

  /**
   * Analyze 3D movement
   */
  private analyzeMovement3D(skeleton: Skeleton3D, formScore: FormScore3D): Movement3D {
    // Detect movement phase
    const phase = this.detectMovementPhase(skeleton);
    
    // Calculate movement quality
    const quality = this.calculateMovementQuality3D(skeleton);
    
    // Calculate progression
    const progression = this.calculateMovementProgression3D(formScore);
    
    return {
      phase,
      quality,
      progression
    };
  }

  /**
   * Detect movement phase
   */
  private detectMovementPhase(skeleton: Skeleton3D): MovementPhase {
    // Simplified phase detection based on joint angles
    const kneeAngle = (skeleton.jointAngles.leftKnee.angle + skeleton.jointAngles.rightKnee.angle) / 2;
    
    if (kneeAngle > 160) return 'top';
    if (kneeAngle < 90) return 'bottom';
    if (this.lastPose && kneeAngle < this.getLastKneeAngle()) return 'eccentric';
    if (this.lastPose && kneeAngle > this.getLastKneeAngle()) return 'concentric';
    
    return 'setup';
  }

  /**
   * Get last knee angle for comparison
   */
  private getLastKneeAngle(): number {
    if (!this.lastPose) return 180;
    return (this.lastPose.skeleton.jointAngles.leftKnee.angle + this.lastPose.skeleton.jointAngles.rightKnee.angle) / 2;
  }

  /**
   * Calculate movement quality
   */
  private calculateMovementQuality3D(skeleton: Skeleton3D): MovementQuality3D {
    // Smoothness (based on movement history)
    const smoothness = this.calculateSmoothness();
    
    // Control (based on joint stability)
    const control = skeleton.alignment.score;
    
    // Power (based on movement speed - simplified)
    const power = 0.5; // Placeholder
    
    const overall = (smoothness + control + power) / 3;
    
    return {
      smoothness,
      control,
      power,
      overall
    };
  }

  /**
   * Calculate movement smoothness
   */
  private calculateSmoothness(): number {
    if (this.movementHistory.length < 3) return 0.5;
    
    // Calculate variance in movement
    let variance = 0;
    for (let i = 1; i < this.movementHistory.length - 1; i++) {
      const prev = this.movementHistory[i - 1];
      const curr = this.movementHistory[i];
      const next = this.movementHistory[i + 1];
      
      const prevDist = distance3D(prev.biomechanics.centerOfMass, curr.biomechanics.centerOfMass);
      const nextDist = distance3D(curr.biomechanics.centerOfMass, next.biomechanics.centerOfMass);
      
      variance += Math.abs(prevDist - nextDist);
    }
    
    return Math.max(0, 1 - variance / this.movementHistory.length);
  }

  /**
   * Calculate movement progression
   */
  private calculateMovementProgression3D(formScore: FormScore3D): MovementProgression3D {
    // Simplified progression calculation
    const romImprovement = 0; // Would need historical data
    const strengthProgression = 0; // Would need historical data
    const formImprovement = formScore.overall / 100;
    
    const overall = (romImprovement + strengthProgression + formImprovement) / 3;
    
    return {
      romImprovement,
      strengthProgression,
      formImprovement,
      overall
    };
  }

  /**
   * Update movement history
   */
  private updateHistory(pose3D: Pose3D): void {
    this.movementHistory.push(pose3D);
    if (this.movementHistory.length > this.maxHistorySize) {
      this.movementHistory.shift();
    }
  }
}

// ============================================
// Exercise-Specific 3D Analysis
// ============================================

export class ExerciseAnalyzer3D {
  /**
   * Analyze squat form in 3D
   */
  static analyzeSquat(pose3D: Pose3D): SquatForm3D {
    const { skeleton, biomechanics } = pose3D;
    
    // Depth analysis - more sophisticated calculation
    const leftKneeAngle = skeleton.jointAngles.leftKnee.angle;
    const rightKneeAngle = skeleton.jointAngles.rightKnee.angle;
    const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    
    // Ideal squat depth is around 90 degrees knee angle
    const idealDepth = 90;
    const depthDeviation = Math.abs(kneeAngle - idealDepth);
    const depth = Math.max(0, 1 - (depthDeviation / 45)); // 0-1 scale, perfect at 90 degrees
    
    // Knee tracking (knees over toes) - enhanced analysis
    const kneeTracking = this.analyzeKneeTracking(skeleton);
    
    // Torso angle - more precise calculation
    const torsoAngle = this.analyzeTorsoAngle(skeleton);
    
    // Balance - enhanced with stability
    const balance = (biomechanics.balance.score + biomechanics.stability.score) / 2;
    
    // Overall score with weighted components
    const overall = (depth * 0.3 + kneeTracking * 0.3 + torsoAngle * 0.25 + balance * 0.15) * 100;
    
    return {
      depth,
      kneeTracking,
      torsoAngle,
      balance,
      overall
    };
  }

  /**
   * Analyze push-up form in 3D
   */
  static analyzePushup(pose3D: Pose3D): PushupForm3D {
    const { skeleton, biomechanics } = pose3D;
    
    // Depth analysis
    const elbowAngle = (skeleton.jointAngles.leftElbow.angle + skeleton.jointAngles.rightElbow.angle) / 2;
    const depth = Math.max(0, (180 - elbowAngle) / 90);
    
    // Body alignment
    const bodyAlignment = skeleton.alignment.score;
    
    // Elbow tracking
    const elbowTracking = this.analyzeElbowTracking(skeleton);
    
    // Core stability
    const coreStability = biomechanics.stability.coreStability;
    
    const overall = (depth + bodyAlignment + elbowTracking + coreStability) * 25;
    
    return {
      depth,
      bodyAlignment,
      elbowTracking,
      coreStability,
      overall
    };
  }

  /**
   * Analyze plank form in 3D
   */
  static analyzePlank(pose3D: Pose3D): PlankForm3D {
    const { skeleton, biomechanics } = pose3D;
    
    // Body alignment
    const bodyAlignment = skeleton.alignment.spinalAlignment;
    
    // Core stability
    const coreStability = biomechanics.stability.coreStability;
    
    // Shoulder stability
    const shoulderStability = (skeleton.jointAngles.leftShoulder.confidence + skeleton.jointAngles.rightShoulder.confidence) / 2;
    
    // Hip alignment
    const hipAlignment = skeleton.alignment.pelvicAlignment;
    
    const overall = (bodyAlignment + coreStability + shoulderStability + hipAlignment) * 25;
    
    return {
      bodyAlignment,
      coreStability,
      shoulderStability,
      hipAlignment,
      overall
    };
  }

  private static analyzeKneeTracking(skeleton: Skeleton3D): number {
    // Analyze knee tracking by comparing knee position to ankle position
    const leftKnee = skeleton.leftLeg.end;
    const rightKnee = skeleton.rightLeg.end;
    const leftAnkle = skeleton.leftLeg.start;
    const rightAnkle = skeleton.rightLeg.start;
    
    // Calculate knee-to-ankle alignment
    const leftAlignment = Math.abs(leftKnee.x - leftAnkle.x);
    const rightAlignment = Math.abs(rightKnee.x - rightAnkle.x);
    const avgAlignment = (leftAlignment + rightAlignment) / 2;
    
    // Score based on alignment (lower is better)
    return Math.max(0, 1 - avgAlignment * 10);
  }

  private static analyzeTorsoAngle(skeleton: Skeleton3D): number {
    // Analyze torso angle relative to vertical using spine alignment
    const spinalAlignment = skeleton.alignment.spinalAlignment;
    
    // Additional analysis using torso segment
    const torsoAngle = Math.abs(skeleton.torso.direction.y - 1); // 1 is vertical
    const torsoScore = Math.max(0, 1 - torsoAngle * 5);
    
    // Combine spinal alignment and torso angle
    return (spinalAlignment + torsoScore) / 2;
  }

  private static analyzeElbowTracking(skeleton: Skeleton3D): number {
    // Analyze elbow position relative to shoulders and body center
    const leftElbow = skeleton.leftArm.end;
    const rightElbow = skeleton.rightArm.end;
    const leftShoulder = skeleton.leftArm.start;
    const rightShoulder = skeleton.rightArm.start;
    
    // Calculate elbow-to-shoulder alignment
    const leftAlignment = Math.abs(leftElbow.x - leftShoulder.x);
    const rightAlignment = Math.abs(rightElbow.x - rightShoulder.x);
    const avgAlignment = (leftAlignment + rightAlignment) / 2;
    
    // Score based on alignment (lower is better for push-ups)
    return Math.max(0, 1 - avgAlignment * 8);
  }
}


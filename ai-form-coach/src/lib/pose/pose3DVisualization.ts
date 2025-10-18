/**
 * 3D Pose Visualization System
 * 
 * Provides 3D visualization and rendering for pose analysis
 * Similar to professional fitness apps like Sword Health
 * 
 * Features:
 * - 3D skeleton rendering
 * - Real-time form overlay
 * - Movement tracking visualization
 * - Progress visualization
 */

import type { Pose3D } from './pose3D';
import type { PoseFeedback3D, Correction3D, VisualCue3D } from './pose3DFeedback';
import type { Landmark3D } from './engine';

// ============================================
// Visualization Types
// ============================================

export interface Pose3DVisualization {
  // 3D skeleton
  skeleton: SkeletonVisualization3D;
  
  // Form overlays
  overlays: FormOverlay3D[];
  
  // Movement tracking
  movement: MovementVisualization3D;
  
  // Progress visualization
  progress: ProgressVisualization3D;
  
  // Real-time feedback
  feedback: FeedbackVisualization3D;
}

export interface SkeletonVisualization3D {
  // Bone segments
  bones: Bone3D[];
  
  // Joint points
  joints: Joint3D[];
  
  // Body segments
  segments: BodySegmentVisualization3D[];
  
  // Rendering options
  options: SkeletonRenderOptions;
}

export interface Bone3D {
  id: string;
  start: Point3D;
  end: Point3D;
  color: string;
  thickness: number;
  opacity: number;
  visible: boolean;
}

export interface Joint3D {
  id: string;
  position: Point3D;
  color: string;
  size: number;
  opacity: number;
  visible: boolean;
  confidence: number;
}

export interface BodySegmentVisualization3D {
  id: string;
  landmarks: number[];
  color: string;
  opacity: number;
  visible: boolean;
}

export interface SkeletonRenderOptions {
  showBones: boolean;
  showJoints: boolean;
  showSegments: boolean;
  boneColor: string;
  jointColor: string;
  lowConfidenceColor: string;
  confidenceThreshold: number;
}

export interface FormOverlay3D {
  id: string;
  type: 'alignment' | 'angle' | 'range' | 'balance';
  elements: OverlayElement3D[];
  visible: boolean;
  opacity: number;
}

export interface OverlayElement3D {
  id: string;
  type: 'line' | 'arc' | 'plane' | 'vector' | 'text';
  geometry: Geometry3D;
  style: ElementStyle3D;
  data: Record<string, unknown>;
}

export interface Geometry3D {
  points: Point3D[];
  color: string;
  thickness?: number;
  radius?: number;
  opacity: number;
}

export interface ElementStyle3D {
  color: string;
  thickness: number;
  opacity: number;
  animation?: Animation3D;
}

export interface Animation3D {
  type: 'pulse' | 'fade' | 'rotate' | 'scale';
  duration: number;
  loop: boolean;
  intensity: number;
}

export interface MovementVisualization3D {
  // Movement path
  path: MovementPath3D;
  
  // Phase indicators
  phases: PhaseIndicator3D[];
  
  // Velocity vectors
  velocity: VelocityVector3D[];
  
  // Acceleration indicators
  acceleration: AccelerationIndicator3D[];
}

export interface MovementPath3D {
  points: Point3D[];
  color: string;
  thickness: number;
  opacity: number;
  fadeOut: boolean;
  maxPoints: number;
}

export interface PhaseIndicator3D {
  phase: string;
  position: Point3D;
  color: string;
  size: number;
  opacity: number;
  visible: boolean;
}

export interface VelocityVector3D {
  position: Point3D;
  direction: Point3D;
  magnitude: number;
  color: string;
  thickness: number;
  opacity: number;
}

export interface AccelerationIndicator3D {
  position: Point3D;
  magnitude: number;
  color: string;
  size: number;
  opacity: number;
}

export interface ProgressVisualization3D {
  // Form score history
  scoreHistory: ScoreHistory3D;
  
  // Improvement indicators
  improvements: ImprovementIndicator3D[];
  
  // Goal progress
  goals: GoalProgress3D[];
}

export interface ScoreHistory3D {
  points: Point3D[];
  color: string;
  thickness: number;
  opacity: number;
  showTrend: boolean;
}

export interface ImprovementIndicator3D {
  metric: string;
  improvement: number;
  position: Point3D;
  color: string;
  size: number;
  opacity: number;
}

export interface GoalProgress3D {
  goal: string;
  progress: number;
  position: Point3D;
  color: string;
  size: number;
  opacity: number;
}

export interface FeedbackVisualization3D {
  // Active corrections
  corrections: CorrectionVisualization3D[];
  
  // Positive feedback
  positives: PositiveFeedback3D[];
  
  // Exercise cues
  cues: ExerciseCue3D[];
}

export interface CorrectionVisualization3D {
  correction: Correction3D;
  visualCue: VisualCue3D;
  position: Point3D;
  visible: boolean;
  opacity: number;
}

export interface PositiveFeedback3D {
  message: string;
  position: Point3D;
  color: string;
  size: number;
  opacity: number;
  animation: Animation3D;
}

export interface ExerciseCue3D {
  cue: string;
  position: Point3D;
  color: string;
  size: number;
  opacity: number;
  timing: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// ============================================
// 3D Visualization Engine
// ============================================

export class Pose3DVisualizationEngine {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private camera: Camera3D;
  private renderOptions: RenderOptions3D;
  private animationFrame: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.camera = new Camera3D();
    this.renderOptions = {
      showSkeleton: true,
      showOverlays: true,
      showMovement: true,
      showProgress: false,
      showFeedback: true,
      backgroundColor: '#000000',
      skeletonColor: '#00ff00',
      overlayColor: '#ff0000',
      feedbackColor: '#ffff00'
    };
  }

  /**
   * Render 3D pose visualization
   */
  render(pose3D: Pose3D, feedback: PoseFeedback3D): void {
    if (!this.context || !this.canvas) return;

    // Clear canvas
    this.context.fillStyle = this.renderOptions.backgroundColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Create visualization
    const visualization = this.createVisualization(pose3D, feedback);

    // Render skeleton
    if (this.renderOptions.showSkeleton) {
      this.renderSkeleton(visualization.skeleton);
    }

    // Render overlays
    if (this.renderOptions.showOverlays) {
      this.renderOverlays(visualization.overlays);
    }

    // Render movement
    if (this.renderOptions.showMovement) {
      this.renderMovement(visualization.movement);
    }

    // Render progress
    if (this.renderOptions.showProgress) {
      this.renderProgress(visualization.progress);
    }

    // Render feedback
    if (this.renderOptions.showFeedback) {
      this.renderFeedback(visualization.feedback);
    }
  }

  /**
   * Create complete 3D visualization
   */
  private createVisualization(pose3D: Pose3D, feedback: PoseFeedback3D): Pose3DVisualization {
    return {
      skeleton: this.createSkeletonVisualization(pose3D),
      overlays: this.createFormOverlays(pose3D),
      movement: this.createMovementVisualization(pose3D),
      progress: this.createProgressVisualization(pose3D),
      feedback: this.createFeedbackVisualization(feedback)
    };
  }

  /**
   * Create skeleton visualization
   */
  private createSkeletonVisualization(pose3D: Pose3D): SkeletonVisualization3D {
    const { landmarks } = pose3D;
    
    // Create bones
    const bones: Bone3D[] = [
      // Head and neck
      this.createBone('head-neck', landmarks[0], landmarks[1], '#ff0000'),
      
      // Torso
      this.createBone('shoulder-hip-left', landmarks[11], landmarks[23], '#00ff00'),
      this.createBone('shoulder-hip-right', landmarks[12], landmarks[24], '#00ff00'),
      
      // Arms
      this.createBone('left-arm-upper', landmarks[11], landmarks[13], '#0000ff'),
      this.createBone('left-arm-lower', landmarks[13], landmarks[15], '#0000ff'),
      this.createBone('right-arm-upper', landmarks[12], landmarks[14], '#0000ff'),
      this.createBone('right-arm-lower', landmarks[14], landmarks[16], '#0000ff'),
      
      // Legs
      this.createBone('left-leg-upper', landmarks[23], landmarks[25], '#ffff00'),
      this.createBone('left-leg-lower', landmarks[25], landmarks[27], '#ffff00'),
      this.createBone('right-leg-upper', landmarks[24], landmarks[26], '#ffff00'),
      this.createBone('right-leg-lower', landmarks[26], landmarks[28], '#ffff00')
    ];

    // Create joints
    const joints: Joint3D[] = landmarks.map((lm, index) => ({
      id: `joint-${index}`,
      position: { x: lm.x, y: lm.y, z: lm.z },
      color: lm.visibility > 0.7 ? '#ffffff' : '#ff0000',
      size: 3,
      opacity: lm.visibility,
      visible: true,
      confidence: lm.visibility
    }));

    // Create body segments
    const segments: BodySegmentVisualization3D[] = [
      {
        id: 'head',
        landmarks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        color: '#ff0000',
        opacity: 0.3,
        visible: true
      },
      {
        id: 'torso',
        landmarks: [11, 12, 23, 24],
        color: '#00ff00',
        opacity: 0.3,
        visible: true
      },
      {
        id: 'arms',
        landmarks: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
        color: '#0000ff',
        opacity: 0.3,
        visible: true
      },
      {
        id: 'legs',
        landmarks: [23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
        color: '#ffff00',
        opacity: 0.3,
        visible: true
      }
    ];

    return {
      bones,
      joints,
      segments,
      options: {
        showBones: true,
        showJoints: true,
        showSegments: false,
        boneColor: '#00ff00',
        jointColor: '#ffffff',
        lowConfidenceColor: '#ff0000',
        confidenceThreshold: 0.7
      }
    };
  }

  /**
   * Create bone visualization
   */
  private createBone(id: string, start: Landmark3D, end: Landmark3D, color: string): Bone3D {
    return {
      id,
      start: { x: start.x, y: start.y, z: start.z },
      end: { x: end.x, y: end.y, z: end.z },
      color,
      thickness: 2,
      opacity: Math.min(start.visibility, end.visibility),
      visible: true
    };
  }

  /**
   * Create form overlays
   */
  private createFormOverlays(pose3D: Pose3D): FormOverlay3D[] {
    const overlays: FormOverlay3D[] = [];
    const { skeleton } = pose3D;

    // Alignment overlay
    if (skeleton.alignment.score < 0.8) {
      overlays.push({
        id: 'alignment',
        type: 'alignment',
        elements: [{
          id: 'spine-line',
          type: 'line',
          geometry: {
            points: [
              { x: skeleton.torso.start.x, y: skeleton.torso.start.y, z: skeleton.torso.start.z },
              { x: skeleton.torso.end.x, y: skeleton.torso.end.y, z: skeleton.torso.end.z }
            ],
            color: '#ff0000',
            thickness: 3,
            opacity: 0.8
          },
          style: {
            color: '#ff0000',
            thickness: 3,
            opacity: 0.8,
            animation: {
              type: 'pulse',
              duration: 1000,
              loop: true,
              intensity: 0.5
            }
          },
          data: { message: 'Straighten spine' }
        }],
        visible: true,
        opacity: 0.8
      });
    }

    // Angle overlays
    Object.entries(skeleton.jointAngles).forEach(([joint, angle]) => {
      if (angle.confidence > 0.7) {
        overlays.push({
          id: `angle-${joint}`,
          type: 'angle',
          elements: [{
            id: `angle-arc-${joint}`,
            type: 'arc',
            geometry: {
              points: [], // Will be calculated based on joint position
              color: this.getAngleColor(angle.angle),
              radius: 0.1,
              opacity: 0.6
            },
            style: {
              color: this.getAngleColor(angle.angle),
              thickness: 2,
              opacity: 0.6
            },
            data: { angle: angle.angle, joint }
          }],
          visible: true,
          opacity: 0.6
        });
      }
    });

    return overlays;
  }

  /**
   * Create movement visualization
   */
  private createMovementVisualization(pose3D: Pose3D): MovementVisualization3D {
    return {
      path: {
        points: [], // Will be populated over time
        color: '#00ffff',
        thickness: 2,
        opacity: 0.7,
        fadeOut: true,
        maxPoints: 100
      },
      phases: [{
        phase: pose3D.movement.phase,
        position: { x: 0, y: 0, z: 0 },
        color: this.getPhaseColor(pose3D.movement.phase),
        size: 5,
        opacity: 0.8,
        visible: true
      }],
      velocity: [],
      acceleration: []
    };
  }

  /**
   * Create progress visualization
   */
  private createProgressVisualization(pose3D: Pose3D): ProgressVisualization3D {
    // Create progress points based on current pose score
    const currentScore = pose3D.formScore.overall;
    const progressPoints = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: currentScore / 100, z: 0 },
      { x: 2, y: Math.min(currentScore / 100 + 0.1, 1), z: 0 }
    ];

    return {
      scoreHistory: {
        points: progressPoints,
        color: '#00ff00',
        thickness: 2,
        opacity: 0.8,
        showTrend: true
      },
      improvements: currentScore > 80 ? [{
        metric: 'form',
        improvement: (currentScore - 80) / 20,
        position: { x: 0, y: 0, z: 0 },
        color: '#44ff44',
        size: 1,
        opacity: 0.9
      }] : [],
      goals: [{
        goal: 'Perfect Form',
        progress: currentScore / 100,
        position: { x: 0, y: 1, z: 0 },
        color: '#ffff00',
        size: 1,
        opacity: 0.7
      }]
    };
  }

  /**
   * Create feedback visualization
   */
  private createFeedbackVisualization(feedback: PoseFeedback3D): FeedbackVisualization3D {
    const corrections: CorrectionVisualization3D[] = feedback.corrections.map(correction => ({
      correction,
      visualCue: correction.visualCue,
      position: { x: correction.visualCue.position.x, y: correction.visualCue.position.y, z: correction.visualCue.position.z },
      visible: true,
      opacity: 0.8
    }));

    const positives: PositiveFeedback3D[] = feedback.positives.map(positive => ({
      message: positive.message,
      position: { x: 0, y: 0, z: 0 },
      color: '#00ff00',
      size: 4,
      opacity: 0.8,
      animation: {
        type: 'fade',
        duration: 2000,
        loop: false,
        intensity: 0.5
      }
    }));

    const cues: ExerciseCue3D[] = feedback.exercise.cues.map(cue => ({
      cue: cue.message,
      position: { x: 0, y: 0, z: 0 },
      color: '#ffff00',
      size: 3,
      opacity: 0.9,
      timing: 3000
    }));

    return {
      corrections,
      positives,
      cues
    };
  }

  /**
   * Render skeleton
   */
  private renderSkeleton(skeleton: SkeletonVisualization3D): void {
    if (!this.context) return;

    // Render bones
    if (skeleton.options.showBones) {
      skeleton.bones.forEach(bone => {
        if (bone.visible && bone.opacity > 0.1) {
          this.renderBone(bone);
        }
      });
    }

    // Render joints
    if (skeleton.options.showJoints) {
      skeleton.joints.forEach(joint => {
        if (joint.visible && joint.opacity > 0.1) {
          this.renderJoint(joint);
        }
      });
    }
  }

  /**
   * Render bone
   */
  private renderBone(bone: Bone3D): void {
    if (!this.context) return;

    const start2D = this.project3DTo2D(bone.start);
    const end2D = this.project3DTo2D(bone.end);

    this.context.strokeStyle = bone.color;
    this.context.lineWidth = bone.thickness;
    this.context.globalAlpha = bone.opacity;
    this.context.beginPath();
    this.context.moveTo(start2D.x, start2D.y);
    this.context.lineTo(end2D.x, end2D.y);
    this.context.stroke();
    this.context.globalAlpha = 1;
  }

  /**
   * Render joint
   */
  private renderJoint(joint: Joint3D): void {
    if (!this.context) return;

    const position2D = this.project3DTo2D(joint.position);

    this.context.fillStyle = joint.color;
    this.context.globalAlpha = joint.opacity;
    this.context.beginPath();
    this.context.arc(position2D.x, position2D.y, joint.size, 0, 2 * Math.PI);
    this.context.fill();
    this.context.globalAlpha = 1;
  }

  /**
   * Render overlays
   */
  private renderOverlays(overlays: FormOverlay3D[]): void {
    overlays.forEach(overlay => {
      if (overlay.visible) {
        overlay.elements.forEach(element => {
          this.renderOverlayElement(element);
        });
      }
    });
  }

  /**
   * Render overlay element
   */
  private renderOverlayElement(element: OverlayElement3D): void {
    if (!this.context) return;

    switch (element.type) {
      case 'line':
        this.renderLine(element);
        break;
      case 'arc':
        this.renderArc(element);
        break;
      case 'text':
        this.renderText(element);
        break;
    }
  }

  /**
   * Render line overlay
   */
  private renderLine(element: OverlayElement3D): void {
    if (!this.context || element.geometry.points.length < 2) return;

    const start2D = this.project3DTo2D(element.geometry.points[0]);
    const end2D = this.project3DTo2D(element.geometry.points[1]);

    this.context.strokeStyle = element.style.color;
    this.context.lineWidth = element.style.thickness;
    this.context.globalAlpha = element.style.opacity;
    this.context.beginPath();
    this.context.moveTo(start2D.x, start2D.y);
    this.context.lineTo(end2D.x, end2D.y);
    this.context.stroke();
    this.context.globalAlpha = 1;
  }

  /**
   * Render arc overlay
   */
  private renderArc(element: OverlayElement3D): void {
    if (!this.context) return;

    // Simplified arc rendering
    const center2D = this.project3DTo2D(element.geometry.points[0] || { x: 0, y: 0, z: 0 });

    this.context.strokeStyle = element.style.color;
    this.context.lineWidth = element.style.thickness;
    this.context.globalAlpha = element.style.opacity;
    this.context.beginPath();
    this.context.arc(center2D.x, center2D.y, element.geometry.radius || 10, 0, 2 * Math.PI);
    this.context.stroke();
    this.context.globalAlpha = 1;
  }

  /**
   * Render text overlay
   */
  private renderText(element: OverlayElement3D): void {
    if (!this.context) return;

    const position2D = this.project3DTo2D(element.geometry.points[0] || { x: 0, y: 0, z: 0 });

    this.context.fillStyle = element.style.color;
    this.context.font = '16px Arial';
    this.context.globalAlpha = element.style.opacity;
    this.context.fillText((element.data.message as string) || '', position2D.x, position2D.y);
    this.context.globalAlpha = 1;
  }

  /**
   * Render movement
   */
  private renderMovement(movement: MovementVisualization3D): void {
    // Render movement path
    this.renderMovementPath(movement.path);
    
    // Render phase indicators
    movement.phases.forEach(phase => {
      if (phase.visible) {
        this.renderPhaseIndicator(phase);
      }
    });
  }

  /**
   * Render movement path
   */
  private renderMovementPath(path: MovementPath3D): void {
    if (!this.context || path.points.length < 2) return;

    this.context.strokeStyle = path.color;
    this.context.lineWidth = path.thickness;
    this.context.globalAlpha = path.opacity;
    this.context.beginPath();

    path.points.forEach((point, index) => {
      if (!this.context) return;
      const point2D = this.project3DTo2D(point);
      if (index === 0) {
        this.context.moveTo(point2D.x, point2D.y);
      } else {
        this.context.lineTo(point2D.x, point2D.y);
      }
    });

    if (this.context) {
      this.context.stroke();
      this.context.globalAlpha = 1;
    }
  }

  /**
   * Render phase indicator
   */
  private renderPhaseIndicator(phase: PhaseIndicator3D): void {
    if (!this.context) return;

    const position2D = this.project3DTo2D(phase.position);

    this.context.fillStyle = phase.color;
    this.context.globalAlpha = phase.opacity;
    this.context.beginPath();
    this.context.arc(position2D.x, position2D.y, phase.size, 0, 2 * Math.PI);
    this.context.fill();
    this.context.globalAlpha = 1;
  }

  /**
   * Render progress
   */
  private renderProgress(progress: ProgressVisualization3D): void {
    // Render score history
    this.renderScoreHistory(progress.scoreHistory);
    
    // Render improvements
    progress.improvements.forEach(improvement => {
      this.renderImprovementIndicator(improvement);
    });
  }

  /**
   * Render score history
   */
  private renderScoreHistory(history: ScoreHistory3D): void {
    if (!this.context || history.points.length < 2) return;

    this.context.strokeStyle = history.color;
    this.context.lineWidth = history.thickness;
    this.context.globalAlpha = history.opacity;
    this.context.beginPath();

    history.points.forEach((point, index) => {
      if (!this.context) return;
      const point2D = this.project3DTo2D(point);
      if (index === 0) {
        this.context.moveTo(point2D.x, point2D.y);
      } else {
        this.context.lineTo(point2D.x, point2D.y);
      }
    });

    if (this.context) {
      this.context.stroke();
      this.context.globalAlpha = 1;
    }
  }

  /**
   * Render improvement indicator
   */
  private renderImprovementIndicator(improvement: ImprovementIndicator3D): void {
    if (!this.context) return;

    const position2D = this.project3DTo2D(improvement.position);

    this.context.fillStyle = improvement.color;
    this.context.globalAlpha = improvement.opacity;
    this.context.beginPath();
    this.context.arc(position2D.x, position2D.y, improvement.size, 0, 2 * Math.PI);
    this.context.fill();
    this.context.globalAlpha = 1;
  }

  /**
   * Render feedback
   */
  private renderFeedback(feedback: FeedbackVisualization3D): void {
    // Render corrections
    feedback.corrections.forEach(correction => {
      if (correction.visible) {
        this.renderCorrection(correction);
      }
    });

    // Render positives
    feedback.positives.forEach(positive => {
      this.renderPositiveFeedback(positive);
    });

    // Render cues
    feedback.cues.forEach(cue => {
      this.renderExerciseCue(cue);
    });
  }

  /**
   * Render correction
   */
  private renderCorrection(correction: CorrectionVisualization3D): void {
    if (!this.context) return;

    const position2D = this.project3DTo2D(correction.position);

    // Render correction indicator
    this.context.strokeStyle = correction.visualCue.color;
    this.context.lineWidth = correction.visualCue.size;
    this.context.globalAlpha = correction.opacity;
    this.context.beginPath();
    this.context.arc(position2D.x, position2D.y, correction.visualCue.size, 0, 2 * Math.PI);
    this.context.stroke();
    this.context.globalAlpha = 1;
  }

  /**
   * Render positive feedback
   */
  private renderPositiveFeedback(positive: PositiveFeedback3D): void {
    if (!this.context) return;

    const position2D = this.project3DTo2D(positive.position);

    this.context.fillStyle = positive.color;
    this.context.font = '14px Arial';
    this.context.globalAlpha = positive.opacity;
    this.context.fillText(positive.message, position2D.x, position2D.y);
    this.context.globalAlpha = 1;
  }

  /**
   * Render exercise cue
   */
  private renderExerciseCue(cue: ExerciseCue3D): void {
    if (!this.context) return;

    const position2D = this.project3DTo2D(cue.position);

    this.context.fillStyle = cue.color;
    this.context.font = '16px Arial';
    this.context.globalAlpha = cue.opacity;
    this.context.fillText(cue.cue, position2D.x, position2D.y);
    this.context.globalAlpha = 1;
  }

  /**
   * Project 3D point to 2D screen coordinates using camera
   */
  private project3DTo2D(point: Point3D): { x: number; y: number } {
    // Use camera for proper 3D projection
    const canvasWidth = this.canvas?.width || 400;
    const canvasHeight = this.canvas?.height || 300;
    
    // Transform point relative to camera
    const relativePoint = {
      x: point.x - this.camera.position.x,
      y: point.y - this.camera.position.y,
      z: point.z - this.camera.position.z
    };
    
    // Simple perspective projection
    const scale = 200;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Apply perspective (z-distance affects scale)
    const perspective = 1 / (1 + relativePoint.z * 0.1);
    
    return {
      x: centerX + relativePoint.x * scale * perspective,
      y: centerY - relativePoint.y * scale * perspective
    };
  }

  /**
   * Get angle color based on value
   */
  private getAngleColor(angle: number): string {
    if (angle < 90) return '#ff0000'; // Red for acute
    if (angle < 120) return '#ffff00'; // Yellow for moderate
    if (angle < 150) return '#00ff00'; // Green for good
    return '#00ffff'; // Cyan for excellent
  }

  /**
   * Get phase color
   */
  private getPhaseColor(phase: string): string {
    const colors: Record<string, string> = {
      'setup': '#ffffff',
      'eccentric': '#ff0000',
      'bottom': '#ff8800',
      'concentric': '#00ff00',
      'top': '#0088ff',
      'rest': '#888888'
    };
    return colors[phase] || '#ffffff';
  }

  /**
   * Update render options
   */
  updateRenderOptions(options: Partial<RenderOptions3D>): void {
    this.renderOptions = { ...this.renderOptions, ...options };
  }

  /**
   * Update camera position
   */
  updateCamera(position: Point3D, target?: Point3D): void {
    this.camera.updatePosition(position);
    if (target) {
      this.camera.updateTarget(target);
    }
  }

  /**
   * Set camera to look at specific point
   */
  lookAt(position: Point3D, target: Point3D, up?: Point3D): void {
    this.camera.lookAt(position, target, up);
  }

  /**
   * Get current camera
   */
  getCamera(): Camera3D {
    return this.camera;
  }

  /**
   * Start animation loop
   */
  startAnimation(): void {
    const animate = () => {
      // Animation logic here
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Stop animation loop
   */
  stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stopAnimation();
    this.canvas = null;
    this.context = null;
  }
}

// ============================================
// Camera and Rendering
// ============================================

export interface RenderOptions3D {
  showSkeleton: boolean;
  showOverlays: boolean;
  showMovement: boolean;
  showProgress: boolean;
  showFeedback: boolean;
  backgroundColor: string;
  skeletonColor: string;
  overlayColor: string;
  feedbackColor: string;
}

export class Camera3D {
  position: Point3D = { x: 0, y: 0, z: 5 };
  target: Point3D = { x: 0, y: 0, z: 0 };
  up: Point3D = { x: 0, y: 1, z: 0 };
  fov: number = 45;
  near: number = 0.1;
  far: number = 1000;

  /**
   * Update camera position
   */
  updatePosition(position: Point3D): void {
    this.position = position;
  }

  /**
   * Update camera target
   */
  updateTarget(target: Point3D): void {
    this.target = target;
  }

  /**
   * Look at specific point
   */
  lookAt(position: Point3D, target: Point3D, up: Point3D = { x: 0, y: 1, z: 0 }): void {
    this.position = position;
    this.target = target;
    this.up = up;
  }
}

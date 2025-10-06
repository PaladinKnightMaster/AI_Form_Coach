/**
 * 3D Pose Feedback System
 * 
 * Provides real-time 3D feedback and coaching similar to Sword Health AI
 * 
 * Features:
 * - Real-time 3D form corrections
 * - Exercise-specific coaching cues
 * - Movement quality feedback
 * - Progress tracking and insights
 */

import type { Pose3D, MovementPhase } from './pose3D';

// ============================================
// Feedback Types
// ============================================

export interface PoseFeedback3D {
  // Overall feedback
  overall: FeedbackMessage;
  
  // Specific corrections
  corrections: Correction3D[];
  
  // Positive reinforcement
  positives: FeedbackMessage[];
  
  // Exercise-specific feedback
  exercise: ExerciseFeedback3D;
  
  // Movement phase guidance
  phase: PhaseFeedback3D;
  
  // Progress insights
  progress: ProgressFeedback3D;
}

export interface FeedbackMessage {
  id: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'form' | 'safety' | 'performance' | 'motivation';
  timestamp: number;
}

export interface Correction3D {
  id: string;
  joint: string;
  issue: string;
  correction: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  visualCue: VisualCue3D;
  audioCue?: AudioCue3D;
}

export interface VisualCue3D {
  type: 'highlight' | 'arrow' | 'line' | 'circle' | 'text';
  position: { x: number; y: number; z: number };
  color: string;
  size: number;
  duration: number;
  message?: string;
}

export interface AudioCue3D {
  type: 'voice' | 'beep' | 'chime';
  message: string;
  volume: number;
  priority: 'low' | 'medium' | 'high';
}

export interface ExerciseFeedback3D {
  exercise: string;
  phase: MovementPhase;
  cues: FeedbackMessage[];
  nextPhase?: string;
  completion?: number; // 0-1
}

export interface PhaseFeedback3D {
  current: MovementPhase;
  next: MovementPhase;
  transition: string;
  timing: number; // seconds
}

export interface ProgressFeedback3D {
  improvement: string[];
  achievements: string[];
  recommendations: string[];
  nextGoals: string[];
}

// ============================================
// 3D Feedback Engine
// ============================================

export class Pose3DFeedbackEngine {
  private feedbackHistory: PoseFeedback3D[] = [];
  private lastFeedback: PoseFeedback3D | null = null;
  private exerciseType: string = 'unknown';
  private sessionStart: number = Date.now();

  /**
   * Generate comprehensive 3D feedback
   */
  generateFeedback(pose3D: Pose3D, exerciseType: string = 'unknown'): PoseFeedback3D {
    this.exerciseType = exerciseType;
    
    // Generate overall feedback
    const overall = this.generateOverallFeedback(pose3D);
    
    // Generate specific corrections
    const corrections = this.generateCorrections(pose3D);
    
    // Generate positive reinforcement
    const positives = this.generatePositives(pose3D);
    
    // Generate exercise-specific feedback
    const exercise = this.generateExerciseFeedback(pose3D, exerciseType);
    
    // Generate phase guidance
    const phase = this.generatePhaseFeedback(pose3D);
    
    // Generate progress insights
    const progress = this.generateProgressFeedback(pose3D);
    
    const feedback: PoseFeedback3D = {
      overall,
      corrections,
      positives,
      exercise,
      phase,
      progress
    };
    
    // Update history
    this.updateFeedbackHistory(feedback);
    this.lastFeedback = feedback;
    
    return feedback;
  }

  /**
   * Generate overall feedback message
   */
  private generateOverallFeedback(pose3D: Pose3D): FeedbackMessage {
    const score = pose3D.formScore.overall;
    const phase = pose3D.movement.phase;
    
    let message: string;
    let priority: 'low' | 'medium' | 'high' | 'critical';
    
    // Phase-specific feedback messages
    const phaseMessages = {
      setup: "Get ready and find your starting position.",
      eccentric: "Control the lowering phase - slow and steady.",
      bottom: "Great depth! Now drive up with power.",
      concentric: "Explosive upward movement - drive through your heels.",
      top: "Excellent! Hold this position briefly.",
      rest: "Take a moment to reset and prepare for the next rep."
    };

    if (score >= 90) {
      message = `Excellent form! ${phaseMessages[phase] || "You're performing this exercise with near-perfect technique."}`;
      priority = 'low';
    } else if (score >= 75) {
      message = `Good form overall. ${phaseMessages[phase] || "A few minor adjustments will make this even better."}`;
      priority = 'medium';
    } else if (score >= 60) {
      message = `Decent form, but there are some areas we can improve. ${phaseMessages[phase] || "Focus on the key corrections."}`;
      priority = 'medium';
    } else if (score >= 40) {
      message = `Your form needs attention. ${phaseMessages[phase] || "Let's focus on the key corrections."}`;
      priority = 'high';
    } else {
      message = `Form needs significant improvement. ${phaseMessages[phase] || "Please focus on safety and technique."}`;
      priority = 'critical';
    }
    
    return {
      id: `overall-${Date.now()}`,
      message,
      priority,
      category: 'form',
      timestamp: Date.now()
    };
  }

  /**
   * Generate specific corrections
   */
  private generateCorrections(pose3D: Pose3D): Correction3D[] {
    const corrections: Correction3D[] = [];
    const { skeleton, biomechanics } = pose3D;
    
    // Check spinal alignment
    if (skeleton.alignment.spinalAlignment < 0.7) {
      corrections.push({
        id: 'spine-alignment',
        joint: 'spine',
        issue: 'Spinal alignment is off',
        correction: 'Keep your spine straight and neutral',
        severity: 'major',
        visualCue: {
          type: 'line',
          position: skeleton.torso.center,
          color: '#ff4444',
          size: 2,
          duration: 3000,
          message: 'Straighten spine'
        },
        audioCue: {
          type: 'voice',
          message: 'Keep your spine straight',
          volume: 0.8,
          priority: 'high'
        }
      });
    }
    
    // Check knee tracking
    const kneeAngle = (skeleton.jointAngles.leftKnee.angle + skeleton.jointAngles.rightKnee.angle) / 2;
    if (kneeAngle < 90 && this.exerciseType === 'squat') {
      corrections.push({
        id: 'knee-tracking',
        joint: 'knees',
        issue: 'Knees caving in',
        correction: 'Push your knees out over your toes',
        severity: 'moderate',
        visualCue: {
          type: 'arrow',
          position: skeleton.leftLeg.center,
          color: '#44ff44',
          size: 1.5,
          duration: 2000,
          message: 'Knees out'
        }
      });
    }
    
    // Check balance
    if (biomechanics.balance.score < 0.6) {
      corrections.push({
        id: 'balance',
        joint: 'core',
        issue: 'Balance is unstable',
        correction: 'Engage your core and find your center',
        severity: 'moderate',
        visualCue: {
          type: 'circle',
          position: biomechanics.centerOfMass,
          color: '#ffff44',
          size: 1,
          duration: 2500,
          message: 'Balance'
        }
      });
    }
    
    // Check shoulder stability
    const shoulderStability = (skeleton.jointAngles.leftShoulder.confidence + skeleton.jointAngles.rightShoulder.confidence) / 2;
    if (shoulderStability < 0.5 && this.exerciseType === 'pushup') {
      corrections.push({
        id: 'shoulder-stability',
        joint: 'shoulders',
        issue: 'Shoulders are unstable',
        correction: 'Keep your shoulders stable and engaged',
        severity: 'moderate',
        visualCue: {
          type: 'highlight',
          position: skeleton.leftArm.center,
          color: '#ff8844',
          size: 1.2,
          duration: 2000,
          message: 'Stable shoulders'
        }
      });
    }
    
    return corrections;
  }

  /**
   * Generate positive reinforcement
   */
  private generatePositives(pose3D: Pose3D): FeedbackMessage[] {
    const positives: FeedbackMessage[] = [];
    const { skeleton, biomechanics } = pose3D;
    
    // Praise good alignment
    if (skeleton.alignment.score > 0.8) {
      positives.push({
        id: 'good-alignment',
        message: "Great body alignment! You're maintaining excellent posture.",
        priority: 'low',
        category: 'motivation',
        timestamp: Date.now()
      });
    }
    
    // Praise stability
    if (biomechanics.stability.score > 0.8) {
      positives.push({
        id: 'good-stability',
        message: "Excellent stability! Your core is engaged and strong.",
        priority: 'low',
        category: 'performance',
        timestamp: Date.now()
      });
    }
    
    // Praise balance
    if (biomechanics.balance.score > 0.8) {
      positives.push({
        id: 'good-balance',
        message: "Perfect balance! You're maintaining great control.",
        priority: 'low',
        category: 'performance',
        timestamp: Date.now()
      });
    }
    
    // Praise range of motion
    const rom = pose3D.formScore.breakdown.rangeOfMotion;
    if (rom > 0.8) {
      positives.push({
        id: 'good-rom',
        message: "Excellent range of motion! You're getting full movement.",
        priority: 'low',
        category: 'performance',
        timestamp: Date.now()
      });
    }
    
    return positives;
  }

  /**
   * Generate exercise-specific feedback
   */
  private generateExerciseFeedback(pose3D: Pose3D, exerciseType: string): ExerciseFeedback3D {
    const phase = pose3D.movement.phase;
    const cues: FeedbackMessage[] = [];
    
    switch (exerciseType.toLowerCase()) {
      case 'squat':
        return this.generateSquatFeedback(pose3D, phase, cues);
      case 'pushup':
        return this.generatePushupFeedback(pose3D, phase, cues);
      case 'plank':
        return this.generatePlankFeedback(pose3D, phase, cues);
      case 'deadlift':
        return this.generateDeadliftFeedback(pose3D, phase, cues);
      case 'lunge':
        return this.generateLungeFeedback(pose3D, phase, cues);
      default:
        return {
          exercise: exerciseType,
          phase,
          cues: [{
            id: 'generic-cue',
            message: "Focus on maintaining good form throughout the movement.",
            priority: 'medium',
            category: 'form',
            timestamp: Date.now()
          }]
        };
    }
  }

  /**
   * Generate squat-specific feedback
   */
  private generateSquatFeedback(pose3D: Pose3D, phase: MovementPhase, cues: FeedbackMessage[]): ExerciseFeedback3D {
    const { skeleton } = pose3D;
    const kneeAngle = (skeleton.jointAngles.leftKnee.angle + skeleton.jointAngles.rightKnee.angle) / 2;
    
    switch (phase) {
      case 'setup':
        cues.push({
          id: 'squat-setup',
          message: "Stand tall with feet shoulder-width apart. Engage your core.",
          priority: 'medium',
          category: 'form',
          timestamp: Date.now()
        });
        break;
        
      case 'eccentric':
        if (kneeAngle > 120) {
          cues.push({
            id: 'squat-slow-down',
            message: "Slow down the descent. Control the movement.",
            priority: 'medium',
            category: 'form',
            timestamp: Date.now()
          });
        }
        break;
        
      case 'bottom':
        cues.push({
          id: 'squat-bottom',
          message: "Great depth! Now drive through your heels to stand up.",
          priority: 'medium',
          category: 'form',
          timestamp: Date.now()
        });
        break;
        
      case 'concentric':
        cues.push({
          id: 'squat-up',
          message: "Drive through your heels and squeeze your glutes at the top.",
          priority: 'medium',
          category: 'form',
          timestamp: Date.now()
        });
        break;
        
      case 'top':
        cues.push({
          id: 'squat-top',
          message: "Excellent! Reset and prepare for the next rep.",
          priority: 'low',
          category: 'motivation',
          timestamp: Date.now()
        });
        break;
    }
    
    return {
      exercise: 'squat',
      phase,
      cues,
      nextPhase: this.getNextPhase(phase),
      completion: this.calculateSquatCompletion(kneeAngle, phase)
    };
  }

  /**
   * Generate push-up specific feedback
   */
  private generatePushupFeedback(pose3D: Pose3D, phase: MovementPhase, cues: FeedbackMessage[]): ExerciseFeedback3D {
    const { skeleton } = pose3D;
    const elbowAngle = (skeleton.jointAngles.leftElbow.angle + skeleton.jointAngles.rightElbow.angle) / 2;
    
    switch (phase) {
      case 'setup':
        cues.push({
          id: 'pushup-setup',
          message: "Start in plank position. Keep your body straight from head to heels.",
          priority: 'medium',
          category: 'form',
          timestamp: Date.now()
        });
        break;
        
      case 'eccentric':
        cues.push({
          id: 'pushup-down',
          message: "Lower your chest to the ground with control.",
          priority: 'medium',
          category: 'form',
          timestamp: Date.now()
        });
        break;
        
      case 'bottom':
        cues.push({
          id: 'pushup-bottom',
          message: "Great depth! Now push back up with power.",
          priority: 'medium',
          category: 'form',
          timestamp: Date.now()
        });
        break;
        
      case 'concentric':
        cues.push({
          id: 'pushup-up',
          message: "Push through your palms and engage your chest.",
          priority: 'medium',
          category: 'form',
          timestamp: Date.now()
        });
        break;
    }
    
    return {
      exercise: 'pushup',
      phase,
      cues,
      nextPhase: this.getNextPhase(phase),
      completion: this.calculatePushupCompletion(elbowAngle, phase)
    };
  }

  /**
   * Generate plank-specific feedback
   */
  private generatePlankFeedback(pose3D: Pose3D, phase: MovementPhase, cues: FeedbackMessage[]): ExerciseFeedback3D {
    const { skeleton, biomechanics } = pose3D;
    
    if (skeleton.alignment.spinalAlignment < 0.8) {
      cues.push({
        id: 'plank-alignment',
        message: "Keep your body in a straight line. Don't let your hips sag or pike up.",
        priority: 'high',
        category: 'form',
        timestamp: Date.now()
      });
    }
    
    if (biomechanics.stability.coreStability < 0.7) {
      cues.push({
        id: 'plank-core',
        message: "Engage your core muscles. Imagine pulling your belly button to your spine.",
        priority: 'medium',
        category: 'form',
        timestamp: Date.now()
      });
    }
    
    return {
      exercise: 'plank',
      phase,
      cues,
      completion: (skeleton.alignment.spinalAlignment + biomechanics.stability.coreStability) / 2
    };
  }

  /**
   * Generate deadlift-specific feedback
   */
  private generateDeadliftFeedback(pose3D: Pose3D, phase: MovementPhase, cues: FeedbackMessage[]): ExerciseFeedback3D {
    const { skeleton, biomechanics } = pose3D;
    
    // Add deadlift-specific cues
    if (skeleton.alignment.spinalAlignment < 0.8) {
      cues.push({
        id: 'deadlift-back',
        message: "Keep your back straight throughout the movement.",
        priority: 'high',
        category: 'safety',
        timestamp: Date.now()
      });
    }
    
    if (biomechanics.stability.coreStability < 0.7) {
      cues.push({
        id: 'deadlift-core',
        message: "Engage your core and drive through your heels.",
        priority: 'medium',
        category: 'form',
        timestamp: Date.now()
      });
    }
    
    return {
      exercise: 'deadlift',
      phase,
      cues,
      completion: (skeleton.alignment.spinalAlignment + biomechanics.stability.coreStability) / 2
    };
  }

  /**
   * Generate lunge-specific feedback
   */
  private generateLungeFeedback(pose3D: Pose3D, phase: MovementPhase, cues: FeedbackMessage[]): ExerciseFeedback3D {
    const { skeleton, biomechanics } = pose3D;
    
    // Add lunge-specific cues
    if (skeleton.alignment.spinalAlignment < 0.8) {
      cues.push({
        id: 'lunge-torso',
        message: "Keep your torso upright throughout the movement.",
        priority: 'high',
        category: 'form',
        timestamp: Date.now()
      });
    }
    
    if (biomechanics.stability.coreStability < 0.7) {
      cues.push({
        id: 'lunge-stability',
        message: "Engage your core for better stability and control.",
        priority: 'medium',
        category: 'form',
        timestamp: Date.now()
      });
    }
    
    // Add knee tracking cue
    cues.push({
      id: 'lunge-knee',
      message: "Keep your front knee over your ankle, not past your toes.",
      priority: 'high',
      category: 'safety',
      timestamp: Date.now()
    });
    
    return {
      exercise: 'lunge',
      phase,
      cues,
      completion: (skeleton.alignment.spinalAlignment + biomechanics.stability.coreStability) / 2
    };
  }

  /**
   * Generate phase feedback
   */
  private generatePhaseFeedback(pose3D: Pose3D): PhaseFeedback3D {
    const current = pose3D.movement.phase;
    const next = this.getNextPhase(current);
    
    return {
      current,
      next,
      transition: this.getPhaseTransition(current, next),
      timing: this.getPhaseTiming(current)
    };
  }

  /**
   * Generate progress feedback
   */
  private generateProgressFeedback(pose3D: Pose3D): ProgressFeedback3D {
    const improvement: string[] = [];
    const achievements: string[] = [];
    const recommendations: string[] = [];
    const nextGoals: string[] = [];
    
    // Calculate session duration
    const sessionDuration = (Date.now() - this.sessionStart) / 1000; // seconds
    
    // Analyze improvements
    if (this.lastFeedback) {
      const currentScore = pose3D.formScore.overall;
      const lastScore = this.lastFeedback.overall.priority === 'low' ? 90 : 60; // Simplified
      
      if (currentScore > lastScore) {
        improvement.push("Your form is improving with each rep!");
      }
      
      // Session duration milestones
      if (sessionDuration > 300 && sessionDuration % 300 < 5) { // Every 5 minutes
        improvement.push(`Great endurance! ${Math.floor(sessionDuration / 60)} minutes strong!`);
      }
    }
    
    // Check for achievements
    if (pose3D.formScore.overall > 90) {
      achievements.push("Perfect form achieved!");
    }
    
    if (pose3D.movement.quality.overall > 0.8) {
      achievements.push("Excellent movement control!");
    }
    
    // Generate recommendations
    if (pose3D.formScore.breakdown.stability < 0.7) {
      recommendations.push("Focus on core stability exercises");
    }
    
    if (pose3D.formScore.breakdown.rangeOfMotion < 0.7) {
      recommendations.push("Work on improving your range of motion");
    }
    
    // Set next goals
    if (pose3D.formScore.overall < 80) {
      nextGoals.push("Improve overall form score to 80+");
    }
    
    if (pose3D.movement.quality.smoothness < 0.8) {
      nextGoals.push("Focus on smoother movement patterns");
    }
    
    return {
      improvement,
      achievements,
      recommendations,
      nextGoals
    };
  }

  // Helper methods
  private getNextPhase(current: MovementPhase): MovementPhase {
    const phases: MovementPhase[] = ['setup', 'eccentric', 'bottom', 'concentric', 'top', 'rest'];
    const currentIndex = phases.indexOf(current);
    return phases[(currentIndex + 1) % phases.length];
  }

  private getPhaseTransition(current: MovementPhase, next: MovementPhase): string {
    const transitions: Record<string, string> = {
      'setup-eccentric': 'Begin the lowering phase',
      'eccentric-bottom': 'Reach the bottom position',
      'bottom-concentric': 'Start the lifting phase',
      'concentric-top': 'Complete the movement',
      'top-rest': 'Take a moment to reset'
    };
    
    return transitions[`${current}-${next}`] || 'Continue the movement';
  }

  private getPhaseTiming(phase: MovementPhase): number {
    const timings: Record<MovementPhase, number> = {
      'setup': 2,
      'eccentric': 3,
      'bottom': 1,
      'concentric': 2,
      'top': 1,
      'rest': 2
    };
    
    return timings[phase] || 2;
  }

  private calculateSquatCompletion(kneeAngle: number, phase: MovementPhase): number {
    if (phase === 'bottom' && kneeAngle < 90) return 1;
    if (phase === 'top' && kneeAngle > 160) return 1;
    return Math.max(0, (180 - kneeAngle) / 90);
  }

  private calculatePushupCompletion(elbowAngle: number, phase: MovementPhase): number {
    if (phase === 'bottom' && elbowAngle < 90) return 1;
    if (phase === 'top' && elbowAngle > 160) return 1;
    return Math.max(0, (180 - elbowAngle) / 90);
  }

  private updateFeedbackHistory(feedback: PoseFeedback3D): void {
    this.feedbackHistory.push(feedback);
    if (this.feedbackHistory.length > 50) {
      this.feedbackHistory.shift();
    }
  }
}

// ============================================
// Real-time Feedback Manager
// ============================================

export class RealTimeFeedbackManager {
  private feedbackEngine: Pose3DFeedbackEngine;
  private activeFeedback: PoseFeedback3D | null = null;
  private feedbackQueue: FeedbackMessage[] = [];
  private lastUpdateTime: number = 0;
  private updateInterval: number = 100; // ms

  constructor() {
    this.feedbackEngine = new Pose3DFeedbackEngine();
  }

  /**
   * Update feedback in real-time
   */
  updateFeedback(pose3D: Pose3D, exerciseType: string): PoseFeedback3D | null {
    const now = Date.now();
    
    // Throttle updates
    if (now - this.lastUpdateTime < this.updateInterval) {
      return this.activeFeedback;
    }
    
    this.lastUpdateTime = now;
    
    // Generate new feedback
    const newFeedback = this.feedbackEngine.generateFeedback(pose3D, exerciseType);
    
    // Add high-priority messages to queue
    const criticalCorrections = newFeedback.corrections.filter(c => c.severity === 'critical');
    criticalCorrections.forEach(correction => {
      this.feedbackQueue.push({
        id: correction.id,
        message: correction.correction,
        priority: 'critical',
        category: 'safety',
        timestamp: now
      });
    });
    
    // Keep queue size manageable (max 10 messages)
    if (this.feedbackQueue.length > 10) {
      this.feedbackQueue = this.feedbackQueue.slice(-10);
    }
    
    // Filter and prioritize feedback
    const filteredFeedback = this.filterFeedback(newFeedback);
    
    // Update active feedback
    this.activeFeedback = filteredFeedback;
    
    return filteredFeedback;
  }

  /**
   * Filter feedback to avoid overwhelming the user
   */
  private filterFeedback(feedback: PoseFeedback3D): PoseFeedback3D {
    // Only show high-priority corrections
    const filteredCorrections = feedback.corrections.filter(c => 
      c.severity === 'critical' || c.severity === 'major'
    );
    
    // Limit positive messages
    const filteredPositives = feedback.positives.slice(0, 2);
    
    // Limit exercise cues
    const filteredExercise = {
      ...feedback.exercise,
      cues: feedback.exercise.cues.slice(0, 1)
    };
    
    return {
      ...feedback,
      corrections: filteredCorrections,
      positives: filteredPositives,
      exercise: filteredExercise
    };
  }

  /**
   * Get current active feedback
   */
  getActiveFeedback(): PoseFeedback3D | null {
    return this.activeFeedback;
  }

  /**
   * Get queued feedback messages
   */
  getQueuedFeedback(): FeedbackMessage[] {
    return [...this.feedbackQueue];
  }

  /**
   * Get next queued message
   */
  getNextQueuedMessage(): FeedbackMessage | null {
    if (this.feedbackQueue.length > 0) {
      return this.feedbackQueue.shift() || null;
    }
    return null;
  }

  /**
   * Clear all feedback
   */
  clearFeedback(): void {
    this.activeFeedback = null;
    this.feedbackQueue = [];
  }
}

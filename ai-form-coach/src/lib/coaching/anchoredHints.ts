/**
 * Anchored Coaching Hints System
 * 
 * Sword Health-style coaching hints anchored to body joints
 * Example: "Bend your knees a bit more" pointing to knee joint
 */

import { Landmark3D } from '../pose/engine';

// ============================================
// Types & Interfaces
// ============================================

export type HintSeverity = 'info' | 'warning' | 'error' | 'success';

export interface AnchoredHint {
  id: string;                  // Unique identifier
  joint: string;               // Joint name (e.g., 'knee', 'elbow')
  jointIndex: number;          // MediaPipe landmark index
  message: string;             // Display message
  severity: HintSeverity;      // Visual severity
  duration: number;            // How long to show (ms)
  offset: { x: number; y: number }; // Offset from joint (px)
  priority: number;            // Higher = more important (1-10)
  timestamp: number;           // When created
}

export interface HintConfig {
  maxSimultaneousHints: number;  // Max hints shown at once
  minTimeBetweenHints: number;   // Min ms between any hints
  cooldownPerHint: number;       // Min ms before same hint can show again
  defaultDuration: number;       // Default hint duration
  fadeInDuration: number;        // Fade in animation
  fadeOutDuration: number;       // Fade out animation
}

// ============================================
// Predefined Hints Library
// ============================================

export const HINT_LIBRARY: Record<string, Omit<AnchoredHint, 'id' | 'timestamp'>> = {
  // Squat hints
  'squat_depth_low': {
    joint: 'knee',
    jointIndex: 25, // Left knee
    message: 'Go a bit deeper',
    severity: 'info',
    duration: 2000,
    offset: { x: 60, y: -20 },
    priority: 8
  },
  'squat_knees_in': {
    joint: 'knee',
    jointIndex: 25,
    message: 'Keep knees out',
    severity: 'warning',
    duration: 2500,
    offset: { x: 60, y: -20 },
    priority: 9
  },
  'squat_chest_up': {
    joint: 'shoulder',
    jointIndex: 11, // Left shoulder
    message: 'Keep chest up',
    severity: 'warning',
    duration: 2000,
    offset: { x: -80, y: -30 },
    priority: 7
  },
  
  // Pushup hints
  'pushup_depth_low': {
    joint: 'elbow',
    jointIndex: 13, // Left elbow
    message: 'Lower a bit more',
    severity: 'info',
    duration: 2000,
    offset: { x: 60, y: -20 },
    priority: 8
  },
  'pushup_hips_sag': {
    joint: 'hip',
    jointIndex: 23, // Left hip
    message: 'Engage your core',
    severity: 'warning',
    duration: 2500,
    offset: { x: -80, y: -30 },
    priority: 9
  },
  'pushup_body_straight': {
    joint: 'hip',
    jointIndex: 23,
    message: 'Keep body straight',
    severity: 'warning',
    duration: 2000,
    offset: { x: -80, y: -30 },
    priority: 8
  },
  
  // Plank hints
  'plank_hips_high': {
    joint: 'hip',
    jointIndex: 23,
    message: 'Lower your hips',
    severity: 'warning',
    duration: 2000,
    offset: { x: -80, y: -30 },
    priority: 8
  },
  'plank_hips_low': {
    joint: 'hip',
    jointIndex: 23,
    message: 'Raise your hips',
    severity: 'warning',
    duration: 2000,
    offset: { x: -80, y: -30 },
    priority: 8
  },
  
  // General/positive hints
  'tempo_good': {
    joint: 'shoulder',
    jointIndex: 11,
    message: 'Great tempo!',
    severity: 'success',
    duration: 1500,
    offset: { x: -60, y: -40 },
    priority: 5
  },
  'form_excellent': {
    joint: 'shoulder',
    jointIndex: 11,
    message: 'Excellent form!',
    severity: 'success',
    duration: 1500,
    offset: { x: -60, y: -40 },
    priority: 6
  },
  'keep_it_up': {
    joint: 'shoulder',
    jointIndex: 11,
    message: 'Keep it up!',
    severity: 'success',
    duration: 1500,
    offset: { x: -60, y: -40 },
    priority: 4
  }
};

// ============================================
// Coaching Hint Manager
// ============================================

export class CoachingHintManager {
  private activeHints: Map<string, AnchoredHint> = new Map();
  private hintCooldowns: Map<string, number> = new Map();
  private lastHintTime: number = 0;
  private config: HintConfig;
  private hintIdCounter: number = 0;

  constructor(config: Partial<HintConfig> = {}) {
    this.config = {
      maxSimultaneousHints: 1,    // Show only 1 hint at a time (like Sword Health)
      minTimeBetweenHints: 2000,  // 2 seconds between any hints
      cooldownPerHint: 5000,      // 5 seconds before same hint can repeat
      defaultDuration: 2000,      // 2 second default
      fadeInDuration: 300,        // 300ms fade in
      fadeOutDuration: 600,       // 600ms fade out
      ...config
    };
  }

  /**
   * Add hint using predefined hint key
   */
  addHintByKey(hintKey: string, forceShow: boolean = false): boolean {
    const hintTemplate = HINT_LIBRARY[hintKey];
    if (!hintTemplate) {
      console.warn(`Unknown hint key: ${hintKey}`);
      return false;
    }

    return this.addHint(hintKey, {
      ...hintTemplate,
      id: `${hintKey}_${this.hintIdCounter++}`,
      timestamp: Date.now()
    }, forceShow);
  }

  /**
   * Add custom hint
   */
  addHint(key: string, hint: AnchoredHint, forceShow: boolean = false): boolean {
    const now = Date.now();

    // Check if we're at max simultaneous hints
    if (!forceShow && this.activeHints.size >= this.config.maxSimultaneousHints) {
      return false;
    }

    // Check cooldown for this specific hint
    const lastShown = this.hintCooldowns.get(key) || 0;
    if (!forceShow && now - lastShown < this.config.cooldownPerHint) {
      return false;
    }

    // Check global rate limit (time between ANY hints)
    if (!forceShow && now - this.lastHintTime < this.config.minTimeBetweenHints) {
      return false;
    }

    // If we need to make room, remove lowest priority hint
    if (this.activeHints.size >= this.config.maxSimultaneousHints) {
      this.removeLowestPriorityHint(hint.priority);
    }

    // Add hint
    this.activeHints.set(hint.id, hint);
    this.hintCooldowns.set(key, now);
    this.lastHintTime = now;

    // Auto-remove after duration
    setTimeout(() => {
      this.removeHint(hint.id);
    }, hint.duration);

    return true;
  }

  /**
   * Remove specific hint
   */
  removeHint(hintId: string): boolean {
    return this.activeHints.delete(hintId);
  }

  /**
   * Remove lowest priority hint to make room
   */
  private removeLowestPriorityHint(newHintPriority: number) {
    let lowestPriority = Infinity;
    let lowestId: string | null = null;

    for (const [id, hint] of this.activeHints) {
      if (hint.priority < lowestPriority && hint.priority < newHintPriority) {
        lowestPriority = hint.priority;
        lowestId = id;
      }
    }

    if (lowestId) {
      this.activeHints.delete(lowestId);
    }
  }

  /**
   * Get all active hints
   */
  getActiveHints(): AnchoredHint[] {
    return Array.from(this.activeHints.values());
  }

  /**
   * Clear all hints
   */
  clear() {
    this.activeHints.clear();
  }

  /**
   * Reset cooldowns (for new session)
   */
  resetCooldowns() {
    this.hintCooldowns.clear();
    this.lastHintTime = 0;
  }

  /**
   * Check if hint is on cooldown
   */
  isOnCooldown(hintKey: string): boolean {
    const lastShown = this.hintCooldowns.get(hintKey) || 0;
    return Date.now() - lastShown < this.config.cooldownPerHint;
  }

  /**
   * Get time until hint is off cooldown
   */
  getCooldownRemaining(hintKey: string): number {
    const lastShown = this.hintCooldowns.get(hintKey) || 0;
    const remaining = this.config.cooldownPerHint - (Date.now() - lastShown);
    return Math.max(0, remaining);
  }
}

// ============================================
// Hint Rendering Utilities
// ============================================

export interface HintRenderOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  landmarks: Landmark3D[];
  mirror: boolean;
  debug?: boolean;
}

export class HintRenderer {
  /**
   * Render hint bubble anchored to joint
   */
  static renderHint(hint: AnchoredHint, options: HintRenderOptions) {
    const { canvas, ctx, landmarks, mirror } = options;
    
    // Get joint position
    const joint = landmarks[hint.jointIndex];
    if (!joint || joint.visibility < 0.5) {
      return; // Don't render if joint not visible
    }

    // Calculate joint position on canvas
    const jointX = mirror ? (1 - joint.x) * canvas.width : joint.x * canvas.width;
    const jointY = joint.y * canvas.height;

    // Calculate hint bubble position
    const hintX = jointX + hint.offset.x;
    const hintY = jointY + hint.offset.y;

    // Calculate age for fade effects
    const age = Date.now() - hint.timestamp;
    const fadeIn = 300; // 300ms fade in
    const fadeOut = 600; // 600ms fade out
    const lifetime = hint.duration;

    let opacity = 1;
    if (age < fadeIn) {
      opacity = age / fadeIn;
    } else if (age > lifetime - fadeOut) {
      opacity = (lifetime - age) / fadeOut;
    }

    ctx.save();
    ctx.globalAlpha = opacity;

    // Measure text
    ctx.font = 'bold 14px system-ui';
    const textMetrics = ctx.measureText(hint.message);
    const textWidth = textMetrics.width;

    // Bubble dimensions
    const padding = 12;
    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = 40;
    const borderRadius = 8;

    // Draw pointer line to joint
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]); // Dashed line
    ctx.beginPath();
    ctx.moveTo(hintX + bubbleWidth / 2, hintY + bubbleHeight);
    ctx.lineTo(jointX, jointY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw bubble background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    
    this.roundRect(ctx, hintX, hintY, bubbleWidth, bubbleHeight, borderRadius);
    ctx.fill();

    // Draw severity indicator (colored stripe)
    const severityColor = this.getSeverityColor(hint.severity);
    ctx.fillStyle = severityColor;
    this.roundRect(ctx, hintX, hintY, 4, bubbleHeight, borderRadius);
    ctx.fill();

    // Draw text
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hint.message, hintX + bubbleWidth / 2, hintY + bubbleHeight / 2);

    ctx.restore();
  }

  /**
   * Render all active hints
   */
  static renderHints(hints: AnchoredHint[], options: HintRenderOptions) {
    // Sort by priority (render lowest priority first)
    const sorted = [...hints].sort((a, b) => a.priority - b.priority);
    
    for (const hint of sorted) {
      this.renderHint(hint, options);
    }
  }

  /**
   * Get color for severity
   */
  private static getSeverityColor(severity: HintSeverity): string {
    switch (severity) {
      case 'error': return '#FF6B6B';
      case 'warning': return '#FFA500';
      case 'info': return '#4ECDC4';
      case 'success': return '#4CAF50';
      default: return '#4ECDC4';
    }
  }

  /**
   * Draw rounded rectangle
   */
  private static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}


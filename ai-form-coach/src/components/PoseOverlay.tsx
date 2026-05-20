"use client";

import React, { useEffect, useRef } from "react";
import type { Landmark3D } from "@/lib/pose/engine";
import type { Exercise } from "@/lib/validators/types";
import { getContainedVideoRect, getCoveredVideoRect } from "@/lib/pose/render";
import {
  buildMotionFeatures,
  deriveJoints,
  FITNESS_SKELETON_EDGES,
  getRenderedFitnessJoints,
  isJointHighlighted,
  reduceToFitnessSkeleton,
  type DerivedJointId,
  type FitnessJointId,
  type FitnessSkeleton17,
  type SkeletonJoint,
} from "@/lib/pose/contracts";

/* ─────────────────────────────────────────────────────────────────────────────
 * CARRIAGE POSE OVERLAY · The Form Line
 *
 * Brand:    Carriage — Couture Kinetics
 * Metaphor: The Form Line — malachite catches light into champagne.
 *
 * Edges draw in malachite-light (#149A80); joints render in champagne
 * (#D8C29D) with a malachite ring. Faded edges read in bone-tint when a
 * joint is occluded. Corrections snap to oxblood (#5A1F24) — never neon red.
 * Locked May 2026 — values mirror --color-pose-* tokens in globals.css.
 * ────────────────────────────────────────────────────────────────────────── */

// Brand palette — single source of truth for skeleton colors.
// All values are RGBA so we can tune alpha per layer (underlay/glow/main).
const SKELETON_COLORS = {
  // Normal state · The Form Line · malachite edge, champagne joint
  edge:       "rgba(20, 154, 128, 0.90)",   // --carriage-malachite-light
  edgeGlow:   "rgba(20, 154, 128, 0.28)",
  joint:      "rgba(216, 194, 157, 0.95)",  // --carriage-champagne
  jointRing:  "rgba(20, 154, 128, 0.70)",   // malachite ring
  jointGlow:  "rgba(216, 194, 157, 0.35)",  // champagne outer glow

  // Low visibility · faded bone tint (was bright white)
  lowEdge:    "rgba(244, 239, 230, 0.25)",
  lowJoint:   "rgba(244, 239, 230, 0.30)",
  lowRing:    "rgba(244, 239, 230, 0.15)",

  // Error / correction · oxblood (rare, dramatic — never gym-red)
  errorEdge:      "rgba(90, 31, 36, 0.90)",
  errorEdgeGlow:  "rgba(90, 31, 36, 0.30)",
  errorJoint:     "rgba(90, 31, 36, 0.95)",
  errorRing:      "rgba(90, 31, 36, 0.60)",

  // Underlay (dark shadow for contrast on any background)
  shadow:     "rgba(0, 0, 0, 0.45)",
} as const;

interface PoseOverlayProps {
  landmarks?: Landmark3D[] | null;
  landmarksRef?: React.MutableRefObject<Landmark3D[] | null>;
  video: HTMLVideoElement | null;
  /** How the video is sized in CSS — determines landmark projection math */
  sizing?: "contain" | "cover";
  /** Current exercise — used for angle quality thresholds */
  exercise?: Exercise;
  mirror?: boolean;
  labels?: boolean;
  showConfidence?: boolean;
  /** Show angle arcs at key joints (knees, elbows) with form quality colors */
  showAngles?: boolean;
  highlightJoints?: number[];
  corrections?: Array<{ joint: string; position: { x: number; y: number }; message: string }>;
  debug?: boolean;
}

function getRenderableVisibility(value: number | undefined) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0.18, Math.min(1, value ?? 1));
}

function projectPoint(
  x: number,
  y: number,
  bounds: { x: number; y: number; width: number; height: number },
  mirror: boolean,
) {
  return {
    x: bounds.x + (mirror ? 1 - x : x) * bounds.width,
    y: bounds.y + y * bounds.height,
  };
}

/* ── Edge rendering ─────────────────────────────────────────────────────── */

function drawEdge(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  edgeVisibility: number,
  highlighted: boolean,
) {
  const isLow = edgeVisibility < 0.45;

  // Colors based on state
  const strokeColor = highlighted
    ? SKELETON_COLORS.errorEdge
    : isLow
      ? SKELETON_COLORS.lowEdge
      : SKELETON_COLORS.edge;

  const glowColor = highlighted
    ? SKELETON_COLORS.errorEdgeGlow
    : SKELETON_COLORS.edgeGlow;

  const lineWidth = highlighted ? 4 : 3;
  const dash = isLow && !highlighted ? [6, 5] : [];

  // 1. Dark underlay for contrast
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = SKELETON_COLORS.shadow;
  ctx.lineWidth = lineWidth + 4;
  ctx.stroke();
  ctx.restore();

  // 2. Soft glow layer (only for visible + normal/error states)
  if (!isLow) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = lineWidth + 8;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();
  }

  // 3. Main stroke
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/* ── Joint rendering ────────────────────────────────────────────────────── */

function drawJoint(
  ctx: CanvasRenderingContext2D,
  joint: SkeletonJoint,
  bounds: { x: number; y: number; width: number; height: number },
  mirror: boolean,
  highlightJoints: number[],
  labels: boolean,
  showConfidence: boolean,
) {
  const point = projectPoint(joint.x, joint.y, bounds, mirror);
  const highlighted = isJointHighlighted(joint, highlightJoints);
  const visibility = getRenderableVisibility(joint.visibility);
  const isLow = visibility < 0.45;

  // Joint sizing — proportional, larger than typical tech demos
  const isHead = joint.id === "head_center";
  const baseRadius = isHead ? 5 : 7;
  const radius = highlighted ? baseRadius + 3 : baseRadius;

  // Color selection
  const fillColor = highlighted
    ? SKELETON_COLORS.errorJoint
    : isLow
      ? SKELETON_COLORS.lowJoint
      : SKELETON_COLORS.joint;

  const ringColor = highlighted
    ? SKELETON_COLORS.errorRing
    : isLow
      ? SKELETON_COLORS.lowRing
      : SKELETON_COLORS.jointRing;

  const glowColor = highlighted
    ? SKELETON_COLORS.errorEdgeGlow
    : SKELETON_COLORS.jointGlow;

  // 1. Outer glow (only for visible joints)
  if (!isLow) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }

  // 2. Dark shadow ring
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius + 1.5, 0, Math.PI * 2);
  ctx.fillStyle = SKELETON_COLORS.shadow;
  ctx.fill();

  // 3. Colored ring
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = ringColor;
  ctx.fill();

  // 4. Champagne / bone inner dot
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();

  // 5. Confidence ring (faint outer ring when visibility is medium)
  if (showConfidence && joint.visibility < 0.7 && !isLow) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 6, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(244, 239, 230, 0.20)";
    ctx.stroke();
  }

  if (labels) {
    ctx.fillStyle = "rgba(244, 239, 230, 0.92)";
    ctx.font = "500 11px 'Satoshi', system-ui";
    ctx.fillText(joint.id, point.x + radius + 6, point.y - radius);
  }
}

/* ── Angle arc rendering ───────────────────────────────────────────────── */

/** Quality tiers for angle-based form feedback */
type FormQuality = "good" | "warning" | "bad";

// Brand-aligned quality colors.
//   good    → malachite-light  (#149A80)
//   warning → champagne-amber  (#C49A47)
//   bad     → oxblood          (#5A1F24)
const QUALITY_COLORS: Record<FormQuality, { arc: string; label: string; glow: string }> = {
  good:    { arc: "rgba(20, 154, 128, 0.85)", label: "rgba(20, 154, 128, 1)", glow: "rgba(20, 154, 128, 0.30)" },
  warning: { arc: "rgba(196, 154, 71, 0.85)", label: "rgba(196, 154, 71, 1)", glow: "rgba(196, 154, 71, 0.30)" },
  bad:     { arc: "rgba(90, 31, 36, 0.90)",   label: "rgba(90, 31, 36, 1)",   glow: "rgba(90, 31, 36, 0.30)"   },
};

interface AngleVisualization {
  /** Joint at the vertex of the angle */
  vertex: { x: number; y: number };
  /** Joint at one end of the angle */
  from: { x: number; y: number };
  /** Joint at the other end of the angle */
  to: { x: number; y: number };
  /** Computed angle in degrees */
  angleDeg: number;
  /** Form quality rating */
  quality: FormQuality;
  /** Label to display (e.g., "92°") */
  label: string;
}

function computeAngleDeg(
  from: { x: number; y: number },
  vertex: { x: number; y: number },
  to: { x: number; y: number },
): number {
  const a = { x: from.x - vertex.x, y: from.y - vertex.y };
  const b = { x: to.x - vertex.x, y: to.y - vertex.y };
  const dot = a.x * b.x + a.y * b.y;
  const magA = Math.sqrt(a.x * a.x + a.y * a.y);
  const magB = Math.sqrt(b.x * b.x + b.y * b.y);
  if (magA < 0.001 || magB < 0.001) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  vis: AngleVisualization,
  bounds: { x: number; y: number; width: number; height: number },
  mirror: boolean,
) {
  const vertex = projectPoint(vis.vertex.x, vis.vertex.y, bounds, mirror);
  const from = projectPoint(vis.from.x, vis.from.y, bounds, mirror);
  const to = projectPoint(vis.to.x, vis.to.y, bounds, mirror);

  const colors = QUALITY_COLORS[vis.quality];

  // Compute angles for arc — always draw the shorter (minor) arc
  const startAngle = Math.atan2(from.y - vertex.y, from.x - vertex.x);
  const endAngle = Math.atan2(to.y - vertex.y, to.x - vertex.x);
  let sweep = endAngle - startAngle;
  if (sweep > Math.PI) sweep -= 2 * Math.PI;
  if (sweep < -Math.PI) sweep += 2 * Math.PI;
  const anticlockwise = sweep < 0;
  const arcRadius = Math.min(28, Math.max(16, bounds.width * 0.025));

  // Draw the arc
  ctx.save();
  ctx.beginPath();
  ctx.arc(vertex.x, vertex.y, arcRadius, startAngle, endAngle, anticlockwise);
  ctx.strokeStyle = colors.arc;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.restore();

  // Draw angle label — place at midpoint of the drawn arc
  const midAngle = startAngle + sweep / 2;
  const labelRadius = arcRadius + 14;
  const labelX = vertex.x + Math.cos(midAngle) * labelRadius;
  const labelY = vertex.y + Math.sin(midAngle) * labelRadius;

  ctx.save();
  // HUD label — JetBrains Mono · all-caps tracking carried by the px-level metrics.
  ctx.font = "bold 11px 'JetBrains Mono', ui-monospace, monospace";
  const textMetrics = ctx.measureText(vis.label);
  const textW = textMetrics.width + 8;
  const textH = 16;

  // Background pill (roundRect fallback for older browsers)
  ctx.fillStyle = "rgba(7, 7, 7, 0.70)";   // obsidian, 70% — replaces #000/0.6
  ctx.beginPath();
  const rx = labelX - textW / 2;
  const ry = labelY - textH / 2;
  if (ctx.roundRect) {
    ctx.roundRect(rx, ry, textW, textH, 4);
  } else {
    ctx.rect(rx, ry, textW, textH);
  }
  ctx.fill();

  // Text
  ctx.fillStyle = colors.label;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(vis.label, labelX, labelY);
  ctx.restore();
}

/**
 * Exercise-specific angle quality thresholds.
 *
 * - Squat: knee 80-100° is good depth, >160° is standing (warning), elbow not relevant
 * - Pushup: elbow 80-100° is good depth, >160° is locked out (good), knee not relevant
 * - Plank: both knee and elbow should be near straight (~170°+)
 */
interface AngleThresholds {
  knee: { goodMin: number; goodMax: number; warningMin: number; warningMax: number };
  elbow: { goodMin: number; goodMax: number; warningMin: number; warningMax: number };
}

const EXERCISE_ANGLE_THRESHOLDS: Record<Exercise, AngleThresholds> = {
  squat: {
    knee:  { goodMin: 70, goodMax: 110, warningMin: 50, warningMax: 140 },
    elbow: { goodMin: 0, goodMax: 360, warningMin: 0, warningMax: 360 }, // not scored
  },
  pushup: {
    knee:  { goodMin: 160, goodMax: 180, warningMin: 140, warningMax: 180 }, // should stay straight
    elbow: { goodMin: 70, goodMax: 110, warningMin: 50, warningMax: 140 },
  },
  plank: {
    knee:  { goodMin: 160, goodMax: 180, warningMin: 140, warningMax: 180 },
    elbow: { goodMin: 160, goodMax: 180, warningMin: 140, warningMax: 180 },
  },
};

function rateAngle(deg: number, t: { goodMin: number; goodMax: number; warningMin: number; warningMax: number }): FormQuality {
  if (deg >= t.goodMin && deg <= t.goodMax) return "good";
  if (deg >= t.warningMin && deg <= t.warningMax) return "warning";
  return "bad";
}

/**
 * Extracts key angle visualizations from the fitness skeleton.
 * Thresholds are tuned per exercise so squat depth reads as "good", not "bad".
 */
function getExerciseAngles(skeleton: FitnessSkeleton17, exercise: Exercise): AngleVisualization[] {
  const angles: AngleVisualization[] = [];
  const thresholds = EXERCISE_ANGLE_THRESHOLDS[exercise];

  // Left knee angle (hip → knee → ankle)
  if (skeleton.leftHip && skeleton.leftKnee && skeleton.leftAnkle) {
    const deg = computeAngleDeg(skeleton.leftHip, skeleton.leftKnee, skeleton.leftAnkle);
    angles.push({
      vertex: skeleton.leftKnee,
      from: skeleton.leftHip,
      to: skeleton.leftAnkle,
      angleDeg: deg,
      quality: rateAngle(deg, thresholds.knee),
      label: `${Math.round(deg)}°`,
    });
  }

  // Right knee angle
  if (skeleton.rightHip && skeleton.rightKnee && skeleton.rightAnkle) {
    const deg = computeAngleDeg(skeleton.rightHip, skeleton.rightKnee, skeleton.rightAnkle);
    angles.push({
      vertex: skeleton.rightKnee,
      from: skeleton.rightHip,
      to: skeleton.rightAnkle,
      angleDeg: deg,
      quality: rateAngle(deg, thresholds.knee),
      label: `${Math.round(deg)}°`,
    });
  }

  // Left elbow angle (shoulder → elbow → wrist)
  if (skeleton.leftShoulder && skeleton.leftElbow && skeleton.leftWrist) {
    const deg = computeAngleDeg(skeleton.leftShoulder, skeleton.leftElbow, skeleton.leftWrist);
    angles.push({
      vertex: skeleton.leftElbow,
      from: skeleton.leftShoulder,
      to: skeleton.leftWrist,
      angleDeg: deg,
      quality: rateAngle(deg, thresholds.elbow),
      label: `${Math.round(deg)}°`,
    });
  }

  // Right elbow angle
  if (skeleton.rightShoulder && skeleton.rightElbow && skeleton.rightWrist) {
    const deg = computeAngleDeg(skeleton.rightShoulder, skeleton.rightElbow, skeleton.rightWrist);
    angles.push({
      vertex: skeleton.rightElbow,
      from: skeleton.rightShoulder,
      to: skeleton.rightWrist,
      angleDeg: deg,
      quality: rateAngle(deg, thresholds.elbow),
      label: `${Math.round(deg)}°`,
    });
  }

  return angles;
}

/* ── Main component ─────────────────────────────────────────────────────── */

function PoseOverlayComponent({
  landmarks,
  landmarksRef,
  video,
  sizing = "contain",
  exercise = "squat",
  mirror = false,
  labels = false,
  showConfidence = false,
  showAngles = false,
  highlightJoints = [],
  corrections = [],
  debug = false,
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    function renderFrame() {
      const canvas = canvasRef.current;
      if (!canvas || !video) {
        animationRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const width = video.clientWidth;
      const height = video.clientHeight;
      if (width <= 0 || height <= 0) {
        animationRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const currentLandmarks = landmarksRef?.current ?? landmarks ?? null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!currentLandmarks || currentLandmarks.length === 0) {
        animationRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const getRect = sizing === "cover" ? getCoveredVideoRect : getContainedVideoRect;
      const bounds = getRect(canvas.width, canvas.height, video.videoWidth || width, video.videoHeight || height);
      const skeleton = reduceToFitnessSkeleton(currentLandmarks);
      const derived = deriveJoints(skeleton);
      const renderedJoints = getRenderedFitnessJoints(skeleton, derived);
      const motionFeatures = buildMotionFeatures(skeleton, derived);
      const jointMap = new Map(renderedJoints.map((joint) => [joint.id, joint]));

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw edges first (skeleton lines)
      for (const [fromId, toId] of FITNESS_SKELETON_EDGES) {
        const from = jointMap.get(fromId as FitnessJointId | DerivedJointId);
        const to = jointMap.get(toId as FitnessJointId | DerivedJointId);
        if (!from || !to) continue;

        const highlighted = isJointHighlighted(from, highlightJoints) || isJointHighlighted(to, highlightJoints);
        const edgeVisibility = (getRenderableVisibility(from.visibility) + getRenderableVisibility(to.visibility)) / 2;
        const fromPoint = projectPoint(from.x, from.y, bounds, mirror);
        const toPoint = projectPoint(to.x, to.y, bounds, mirror);

        drawEdge(ctx, fromPoint, toPoint, edgeVisibility, highlighted);
      }

      // Draw joints on top (so they sit above lines)
      for (const joint of renderedJoints) {
        if (!Number.isFinite(joint.x) || !Number.isFinite(joint.y)) continue;
        drawJoint(ctx, joint, bounds, mirror, highlightJoints, labels, showConfidence);
      }

      // Angle arcs — drawn on top of skeleton for visibility
      if (showAngles) {
        const exerciseAngles = getExerciseAngles(skeleton, exercise);
        for (const angle of exerciseAngles) {
          drawAngleArc(ctx, angle, bounds, mirror);
        }
      }

      // Correction callouts
      for (const correction of corrections) {
        const point = projectPoint(correction.position.x, correction.position.y, bounds, mirror);

        // Pulsing ring · oxblood
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = SKELETON_COLORS.errorEdge;
        ctx.shadowColor = SKELETON_COLORS.errorEdgeGlow;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();

        // Label · obsidian background, bone text, Satoshi UI face
        ctx.save();
        ctx.fillStyle = "rgba(7, 7, 7, 0.70)";
        ctx.font = "500 11px 'Satoshi', system-ui";
        const textWidth = ctx.measureText(correction.message).width;
        ctx.fillRect(point.x + 16, point.y - 12, textWidth + 12, 20);
        ctx.fillStyle = "rgba(244, 239, 230, 0.95)";
        ctx.fillText(correction.message, point.x + 22, point.y + 2);
        ctx.restore();
      }

      // Debug overlay · JetBrains Mono HUD
      if (debug) {
        ctx.save();
        ctx.fillStyle = "rgba(7, 7, 7, 0.75)";
        ctx.fillRect(8, 8, 180, 64);
        ctx.fillStyle = "#D8C29D"; // champagne — HUD numerics
        ctx.font = "500 11px 'JetBrains Mono', ui-monospace, monospace";
        ctx.fillText(`Vis: ${motionFeatures.visibilityScore.toFixed(2)}`, 16, 26);
        ctx.fillText(`Cue: ${motionFeatures.cueState}`, 16, 42);
        ctx.fillText(`Sym: ${motionFeatures.symmetryScore.toFixed(2)}`, 16, 58);
        ctx.restore();
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(renderFrame);
    }

    animationRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [corrections, debug, exercise, highlightJoints, labels, landmarks, landmarksRef, mirror, showAngles, showConfidence, sizing, video]);

  return <canvas data-testid="pose-overlay" ref={canvasRef} className="pointer-events-none absolute inset-0 z-20" style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
}

const PoseOverlay = React.memo(PoseOverlayComponent, (prevProps, nextProps) => {
  return (
    prevProps.video === nextProps.video &&
    prevProps.sizing === nextProps.sizing &&
    prevProps.exercise === nextProps.exercise &&
    prevProps.mirror === nextProps.mirror &&
    prevProps.debug === nextProps.debug &&
    prevProps.labels === nextProps.labels &&
    prevProps.showConfidence === nextProps.showConfidence &&
    prevProps.showAngles === nextProps.showAngles &&
    prevProps.landmarks === nextProps.landmarks &&
    prevProps.landmarksRef === nextProps.landmarksRef &&
    prevProps.highlightJoints?.length === nextProps.highlightJoints?.length &&
    (prevProps.highlightJoints?.every((j, i) => j === nextProps.highlightJoints?.[i]) ?? true) &&
    prevProps.corrections?.length === nextProps.corrections?.length &&
    (prevProps.corrections?.every((c, i) => c === nextProps.corrections?.[i]) ?? true)
  );
});

PoseOverlay.displayName = "PoseOverlay";

export default PoseOverlay;

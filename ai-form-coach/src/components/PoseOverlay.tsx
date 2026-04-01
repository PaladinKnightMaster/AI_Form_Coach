"use client";

import React, { useEffect, useRef } from "react";
import type { Landmark3D } from "@/lib/pose/engine";
import { getContainedVideoRect } from "@/lib/pose/render";
import {
  buildMotionFeatures,
  deriveJoints,
  FITNESS_SKELETON_EDGES,
  getRenderedFitnessJoints,
  isJointHighlighted,
  reduceToFitnessSkeleton,
  type DerivedJointId,
  type FitnessJointId,
  type SkeletonJoint,
} from "@/lib/pose/contracts";

/* ─────────────────────────────────────────────────────────────────────────────
 * PREMIUM POSE OVERLAY
 *
 * Design reference: Sword Health / Whoop / Peloton
 * - Soft neon glow on skeleton edges (brand cyan)
 * - Elegant gradient-filled joint circles with outer glow
 * - Form-quality color coding: teal → amber → red
 * - Minimal visual weight: the body is the hero, skeleton is the accent
 * ────────────────────────────────────────────────────────────────────────── */

// Brand palette — single source of truth for skeleton colors
const SKELETON_COLORS = {
  // Normal state: premium teal/cyan (matches brand)
  edge:       "rgba(45, 212, 191, 0.85)",   // teal-400
  edgeGlow:   "rgba(45, 212, 191, 0.25)",   // soft glow
  joint:      "rgba(255, 255, 255, 0.95)",   // white fill
  jointRing:  "rgba(45, 212, 191, 0.7)",     // teal ring
  jointGlow:  "rgba(45, 212, 191, 0.35)",    // outer glow

  // Low visibility: faded
  lowEdge:    "rgba(255, 255, 255, 0.25)",
  lowJoint:   "rgba(255, 255, 255, 0.3)",
  lowRing:    "rgba(255, 255, 255, 0.15)",

  // Error/correction: warm red
  errorEdge:      "rgba(239, 68, 68, 0.9)",
  errorEdgeGlow:  "rgba(239, 68, 68, 0.3)",
  errorJoint:     "rgba(239, 68, 68, 0.95)",
  errorRing:      "rgba(239, 68, 68, 0.6)",

  // Underlay (dark shadow for contrast on any background)
  shadow:     "rgba(0, 0, 0, 0.45)",
} as const;

interface PoseOverlayProps {
  landmarks?: Landmark3D[] | null;
  landmarksRef?: React.MutableRefObject<Landmark3D[] | null>;
  video: HTMLVideoElement | null;
  mirror?: boolean;
  labels?: boolean;
  showConfidence?: boolean;
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

  // 4. White/colored inner dot
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();

  // 5. Confidence ring (faint outer ring when visibility is medium)
  if (showConfidence && joint.visibility < 0.7 && !isLow) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 6, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.stroke();
  }

  if (labels) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "500 11px system-ui";
    ctx.fillText(joint.id, point.x + radius + 6, point.y - radius);
  }
}

/* ── Main component ─────────────────────────────────────────────────────── */

function PoseOverlayComponent({
  landmarks,
  landmarksRef,
  video,
  mirror = false,
  labels = false,
  showConfidence = false,
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

      const bounds = getContainedVideoRect(canvas.width, canvas.height, video.videoWidth || width, video.videoHeight || height);
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

      // Correction callouts
      for (const correction of corrections) {
        const point = projectPoint(correction.position.x, correction.position.y, bounds, mirror);

        // Pulsing ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = SKELETON_COLORS.errorEdge;
        ctx.shadowColor = SKELETON_COLORS.errorEdgeGlow;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();

        // Label
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        const textWidth = ctx.measureText(correction.message).width;
        ctx.fillRect(point.x + 16, point.y - 12, textWidth + 12, 20);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.font = "500 11px system-ui";
        ctx.fillText(correction.message, point.x + 22, point.y + 2);
        ctx.restore();
      }

      // Debug overlay
      if (debug) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(8, 8, 180, 64);
        ctx.fillStyle = "#ffffff";
        ctx.font = "500 11px system-ui";
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
  }, [corrections, debug, highlightJoints, labels, landmarks, landmarksRef, mirror, showConfidence, video]);

  return <canvas data-testid="pose-overlay" ref={canvasRef} className="pointer-events-none absolute inset-0 z-20" style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
}

const PoseOverlay = React.memo(PoseOverlayComponent, (prevProps, nextProps) => {
  return (
    prevProps.video === nextProps.video &&
    prevProps.mirror === nextProps.mirror &&
    prevProps.debug === nextProps.debug &&
    prevProps.labels === nextProps.labels &&
    prevProps.showConfidence === nextProps.showConfidence &&
    prevProps.landmarks === nextProps.landmarks &&
    prevProps.landmarksRef === nextProps.landmarksRef &&
    prevProps.highlightJoints?.length === nextProps.highlightJoints?.length &&
    prevProps.corrections?.length === nextProps.corrections?.length
  );
});

PoseOverlay.displayName = "PoseOverlay";

export default PoseOverlay;

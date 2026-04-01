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
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(0.18, Math.min(1, value ?? 1));
}

/**
 * Skeleton edge style — clean white lines (Sword Health aesthetic).
 * High-contrast white on dark camera feed for clarity.
 */
function getEdgeStyle(edgeVisibility: number, highlighted: boolean) {
  if (highlighted) {
    return {
      stroke: "rgba(239, 68, 68, 0.95)",
      underlay: "rgba(0, 0, 0, 0.5)",
      dash: [] as number[],
      width: 5,
      underlayWidth: 9,
    };
  }

  if (edgeVisibility < 0.45) {
    return {
      stroke: `rgba(255, 255, 255, 0.4)`,
      underlay: "rgba(0, 0, 0, 0.3)",
      dash: [8, 7],
      width: 3,
      underlayWidth: 7,
    };
  }

  return {
    stroke: `rgba(255, 255, 255, ${Math.max(0.8, edgeVisibility * 0.95)})`,
    underlay: `rgba(0, 0, 0, ${Math.max(0.35, edgeVisibility * 0.45)})`,
    dash: [] as number[],
    width: 4,
    underlayWidth: 8,
  };
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

/**
 * Draw a single joint landmark — large white filled circles (Sword Health style).
 * Big enough to see clearly on camera feed, with dark outline for contrast.
 */
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

  // Larger radii — 10px base, 12px highlighted, 7px head (Sword Health scale)
  const radius = highlighted ? 12 : joint.id === "head_center" ? 7 : 10;

  const fillColor = highlighted
    ? "rgba(239, 68, 68, 0.95)"
    : visibility < 0.45
      ? `rgba(255, 255, 255, 0.4)`
      : `rgba(255, 255, 255, ${Math.max(0.85, visibility * 0.95)})`;

  const strokeColor = highlighted
    ? "rgba(180, 30, 30, 0.9)"
    : "rgba(0, 0, 0, 0.5)";

  // Dark shadow ring for contrast on any background
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fill();

  // Main filled circle
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

  if (showConfidence && joint.visibility < 0.7) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 5, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.stroke();
  }

  if (labels) {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "12px system-ui";
    ctx.fillText(joint.id, point.x + 14, point.y - 10);
  }
}

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

      for (const [fromId, toId] of FITNESS_SKELETON_EDGES) {
        const from = jointMap.get(fromId as FitnessJointId | DerivedJointId);
        const to = jointMap.get(toId as FitnessJointId | DerivedJointId);
        if (!from || !to) continue;

        const highlighted = isJointHighlighted(from, highlightJoints) || isJointHighlighted(to, highlightJoints);
        const edgeVisibility = (getRenderableVisibility(from.visibility) + getRenderableVisibility(to.visibility)) / 2;
        const fromPoint = projectPoint(from.x, from.y, bounds, mirror);
        const toPoint = projectPoint(to.x, to.y, bounds, mirror);
        const edgeStyle = getEdgeStyle(edgeVisibility, highlighted);

        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(fromPoint.x, fromPoint.y);
        ctx.lineTo(toPoint.x, toPoint.y);
        ctx.strokeStyle = edgeStyle.underlay;
        ctx.lineWidth = edgeStyle.underlayWidth;
        ctx.stroke();

        ctx.beginPath();
        ctx.setLineDash(edgeStyle.dash);
        ctx.moveTo(fromPoint.x, fromPoint.y);
        ctx.lineTo(toPoint.x, toPoint.y);
        ctx.strokeStyle = edgeStyle.stroke;
        ctx.lineWidth = edgeStyle.width;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (const joint of renderedJoints) {
        if (!Number.isFinite(joint.x) || !Number.isFinite(joint.y)) continue;
        drawJoint(ctx, joint, bounds, mirror, highlightJoints, labels, showConfidence);
      }

      for (const correction of corrections) {
        const point = projectPoint(correction.position.x, correction.position.y, bounds, mirror);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ef4444";
        ctx.stroke();
        ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
        ctx.font = "12px system-ui";
        ctx.fillText(correction.message, point.x + 14, point.y - 4);
      }

      if (debug) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
        ctx.fillRect(12, 12, 190, 70);
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px system-ui";
        ctx.fillText(`Visibility: ${motionFeatures.visibilityScore.toFixed(2)}`, 20, 32);
        ctx.fillText(`Cue state: ${motionFeatures.cueState}`, 20, 50);
        ctx.fillText(`Symmetry: ${motionFeatures.symmetryScore.toFixed(2)}`, 20, 68);
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

"use client";

import React from "react";
import type { Landmark3D } from "@/lib/pose/engine";
import type { Exercise } from "@/lib/validators/types";
import PoseOverlay from "@/components/PoseOverlay";
import { Icon } from "@/ui/DS";

interface CoachCameraChromeProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayVideo: HTMLVideoElement | null;
  landmarks: Landmark3D[] | null;
  landmarksRef: React.MutableRefObject<Landmark3D[] | null>;
  exercise: Exercise;
  showAngles: boolean;
  mirrorVideo: boolean;
  debug: boolean;
}

export default function CoachCameraChrome({
  videoRef,
  canvasRef,
  overlayVideo,
  landmarks,
  landmarksRef,
  exercise,
  showAngles,
  mirrorVideo,
  debug,
}: CoachCameraChromeProps) {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.2),_transparent_32%)]" />
      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
        <Icon name="camera" className="h-4 w-4" />
        Live Motion View
      </div>
      <video
        data-testid="coach-video"
        ref={videoRef}
        className="relative z-[1] h-full w-full object-cover"
        style={{ transform: mirrorVideo ? "scaleX(-1)" : "none" }}
        playsInline
        muted
      />
      <canvas data-testid="coach-surface-canvas" ref={canvasRef} className="absolute inset-0 z-10" />
      {overlayVideo ? (
        <PoseOverlay
          landmarks={landmarks}
          landmarksRef={landmarksRef}
          video={overlayVideo}
          sizing="cover"
          mirror={mirrorVideo}
          exercise={exercise}
          showAngles={showAngles}
          debug={debug}
        />
      ) : (
        <div data-testid="camera-stage-status" className="absolute inset-x-6 bottom-6 z-20 rounded-2xl border border-white/15 bg-slate-950/72 px-4 py-3 text-sm text-white backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div>
              <div className="font-semibold">Camera initializing</div>
              <div className="text-xs text-slate-300">Waiting for camera access and pose overlay readiness.</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

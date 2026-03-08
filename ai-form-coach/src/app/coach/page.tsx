"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import CoachCameraChrome from "@/components/coach/CoachCameraChrome";
import { Badge, Button, Card, Icon } from "@/ui/DS";
import { PoseEngine2, type Landmark3D, type PoseEstimateResult } from "@/lib/pose/engine";
import { recordFrameDropFps, shouldProcessFrame } from "@/lib/pose";
import { createValidator } from "@/lib/validators";
import type { Exercise, Phase, RepMetric } from "@/lib/validators/types";
import { ensureSpeechReady, setMuted as setVoiceMuted, speak } from "@/lib/voice/coachVoice";
import { enqueueWrite, flushWrites, getPendingCount } from "@/lib/storage/offlineQueue";
import { getCurrentUserId } from "@/lib/supabase/client";

const VISIBILITY_THRESHOLD = 0.55;
const FLUSH_INTERVAL_MS = 10000;
const TRACKING_TIMEOUT_MS = 1600;

type SessionState = "idle" | "active" | "paused" | "completed";
type QualityState = "good" | "warn" | "bad";

const EXERCISE_COPY = {
  squat: {
    label: "Squat",
    subtitle: "Depth, knee path, and torso stability coaching.",
    starterCue: "Stand tall and let the camera see your full body.",
    liveCue: "Sit back and keep your chest proud.",
    secondaryCue: "Keep knees tracking over toes.",
    checklist: ["Show shoulders through ankles in frame", "Use even floor lighting", "Turn slightly side-on if needed"],
  },
  pushup: {
    label: "Pushup",
    subtitle: "Body line, elbow bend, and rep timing coaching.",
    starterCue: "Set a straight line before the first rep.",
    liveCue: "Keep your core tight and press through the floor.",
    secondaryCue: "Let the camera see shoulders, hips, and heels.",
    checklist: ["A side angle gives cleaner elbow reads", "Keep hips and shoulders in one line", "Step back enough to show full length"],
  },
  plank: {
    label: "Plank",
    subtitle: "Body-line stability and hold quality coaching.",
    starterCue: "Set up long through the spine before the hold.",
    liveCue: "Squeeze glutes and stay long through the crown.",
    secondaryCue: "Keep hips level and your whole body visible.",
    checklist: ["A side profile reads best for plank", "Keep elbows, hips, knees, and ankles visible", "Avoid strong backlight behind you"],
  },
} as const;

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatPercent(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  return `${Math.round(clamped * 100)}%`;
}

function getQualityState(visibility: number, fps: number): QualityState {
  if (visibility >= 0.78 && fps >= 24) return "good";
  if (visibility >= VISIBILITY_THRESHOLD && fps >= 16) return "warn";
  return "bad";
}

function getCameraErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "name" in error && typeof error.name === "string") {
    if (error.name === "NotAllowedError") return "Camera access is blocked. Allow permission and reload.";
    if (error.name === "NotFoundError") return "No camera was found for this device or browser profile.";
    if (error.name === "NotReadableError") return "The camera is already in use by another app or tab.";
    if (error.name === "OverconstrainedError") return "The requested camera settings are not available on this device.";
  }
  return "Camera access failed. Check browser permissions and try again.";
}

function getFlushNotice(remainingWrites: number): string {
  if (remainingWrites > 0) {
    return `Session buffered for sync. ${remainingWrites} write${remainingWrites === 1 ? "" : "s"} still pending.`;
  }
  return "Session saved. It is ready in history.";
}

export default function CoachPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<Landmark3D[] | null>(null);
  const engineRef = useRef<PoseEngine2 | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseLoopRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const validatorRef = useRef(createValidator("squat"));
  const sessionStateRef = useRef<SessionState>("idle");
  const sessionStartIsoRef = useRef<string | null>(null);
  const activeStartPerfRef = useRef<number | null>(null);
  const lastPoseAtRef = useRef(0);
  const staleFrameCountRef = useRef(0);
  const lastCueAtRef = useRef(0);
  const lastCueTextRef = useRef("");
  const repMetricsRef = useRef<RepMetric[]>([]);
  const visibilityAccumulatorRef = useRef({ sum: 0, count: 0 });

  const [overlayVideo, setOverlayVideo] = useState<HTMLVideoElement | null>(null);
  const [exercise, setExercise] = useState<Exercise>("squat");
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [muted, setMuted] = useState(false);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectorError, setDetectorError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState("Initializing pose detector...");
  const [cue, setCue] = useState<string>(EXERCISE_COPY.squat.starterCue);
  const [secondaryCue, setSecondaryCue] = useState<string>(EXERCISE_COPY.squat.secondaryCue);
  const [trackingStatus, setTrackingStatus] = useState("Preparing the camera stage.");
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibilityScore, setVisibilityScore] = useState(0);
  const [fps, setFps] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [quality, setQuality] = useState<QualityState>("bad");
  const [offline, setOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const running = sessionState === "active";
  const copy = EXERCISE_COPY[exercise];
  const stageAlert = detectorError
    ?? cameraError
    ?? (!cameraReady
      ? cameraStatus
      : sessionState === "active"
        ? trackingStatus
        : sessionState === "paused"
          ? "Session paused. Resume to continue live tracking."
          : sessionState === "completed"
            ? (saveNotice ?? "Session complete. Start a new block whenever you are ready.")
            : "Camera ready. Frame your full body, then start.");

  const resetSession = useCallback(() => {
    landmarksRef.current = null;
    repMetricsRef.current = [];
    visibilityAccumulatorRef.current = { sum: 0, count: 0 };
    lastPoseAtRef.current = 0;
    staleFrameCountRef.current = 0;
    lastCueAtRef.current = 0;
    lastCueTextRef.current = "";
    activeStartPerfRef.current = null;
    sessionStartIsoRef.current = null;
    setRepCount(0);
    setPhase("idle");
    setVisibilityScore(0);
    setFps(0);
    setElapsedMs(0);
    setQuality("bad");
    setSaveNotice(null);
  }, []);

  const syncPending = useCallback(async () => {
    try {
      setPendingWrites(await getPendingCount());
    } catch {
      setPendingWrites(0);
    }
  }, []);

  const maybeSpeak = useCallback((text: string) => {
    const now = performance.now();
    const changed = text !== lastCueTextRef.current;
    if (!changed && now - lastCueAtRef.current < 1800) return;
    lastCueTextRef.current = text;
    lastCueAtRef.current = now;
    speak(text);
  }, []);

  const onPose = useCallback(async (result: PoseEstimateResult | null) => {
    if (!result) {
      staleFrameCountRef.current += 1;
      if (staleFrameCountRef.current >= 15) {
        setTrackingStatus("No full-body pose detected yet. Step back and keep your frame visible.");
        setQuality("bad");
      }
      return;
    }

    staleFrameCountRef.current = 0;
    landmarksRef.current = result.landmarks;
    visibilityAccumulatorRef.current.sum += result.visibilityScore;
    visibilityAccumulatorRef.current.count += 1;
    setVisibilityScore(result.visibilityScore);
    setFps(result.fps);
    setQuality(getQualityState(result.visibilityScore, result.fps));
    recordFrameDropFps(result.fps);

    if (result.visibilityScore < VISIBILITY_THRESHOLD) {
      setTrackingStatus("Move back until shoulders, hips, knees, and ankles stay in frame.");
      setCue("Hold still while the camera regains a full-body read.");
      setSecondaryCue(copy.secondaryCue);
      return;
    }

    lastPoseAtRef.current = performance.now();
    setTrackingStatus("Tracking live posture.");
    const state = await validatorRef.current(result, performance.now(), { debounceFrames: 2, bestSide: result.bestSide });
    repMetricsRef.current = state.metrics;
    setRepCount(state.repCount);
    setPhase(state.phase);
    const primaryCue = state.mentorCue?.text || state.cues[0] || copy.liveCue;
    const alternateCue = state.cues[1] || copy.secondaryCue;
    setCue(primaryCue);
    setSecondaryCue(alternateCue);
    maybeSpeak(primaryCue);
  }, [copy.liveCue, copy.secondaryCue, maybeSpeak]);

  const startNew = useCallback(() => {
    validatorRef.current = createValidator(exercise);
    resetSession();
    sessionStartIsoRef.current = new Date().toISOString();
    activeStartPerfRef.current = performance.now();
    ensureSpeechReady();
    setCue(copy.starterCue);
    setSecondaryCue(copy.secondaryCue);
    setTrackingStatus(cameraReady ? "Searching for a full-body pose..." : "Waiting for the camera to finish loading.");
    setSessionState("active");
  }, [cameraReady, copy.secondaryCue, copy.starterCue, exercise, resetSession]);

  const pause = useCallback(() => {
    if (activeStartPerfRef.current !== null) {
      setElapsedMs(performance.now() - activeStartPerfRef.current);
      activeStartPerfRef.current = null;
    }
    setTrackingStatus("Session paused. Resume to continue live tracking.");
    setSessionState("paused");
  }, []);

  const resume = useCallback(() => {
    activeStartPerfRef.current = performance.now() - elapsedMs;
    ensureSpeechReady();
    setTrackingStatus("Searching for a full-body pose...");
    setSessionState("active");
  }, [elapsedMs]);

  const endAndSave = useCallback(async () => {
    const finalElapsedMs = sessionStateRef.current === "active" && activeStartPerfRef.current !== null
      ? performance.now() - activeStartPerfRef.current
      : elapsedMs;
    if (activeStartPerfRef.current !== null) activeStartPerfRef.current = null;
    setElapsedMs(finalElapsedMs);
    setSessionState("completed");
    setSaving(true);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setSaveNotice("Session complete. Sign in to save it to history.");
        return;
      }
      const sessionId = crypto.randomUUID();
      const averageVisibility = visibilityAccumulatorRef.current.count
        ? visibilityAccumulatorRef.current.sum / visibilityAccumulatorRef.current.count
        : null;
      await enqueueWrite({
        table: "sessions",
        payload: {
          id: sessionId,
          user_id: userId,
          exercise,
          started_at: sessionStartIsoRef.current ?? new Date(Date.now() - finalElapsedMs).toISOString(),
          ended_at: new Date().toISOString(),
          total_reps: repCount,
          total_time_seconds: Math.max(0, Math.round(finalElapsedMs / 1000)),
          avg_pose_quality: averageVisibility,
          is_demo: false,
        },
      });      for (const [index, rep] of repMetricsRef.current.entries()) {
        await enqueueWrite({
          table: "reps",
          payload: {
            session_id: sessionId,
            idx: index,
            start_ms: rep.startTs,
            end_ms: rep.endTs,
            peak_depth: rep.peakDepth ?? null,
            rom_score: rep.formIQ ?? null,
            valid: rep.valid !== false,
            is_correct: rep.is_correct ?? null,
            confidence: rep.confidence ?? null,
            quality: rep.quality ?? null,
            quality_score: rep.score ?? null,
            tempo: rep.tempo ?? null,
          },
        });
      }
      await flushWrites();
      const remainingWrites = await getPendingCount();
      setPendingWrites(remainingWrites);
      setSaveNotice(getFlushNotice(remainingWrites));
    } catch (error) {
      console.error("Failed to save coaching session", error);
      setSaveNotice("Session captured locally, but sync failed. We will retry when the connection is healthy.");
      await syncPending();
    } finally {
      setSaving(false);
    }
  }, [elapsedMs, exercise, repCount, syncPending]);

  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);
  useEffect(() => { setVoiceMuted(muted); }, [muted]);
  useEffect(() => {
    if (sessionState === "idle" || sessionState === "completed") {
      validatorRef.current = createValidator(exercise);
      setCue(copy.starterCue);
      setSecondaryCue(copy.secondaryCue);
      setPhase("idle");
      setTrackingStatus(cameraReady ? "Frame your full body, then start." : "Preparing the camera stage.");
    }
  }, [cameraReady, copy.secondaryCue, copy.starterCue, exercise, sessionState]);
  useEffect(() => { void syncPending(); }, [syncPending]);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser does not expose camera access for the coach stage.");
        setCameraStatus("Camera unavailable.");
        return;
      }
      setDetectorError(null);
      setCameraError(null);
      setCameraStatus("Initializing pose detector...");
      const engine = new PoseEngine2({ model: "lite", smoothingAlpha: 0.9, visibilityThreshold: VISIBILITY_THRESHOLD, debounceFrames: 1, enableAdvancedSmoothing: false });
      try {
        await engine.init();
      } catch (error) {
        console.error("Failed to initialize pose detector", error);
        if (!cancelled) {
          setDetectorError("Pose detector could not start. Check MediaPipe asset access, then reload.");
          setCameraStatus("Pose detector unavailable.");
        }
        engine.dispose();
        return;
      }
      if (cancelled) {
        engine.dispose();
        return;
      }
      engineRef.current = engine;
      setCameraStatus("Requesting camera access...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) return resolve();
          const handle = () => {
            video.removeEventListener("loadedmetadata", handle);
            resolve();
          };
          video.addEventListener("loadedmetadata", handle);
        });
        if (cancelled) return;
        await video.play();
        if (cancelled) return;
        setOverlayVideo(video);
        setCameraReady(true);
        setCameraStatus("Camera ready.");
        setTrackingStatus("Frame your full body, then start.");
      } catch (error) {
        console.error("Failed to initialize camera", error);
        if (!cancelled) {
          setCameraError(getCameraErrorMessage(error));
          setCameraStatus("Camera unavailable.");
        }
      }
    }
    void initialize();
    return () => {
      cancelled = true;
      if (poseLoopRef.current !== null) cancelAnimationFrame(poseLoopRef.current);
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (flushTimerRef.current !== null) window.clearInterval(flushTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (engineRef.current) engineRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (!running) {
      if (poseLoopRef.current !== null) cancelAnimationFrame(poseLoopRef.current);
      return;
    }
    let cancelled = false;
    const loop = async () => {
      if (cancelled || sessionStateRef.current !== "active") return;
      const video = videoRef.current;
      const engine = engineRef.current;
      if (video && engine && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        try {
          if (shouldProcessFrame()) {
            const result = await engine.estimate(video);
            await onPose(result);
          }
        } catch (error) {
          console.error("Pose loop failed", error);
          setTrackingStatus("Pose tracking hit an error. Reframe and try again.");
          setQuality("bad");
        }
      }
      if (!cancelled && sessionStateRef.current === "active") {
        poseLoopRef.current = requestAnimationFrame(() => { void loop(); });
      }
    };
    poseLoopRef.current = requestAnimationFrame(() => { void loop(); });
    return () => {
      cancelled = true;
      if (poseLoopRef.current !== null) cancelAnimationFrame(poseLoopRef.current);
    };
  }, [onPose, running]);
  useEffect(() => {
    if (!running) {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      return;
    }
    if (activeStartPerfRef.current === null) activeStartPerfRef.current = performance.now() - elapsedMs;
    timerRef.current = window.setInterval(() => {
      if (activeStartPerfRef.current !== null) setElapsedMs(performance.now() - activeStartPerfRef.current);
    }, 250);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [elapsedMs, running]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (lastPoseAtRef.current !== 0 && performance.now() - lastPoseAtRef.current > TRACKING_TIMEOUT_MS) {
        setTrackingStatus("Pose lost. Step back until your full body is visible again.");
        setQuality("bad");
      }
    }, 300);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    flushTimerRef.current = window.setInterval(() => {
      void flushWrites().finally(() => { void syncPending(); });
    }, FLUSH_INTERVAL_MS);
    return () => {
      if (flushTimerRef.current !== null) window.clearInterval(flushTimerRef.current);
    };
  }, [syncPending]);

  const qualityTone: "success" | "warning" | "error" = quality === "good" ? "success" : quality === "warn" ? "warning" : "error";
  const qualityLabel = quality === "good" ? "Locked in" : quality === "warn" ? "Needs cleanup" : "Reframe";
  const phaseLabel = phase === "idle" ? "Ready" : phase.charAt(0).toUpperCase() + phase.slice(1);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.2),_transparent_30%),linear-gradient(180deg,_#ecfeff_0%,_#f8fafc_42%,_#ffffff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_24rem] lg:items-start">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.7)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-200">
                    <Icon name="lock" className="h-4 w-4" /> Private motion coaching beta
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Live form coaching for squat, pushup, and plank.</h1>
                    <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">The MVP is intentionally narrow: on-device pose tracking, fast corrective cues, and truthful session history. No nutrition AI, no plan builder, and no hidden demo data in the public beta.</p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  <ActionLink href="/history" icon="chart" label="History" description="Review real saved sessions only." />
                  <ActionLink href="/pricing" icon="package" label="Beta access" description="Free beta. No paid gate today." />
                  <ActionLink href="/privacy" icon="lock" label="Privacy" description="Motion analysis stays in the browser loop." />
                </div>
              </div>
              <div className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800/80 dark:bg-slate-900/70 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end">
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Exercise</span>
                  <select data-testid="coach-exercise-select" value={exercise} onChange={(event) => setExercise(event.target.value as Exercise)} disabled={sessionState === "active" || sessionState === "paused"} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                    <option value="squat">Squat</option>
                    <option value="pushup">Pushup</option>
                    <option value="plank">Plank</option>
                  </select>
                </label>
                <ToggleChip label="Mirror video" checked={mirrorVideo} onChange={setMirrorVideo} />
                <ToggleChip label="Mute cues" checked={muted} onChange={setMuted} />
                <div className="flex flex-wrap gap-2">
                  {sessionState === "active" ? (
                    <Button data-testid="coach-primary-action" size="lg" onClick={pause} className="min-w-[9.5rem]"><Icon name="pause" className="h-4 w-4" />Pause</Button>
                  ) : (
                    <Button data-testid="coach-primary-action" size="lg" onClick={sessionState === "paused" ? resume : startNew} disabled={!cameraReady || Boolean(cameraError) || Boolean(detectorError)} className="min-w-[9.5rem]"><Icon name="play" className="h-4 w-4" />{sessionState === "paused" ? "Resume" : sessionState === "completed" ? "Start new" : "Start session"}</Button>
                  )}
                  <Button data-testid="coach-session-save" variant="secondary" size="lg" onClick={() => { void endAndSave(); }} disabled={(sessionState !== "active" && sessionState !== "paused") || saving} className="min-w-[9.5rem]"><Icon name="save" className="h-4 w-4" />{saving ? "Saving..." : "End & save"}</Button>
                </div>
              </div>
            </div>

            <div data-testid="coach-stage" className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-slate-950 shadow-[0_40px_120px_-52px_rgba(15,23,42,0.9)] ring-1 ring-white/10 dark:border-slate-800/80">
              <div className="aspect-[4/5] w-full md:aspect-[16/10] xl:aspect-[16/9]">
                <CoachCameraChrome videoRef={videoRef} canvasRef={canvasRef} overlayVideo={overlayVideo} landmarks={null} landmarksRef={landmarksRef} mirrorVideo={mirrorVideo} debug={false} />
              </div>
              <div className="pointer-events-none absolute inset-x-4 bottom-4 z-30 flex flex-col gap-3 sm:inset-x-6 sm:bottom-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={qualityTone} size="md" className="bg-slate-950/72 text-white backdrop-blur dark:bg-slate-950/72 dark:text-white">{qualityLabel}</Badge>
                  <Badge tone="info" size="md" className="bg-slate-950/72 text-white backdrop-blur dark:bg-slate-950/72 dark:text-white">{copy.label}</Badge>
                  <Badge tone="neutral" size="md" className="bg-slate-950/72 text-white backdrop-blur dark:bg-slate-950/72 dark:text-white">{phaseLabel}</Badge>
                </div>
                <div className="max-w-2xl rounded-[1.5rem] border border-white/15 bg-slate-950/72 px-4 py-4 text-white backdrop-blur-sm sm:px-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Live coach</div>
                  <div data-testid="coach-live-cue" className="mt-2 text-lg font-semibold leading-7 sm:text-xl">{cue}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{secondaryCue}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Card className="rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_28px_120px_-58px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70" padding="lg">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-200">Current session</div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black text-slate-950 dark:text-white">{copy.label}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy.subtitle}</p>
                    </div>
                    <Badge tone={qualityTone}>{qualityLabel}</Badge>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: exercise === "plank" ? "Holds" : "Reps", value: String(repCount), icon: "target" as const },
                    { label: "Elapsed", value: formatDuration(elapsedMs), icon: "clock" as const },
                    { label: "Visibility", value: formatPercent(visibilityScore), icon: "camera" as const },
                    { label: "FPS", value: fps > 0 ? `${fps}` : "-", icon: "activity" as const },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"><Icon name={item.icon} className="h-4 w-4" />{item.label}</div>
                      <div className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Tracking status</div>
                  <div data-testid="coach-tracking-status" className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{stageAlert}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{offline ? `Offline mode active. ${pendingWrites} write${pendingWrites === 1 ? "" : "s"} waiting to sync.` : pendingWrites > 0 ? `${pendingWrites} buffered write${pendingWrites === 1 ? " is" : "s are"} waiting to flush.` : "No buffered writes. The beta surface is currently clean."}</p>
                  {saveNotice ? <p className="mt-2 text-sm leading-6 text-teal-700 dark:text-teal-300">{saveNotice}</p> : null}
                </div>
              </div>
            </Card>

            <Card className="rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_28px_120px_-58px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70" padding="lg">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Setup checklist</div>
                  <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Make the detector easy on itself.</h2>
                </div>
                <ul className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {copy.checklist.map((item) => (
                    <li key={item} className="flex gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70"><span className="mt-1 text-teal-600 dark:text-teal-300"><Icon name="check-circle" className="h-4 w-4" /></span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_28px_120px_-58px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70" padding="lg">
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Beta boundaries</div>
                <ul className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="cpu" className="h-4 w-4" /></span><span>Live coaching uses the in-browser pose stack only. No LLM or cloud AI sits in the live loop.</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="message" className="h-4 w-4" /></span><span>Voice cues are human-authored, with browser speech as fallback when audio is enabled.</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="chart" className="h-4 w-4" /></span><span>History should only show real sessions saved from this coach flow. Demo sessions are out of the public path.</span></li>
                </ul>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

function ToggleChip({ checked, label, onChange }: { checked: boolean; label: string; onChange: (next: boolean) => void; }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`inline-flex min-h-[3.25rem] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${checked ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-500/70 dark:bg-sky-950/30 dark:text-sky-200" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"}`}>
      <span>{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"}`} aria-hidden="true"><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[1.45rem]" : "left-0.5"}`} /></span>
    </button>
  );
}

function ActionLink({ href, icon, label, description }: { href: string; icon: "chart" | "package" | "lock"; label: string; description: string; }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-sky-800/80 dark:hover:bg-slate-900">
      <span className="mt-0.5 rounded-full border border-slate-200 bg-white p-2 text-sky-600 transition group-hover:border-sky-200 group-hover:bg-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-sky-300 dark:group-hover:border-sky-800/80 dark:group-hover:bg-sky-950/40"><Icon name={icon} className="h-4 w-4" /></span>
      <span className="min-w-0"><span className="block text-sm font-semibold text-slate-950 dark:text-white">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-400">{description}</span></span>
    </Link>
  );
}
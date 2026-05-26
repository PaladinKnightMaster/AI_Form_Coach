"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CameraPermissionCard from "@/components/coach/CameraPermissionCard";
import CoachExperienceView from "@/components/coach/CoachExperienceView";
import { createCueCadenceState, resolveCueCadence } from "@/lib/coach/cueCadence";
import {
  formatCoachDeviceSummary,
  getCoachDeviceProfile,
  getCoachRecoveryGuide,
} from "@/lib/coach/deviceReadiness";
import { getFramingGuidance } from "@/lib/coach/framing";
import {
  shouldCommitCoachLiveUi,
  type CoachLiveUiSnapshot,
} from "@/lib/coach/liveUi";
import {
  getCoachStageSimulationIssue,
  getCoachStageSimulationMode,
} from "@/lib/coach/stageSimulation";
import { getCoachTestPoseScript } from "@/lib/coach/testPoseScripts";
import {
  trackCoachCueFeedback,
  trackCoachExerciseChange,
  trackCoachPageVisit,
  trackCoachSessionComplete,
  trackCoachSessionPause,
  trackCoachSessionResume,
  trackCoachSessionStart,
  trackCoachSettingToggle,
  trackCoachStageIssue,
  trackCoachStageReady,
  trackCoachStageRetry,
  type CoachCueFeedback,
  type CoachSaveOutcome,
} from "@/lib/coach/telemetry";
import { enqueueWrite, flushWrites, getPendingCount } from "@/lib/storage/offlineQueue";
import { recordFrameDropFps, shouldProcessFrame } from "@/lib/pose";
import {
  PoseEngine2,
  type Landmark3D,
  type PoseEstimateResult,
} from "@/lib/pose/engine";
import { getCurrentUserId } from "@/lib/supabase/client";
import { createValidator } from "@/lib/validators";
import type { Exercise, Phase, RepMetric } from "@/lib/validators/types";
import { repMetricToDatabase } from "@/lib/validators/databaseUtils";
import { calculateSessionMetrics } from "@/lib/validators/sessionAnalysis";
import { ensureSpeechReady, setMuted as setVoiceMuted, speak } from "@/lib/voice/coachVoice";

const VISIBILITY_THRESHOLD = 0.55;
const FLUSH_INTERVAL_MS = 10000;
const TRACKING_TIMEOUT_MS = 1600;
const COUNTDOWN_SECONDS = 3;
const PREVIEW_STALE_FRAME_LIMIT = 10;
const SCRIPTED_FRAME_INTERVAL_MS = 16;

type SessionState = "idle" | "active" | "paused" | "completed";
type QualityState = "good" | "warn" | "bad";

const EXERCISE_COPY = {
  squat: {
    label: "Squat",
    subtitle: "Depth, knee path, and torso control in one live camera pass.",
    starterCue: "Stand tall and let the camera see your full body.",
    liveCue: "Sit back and keep your chest proud.",
    secondaryCue: "Keep knees tracking over toes.",
    checklist: ["Show shoulders through ankles in frame", "Use even floor lighting", "Turn slightly side-on if needed"],
  },
  pushup: {
    label: "Pushup",
    subtitle: "Body line, elbow depth, and press-back timing coaching.",
    starterCue: "Set a straight line before the first rep.",
    liveCue: "Keep your core tight and press through the floor.",
    secondaryCue: "Let the camera see shoulders, hips, and heels.",
    checklist: ["A side angle gives cleaner elbow reads", "Keep hips and shoulders in one line", "Step back enough to show full length"],
  },
  plank: {
    label: "Plank",
    subtitle: "Body-line stability and hold quality with quieter live cues.",
    starterCue: "Set up long through the spine before the hold.",
    liveCue: "Squeeze glutes and stay long through the crown.",
    secondaryCue: "Keep hips level and your whole body visible.",
    checklist: ["A side profile reads best for plank", "Keep elbows, hips, knees, and ankles visible", "Avoid strong backlight behind you"],
  },
} as const;

function getInitialExercise(): Exercise {
  if (typeof window === "undefined") return "squat";
  const exercise = new URLSearchParams(window.location.search).get("exercise");
  if (exercise === "squat" || exercise === "pushup" || exercise === "plank") return exercise;
  return "squat";
}

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
  const countdownTimerRef = useRef<number | null>(null);
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
  const countdownValueRef = useRef<number | null>(null);
  const cueCadenceRef = useRef(createCueCadenceState(EXERCISE_COPY.squat.starterCue, EXERCISE_COPY.squat.secondaryCue));
  const scriptedPoseFramesRef = useRef<PoseEstimateResult[] | null>(null);
  const scriptedFrameIndexRef = useRef(0);
  const scriptedTimestampRef = useRef(0);
  const pauseCountRef = useRef(0);
  const hasTrackedPageVisitRef = useRef(false);
  const hasTrackedStageReadyRef = useRef(false);
  const lastStageIssueKeyRef = useRef("");
  const retryCountRef = useRef(0);
  const stageSimulationAttemptRef = useRef(0);
  const liveUiCommitAtRef = useRef(0);
  const liveUiSnapshotRef = useRef<CoachLiveUiSnapshot | null>(null);

  const [overlayVideo, setOverlayVideo] = useState<HTMLVideoElement | null>(null);
  const [exercise, setExercise] = useState<Exercise>(getInitialExercise);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [muted, setMuted] = useState(false);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectorError, setDetectorError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState("Initializing pose detector...");
  const [cameraBootNonce, setCameraBootNonce] = useState(0);
  const [cue, setCue] = useState<string>(EXERCISE_COPY.squat.starterCue);
  const [secondaryCue, setSecondaryCue] = useState<string>(EXERCISE_COPY.squat.secondaryCue);
  const [trackingStatus, setTrackingStatus] = useState("Preparing your camera stage.");
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
  const [cueFeedback, setCueFeedback] = useState<CoachCueFeedback | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [hasPose, setHasPose] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const poseScriptQuery = searchParams?.get("pose-script") ?? null;
  const stageSimulationQuery = searchParams?.get("stage-sim") ?? null;
  const e2eAccessQuery = searchParams?.get("e2e-access") ?? null;
  const scriptedPoseFrames = useMemo(() => {
    const isLoopbackHost = typeof window !== "undefined"
      && (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");
    const allowLoopbackAutomation = e2eAccessQuery === "1" && isLoopbackHost;
    if (process.env.NODE_ENV === "production" && !allowLoopbackAutomation) return null;
    return getCoachTestPoseScript(poseScriptQuery);
  }, [e2eAccessQuery, poseScriptQuery]);
  const deviceProfile = useMemo(() => getCoachDeviceProfile(), []);
  const deviceSummary = useMemo(() => formatCoachDeviceSummary(deviceProfile), [deviceProfile]);
  const recoveryGuide = useMemo(() => getCoachRecoveryGuide({ cameraError, detectorError, deviceProfile }), [cameraError, detectorError, deviceProfile]);
  const stageSimulationMode = useMemo(() => getCoachStageSimulationMode(stageSimulationQuery), [stageSimulationQuery]);

  // Loopback automation: when an e2e harness drives /coach?e2e-access=1 from
  // 127.0.0.1 / localhost, auto-grant the camera-permission gate so the test
  // can reach `coach-stage-shell`. Mirrors the same loopback condition used
  // by `scriptedPoseFrames` above. Production users still see the permission
  // card — this only fires for loopback + the explicit bypass query.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLoopbackHost =
      window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    if (e2eAccessQuery === "1" && isLoopbackHost && !permissionGranted) {
      setPermissionGranted(true);
    }
  }, [e2eAccessQuery, permissionGranted]);
  const running = sessionState === "active";
  const copy = EXERCISE_COPY[exercise];
  const framing = useMemo(() => getFramingGuidance({ exercise, cameraReady, visibilityScore, fps, hasPose }), [cameraReady, exercise, fps, hasPose, visibilityScore]);
  const stageAlert = detectorError ?? cameraError ?? (countdownValue !== null
    ? `Hold your setup. ${copy.label} starts in ${countdownValue}.`
    : !cameraReady
      ? cameraStatus
      : sessionState === "active"
        ? trackingStatus
        : sessionState === "paused"
          ? `Session paused. ${framing.detail}`
          : sessionState === "completed"
            ? (saveNotice ?? `${framing.label}. Start another block whenever you are ready.`)
            : `${framing.label}. ${framing.detail}`);

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
    liveUiSnapshotRef.current = null;
    liveUiCommitAtRef.current = 0;
    setRepCount(0);
    setPhase("idle");
    setElapsedMs(0);
    setSaveNotice(null);
    setCueFeedback(null);
    pauseCountRef.current = 0;
  }, []);

  const commitLiveUiFrame = useCallback((next: CoachLiveUiSnapshot, now: number, force = false) => {
    if (!force && !shouldCommitCoachLiveUi(liveUiSnapshotRef.current, next, now, liveUiCommitAtRef.current)) {
      return;
    }

    liveUiSnapshotRef.current = next;
    liveUiCommitAtRef.current = now;
    startTransition(() => {
      setHasPose(next.hasPose);
      setVisibilityScore(next.visibilityScore);
      setFps(next.fps);
      setQuality(next.quality);
      setTrackingStatus(next.trackingStatus);
      setRepCount(next.repCount);
      setPhase(next.phase);
    });
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

  const setImmediateCue = useCallback((primary: string, secondary: string) => {
    cueCadenceRef.current = createCueCadenceState(primary, secondary, performance.now());
    setCue(primary);
    setSecondaryCue(secondary);
  }, []);

  const setCadencedCue = useCallback((primary: string, secondary: string, shouldSpeak = false) => {
    const previousPrimary = cueCadenceRef.current.activePrimary;
    const resolved = resolveCueCadence(cueCadenceRef.current, primary, secondary, performance.now());
    cueCadenceRef.current = resolved.state;
    setCue(resolved.primary);
    setSecondaryCue(resolved.secondary);
    if (shouldSpeak && resolved.primaryChanged && resolved.primary !== previousPrimary) {
      maybeSpeak(resolved.primary);
    }
  }, [maybeSpeak]);

  const handleExerciseChange = useCallback((nextExercise: Exercise) => {
    if (nextExercise === exercise) return;
    trackCoachExerciseChange(exercise, nextExercise, sessionState);
    setExercise(nextExercise);
    setCueFeedback(null);
  }, [exercise, sessionState]);

  const handleMutedChange = useCallback((nextMuted: boolean) => {
    setMuted(nextMuted);
    trackCoachSettingToggle("voice", !nextMuted, exercise, sessionState);
  }, [exercise, sessionState]);

  const handleMirrorChange = useCallback((nextMirrorVideo: boolean) => {
    setMirrorVideo(nextMirrorVideo);
    trackCoachSettingToggle("mirror", nextMirrorVideo, exercise, sessionState);
  }, [exercise, sessionState]);

  const handleCueFeedback = useCallback((feedback: CoachCueFeedback) => {
    setCueFeedback(feedback);
    trackCoachCueFeedback(exercise, feedback, repCount, elapsedMs, pauseCountRef.current);
  }, [elapsedMs, exercise, repCount]);

  const enableScriptedStage = useCallback((message?: string) => {
    const video = videoRef.current;
    const scriptedFrames = scriptedPoseFramesRef.current;
    if (!video || !scriptedFrames || scriptedFrames.length === 0) {
      return false;
    }
    setDetectorError(null);
    setCameraError(null);
    setOverlayVideo(video);
    setCameraReady(true);
    setCameraStatus("Scripted stage ready.");
    setTrackingStatus(message ?? "Scripted motion stage ready. Start when you want to validate the coach flow.");
    return true;
  }, []);

  const releaseCameraStage = useCallback(() => {
    if (poseLoopRef.current !== null) {
      cancelAnimationFrame(poseLoopRef.current);
      poseLoopRef.current = null;
    }
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
  }, []);

  const handleRetryCamera = useCallback(() => {
    retryCountRef.current += 1;
    hasTrackedStageReadyRef.current = false;
    lastStageIssueKeyRef.current = "";
    releaseCameraStage();
    landmarksRef.current = null;
    setOverlayVideo(null);
    setCameraReady(false);
    setCameraError(null);
    setDetectorError(null);
    setCameraStatus("Retrying camera access...");
    setTrackingStatus("Retrying camera access...");
    setHasPose(false);
    setVisibilityScore(0);
    setFps(0);
    setQuality("bad");
    setPhase("idle");
    setSessionState("idle");
    setImmediateCue(copy.starterCue, copy.secondaryCue);
    trackCoachStageRetry(deviceProfile, Boolean(scriptedPoseFramesRef.current), retryCountRef.current);
    setCameraBootNonce((current) => current + 1);
  }, [copy.secondaryCue, copy.starterCue, deviceProfile, releaseCameraStage, setImmediateCue]);

  const cancelCountdown = useCallback((message?: string) => {
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    countdownValueRef.current = null;
    setCountdownValue(null);
    setImmediateCue(copy.starterCue, copy.secondaryCue);
    setTrackingStatus(message ?? `${framing.label}. ${framing.detail}`);
  }, [copy.secondaryCue, copy.starterCue, framing.detail, framing.label, setImmediateCue]);

  const activateSession = useCallback(() => {
    validatorRef.current = createValidator(exercise);
    resetSession();
    sessionStartIsoRef.current = new Date().toISOString();
    activeStartPerfRef.current = performance.now();
    ensureSpeechReady();
    countdownValueRef.current = null;
    setCountdownValue(null);
    setImmediateCue("Hold steady while we lock your first posture read.", copy.secondaryCue);
    setTrackingStatus("Searching for a full-body pose...");
    setSessionState("active");
    trackCoachSessionStart(exercise, Boolean(scriptedPoseFramesRef.current), deviceProfile);
  }, [copy.secondaryCue, deviceProfile, exercise, resetSession, setImmediateCue]);

  const onPose = useCallback(async (result: PoseEstimateResult | null, frameTs?: number) => {
    const currentState = sessionStateRef.current;
    const frameNow = performance.now();
    const measurementTs = frameTs ?? frameNow;
    const currentSnapshot = liveUiSnapshotRef.current;

    if (!result) {
      staleFrameCountRef.current += 1;
      if (staleFrameCountRef.current >= PREVIEW_STALE_FRAME_LIMIT) {
        commitLiveUiFrame({
          hasPose: false,
          visibilityScore: 0,
          fps: currentSnapshot?.fps ?? 0,
          quality: "bad",
          trackingStatus: currentState === "active"
            ? "No full-body pose detected yet. Step back and keep your frame visible."
            : "Step back until shoulders, hips, knees, and ankles stay inside the guide.",
          repCount: currentState === "active" ? (currentSnapshot?.repCount ?? 0) : 0,
          phase: currentState === "active" ? (currentSnapshot?.phase ?? "idle") : "idle",
        }, frameNow, true);
      }
      return;
    }

    staleFrameCountRef.current = 0;
    landmarksRef.current = result.landmarks;
    const nextQuality = getQualityState(result.visibilityScore, result.fps);
    recordFrameDropFps(result.fps);

    if (currentState !== "active") {
      const previewFraming = getFramingGuidance({ exercise, cameraReady: true, visibilityScore: result.visibilityScore, fps: result.fps, hasPose: true });
      commitLiveUiFrame({
        hasPose: true,
        visibilityScore: result.visibilityScore,
        fps: result.fps,
        quality: nextQuality,
        trackingStatus: previewFraming.detail,
        repCount: 0,
        phase: "idle",
      }, frameNow);
      return;
    }

    visibilityAccumulatorRef.current.sum += result.visibilityScore;
    visibilityAccumulatorRef.current.count += 1;

    if (result.visibilityScore < VISIBILITY_THRESHOLD) {
      commitLiveUiFrame({
        hasPose: true,
        visibilityScore: result.visibilityScore,
        fps: result.fps,
        quality: nextQuality,
        trackingStatus: "Move back until shoulders, hips, knees, and ankles stay in frame.",
        repCount: currentSnapshot?.repCount ?? 0,
        phase: currentSnapshot?.phase ?? "idle",
      }, frameNow, true);
      setImmediateCue("Hold still while the camera regains a full-body read.", copy.secondaryCue);
      return;
    }

    lastPoseAtRef.current = frameNow;
    const state = await validatorRef.current(result, measurementTs, { debounceFrames: 2, bestSide: result.bestSide });
    repMetricsRef.current = state.metrics;
    commitLiveUiFrame({
      hasPose: true,
      visibilityScore: result.visibilityScore,
      fps: result.fps,
      quality: nextQuality,
      trackingStatus: "Tracking live posture.",
      repCount: state.repCount,
      phase: state.phase,
    }, frameNow);
    const primaryCue = state.mentorCue?.text || state.cues[0] || copy.liveCue;
    const alternateCue = state.cues[1] || copy.secondaryCue;
    setCadencedCue(primaryCue, alternateCue, true);
  }, [commitLiveUiFrame, copy.liveCue, copy.secondaryCue, exercise, setCadencedCue, setImmediateCue]);

  const queueSessionStart = useCallback(() => {
    if (!cameraReady || cameraError || detectorError) return;
    if (countdownValueRef.current !== null) {
      cancelCountdown();
      return;
    }
    ensureSpeechReady();
    countdownValueRef.current = COUNTDOWN_SECONDS;
    setCountdownValue(COUNTDOWN_SECONDS);
    setImmediateCue(`Hold steady. ${copy.label} starts in ${COUNTDOWN_SECONDS}.`, framing.state === "ready"
      ? "Stay inside the guide until the countdown clears."
      : "Keep your whole body inside the guide before the first live read.");
    setTrackingStatus(framing.state === "ready"
      ? "Full body locked. Hold steady for the countdown."
      : "Starting the countdown. Keep shoulders, hips, knees, and ankles visible.");
  }, [cameraError, cameraReady, cancelCountdown, copy.label, detectorError, framing.state, setImmediateCue]);

  const pause = useCallback(() => {
    const nextElapsedMs = activeStartPerfRef.current !== null ? performance.now() - activeStartPerfRef.current : elapsedMs;
    if (activeStartPerfRef.current !== null) activeStartPerfRef.current = null;
    pauseCountRef.current += 1;
    setElapsedMs(nextElapsedMs);
    trackCoachSessionPause(exercise, nextElapsedMs, repCount, pauseCountRef.current);
    setTrackingStatus("Session paused. Reframe if needed, then resume.");
    setSessionState("paused");
  }, [elapsedMs, exercise, repCount]);

  const resume = useCallback(() => {
    activeStartPerfRef.current = performance.now() - elapsedMs;
    ensureSpeechReady();
    trackCoachSessionResume(exercise, elapsedMs, repCount, pauseCountRef.current);
    setTrackingStatus("Searching for a full-body pose...");
    setSessionState("active");
  }, [elapsedMs, exercise, repCount]);

  const endAndSave = useCallback(async () => {
    const finalElapsedMs = sessionStateRef.current === "active" && activeStartPerfRef.current !== null ? performance.now() - activeStartPerfRef.current : elapsedMs;
    const averageVisibility = visibilityAccumulatorRef.current.count ? visibilityAccumulatorRef.current.sum / visibilityAccumulatorRef.current.count : null;
    let saveOutcome: CoachSaveOutcome = "saved";
    if (activeStartPerfRef.current !== null) activeStartPerfRef.current = null;
    if (countdownValueRef.current !== null) cancelCountdown();
    setElapsedMs(finalElapsedMs);
    setSessionState("completed");
    setSaving(true);

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        saveOutcome = "signin_required";
        setSaveNotice("Session complete. Sign in to save it to history.");
        return;
      }
      const sessionId = crypto.randomUUID();

      // Calculate session-level metrics for ML training data
      const sessionMetrics = calculateSessionMetrics(repMetricsRef.current);

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
          // Enhanced session-level training data
          avg_quality_score: sessionMetrics.averageQuality,
          quality_distribution: sessionMetrics.qualityDistribution,
          total_errors: sessionMetrics.totalErrors,
          error_rate: sessionMetrics.errorRate,
          consistency_score: sessionMetrics.consistencyScore,
          improvement_trend: sessionMetrics.improvementTrend,
          form_progression: sessionMetrics.formProgression,
          correct_rate: sessionMetrics.correctRate,
        },
      });
      for (const [index, rep] of repMetricsRef.current.entries()) {
        // Use databaseUtils for complete rep data including errors & exercise metrics
        const dbRep = repMetricToDatabase(rep, sessionId, index);
        await enqueueWrite({
          table: "reps",
          payload: dbRep as unknown as Record<string, unknown>,
        });
      }
      await flushWrites();
      const remainingWrites = await getPendingCount();
      saveOutcome = remainingWrites > 0 ? "sync_pending" : "saved";
      setPendingWrites(remainingWrites);
      setSaveNotice(getFlushNotice(remainingWrites));
    } catch (error) {
      console.error("Failed to save coaching session", error);
      saveOutcome = "sync_retry";
      setSaveNotice("Session captured locally, but sync failed. We will retry when the connection is healthy.");
      await syncPending();
    } finally {
      trackCoachSessionComplete(exercise, finalElapsedMs, repCount, averageVisibility, pauseCountRef.current, saveOutcome, Boolean(scriptedPoseFramesRef.current), deviceProfile);
      setSaving(false);
    }
  }, [cancelCountdown, deviceProfile, elapsedMs, exercise, repCount, syncPending]);

  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);
  useEffect(() => { countdownValueRef.current = countdownValue; }, [countdownValue]);
  useEffect(() => { setVoiceMuted(muted); }, [muted]);

  useEffect(() => {
    if (hasTrackedPageVisitRef.current) return;
    trackCoachPageVisit(Boolean(scriptedPoseFrames), deviceProfile);
    hasTrackedPageVisitRef.current = true;
  }, [deviceProfile, scriptedPoseFrames]);

  useEffect(() => {
    if (!cameraReady) {
      hasTrackedStageReadyRef.current = false;
      return;
    }
    if (hasTrackedStageReadyRef.current) return;
    trackCoachStageReady(deviceProfile, Boolean(scriptedPoseFramesRef.current), retryCountRef.current);
    hasTrackedStageReadyRef.current = true;
  }, [cameraReady, deviceProfile]);

  useEffect(() => {
    const issueKind = detectorError ? "detector" : cameraError ? "camera" : null;
    const issueMessage = detectorError ?? cameraError ?? null;
    if (!issueKind || !issueMessage) {
      lastStageIssueKeyRef.current = "";
      return;
    }
    const issueKey = `${issueKind}:${issueMessage}`;
    if (lastStageIssueKeyRef.current === issueKey) return;
    trackCoachStageIssue(issueKind, issueMessage, deviceProfile, Boolean(scriptedPoseFramesRef.current), retryCountRef.current);
    lastStageIssueKeyRef.current = issueKey;
  }, [cameraError, detectorError, deviceProfile]);

  useEffect(() => {
    scriptedPoseFramesRef.current = scriptedPoseFrames;
    scriptedFrameIndexRef.current = 0;
    scriptedTimestampRef.current = 0;
  }, [scriptedPoseFrames]);

  useEffect(() => {
    stageSimulationAttemptRef.current = 0;
  }, [stageSimulationMode]);

  useEffect(() => {
    if (!scriptedPoseFramesRef.current) return;
    if (sessionState === "active") {
      scriptedFrameIndexRef.current = 0;
      scriptedTimestampRef.current = performance.now();
      return;
    }
    scriptedFrameIndexRef.current = 0;
    scriptedTimestampRef.current = 0;
  }, [sessionState]);

  useEffect(() => {
    if (sessionState === "idle" || sessionState === "completed") {
      validatorRef.current = createValidator(exercise);
      setImmediateCue(copy.starterCue, copy.secondaryCue);
      setPhase("idle");
      setTrackingStatus(cameraReady ? framing.detail : "Preparing your camera stage.");
    }
  }, [cameraReady, copy.secondaryCue, copy.starterCue, exercise, framing.detail, sessionState, setImmediateCue]);

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
    if (!permissionGranted) return;
    let cancelled = false;

    async function initialize() {
      setCameraReady(false);
      setOverlayVideo(null);
      setHasPose(false);
      setVisibilityScore(0);
      setFps(0);
      setQuality("bad");
      landmarksRef.current = null;
      setCameraError(null);
      setDetectorError(null);

      const simulatedStageIssue = getCoachStageSimulationIssue(stageSimulationMode, stageSimulationAttemptRef.current);
      if (simulatedStageIssue) {
        stageSimulationAttemptRef.current += 1;
        setCameraError(simulatedStageIssue.kind === "camera" ? simulatedStageIssue.message : null);
        setDetectorError(simulatedStageIssue.kind === "detector" ? simulatedStageIssue.message : null);
        setCameraStatus(simulatedStageIssue.status);
        setTrackingStatus(simulatedStageIssue.detail);
        return;
      }

      if (enableScriptedStage()) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser does not expose camera access for the coach stage.");
        setCameraStatus("Camera unavailable.");
        return;
      }

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
        setTrackingStatus("Looking for your full-body frame...");
      } catch (error) {
        console.error("Failed to initialize camera", error);
        if (!cancelled && enableScriptedStage("Scripted motion stage ready. Camera fallback was skipped for this QA run.")) return;
        if (!cancelled) {
          setCameraError(getCameraErrorMessage(error));
          setCameraStatus("Camera unavailable.");
        }
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      releaseCameraStage();
    };
  }, [permissionGranted, cameraBootNonce, enableScriptedStage, releaseCameraStage, stageSimulationMode]);

  useEffect(() => {
    if (countdownValue === null) {
      if (countdownTimerRef.current !== null) {
        window.clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }
    if (countdownValue === 0) {
      activateSession();
      return;
    }
    setImmediateCue(`Hold steady. ${copy.label} starts in ${countdownValue}.`, framing.state === "ready"
      ? "Stay inside the guide until the countdown clears."
      : "Keep your whole body inside the guide before the first live read.");
    countdownTimerRef.current = window.setTimeout(() => {
      setCountdownValue((current) => (current === null ? null : current - 1));
    }, 900);
    return () => {
      if (countdownTimerRef.current !== null) {
        window.clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [activateSession, copy.label, countdownValue, framing.state, setImmediateCue]);

  useEffect(() => {
    if (!cameraReady || cameraError || detectorError) {
      if (poseLoopRef.current !== null) cancelAnimationFrame(poseLoopRef.current);
      return;
    }
    let cancelled = false;
    const loop = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      const engine = engineRef.current;
      const scriptedFrames = scriptedPoseFramesRef.current;
      const canRunScriptedFrames = Boolean(video && scriptedFrames && scriptedFrames.length > 0 && sessionStateRef.current === "active");
      if (canRunScriptedFrames && scriptedFrames) {
        try {
          const index = Math.min(scriptedFrameIndexRef.current, scriptedFrames.length - 1);
          const scriptedTs = scriptedTimestampRef.current === 0 ? performance.now() : scriptedTimestampRef.current + SCRIPTED_FRAME_INTERVAL_MS;
          scriptedTimestampRef.current = scriptedTs;
          if (scriptedFrameIndexRef.current < scriptedFrames.length - 1) scriptedFrameIndexRef.current += 1;
          await onPose(scriptedFrames[index], scriptedTs);
        } catch (error) {
          console.error("Pose loop failed", error);
          setTrackingStatus("Pose tracking hit an error. Reframe and try again.");
          setQuality("bad");
        }
      } else if (video && engine && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
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
      if (!cancelled) {
        poseLoopRef.current = requestAnimationFrame(() => { void loop(); });
      }
    };
    poseLoopRef.current = requestAnimationFrame(() => { void loop(); });
    return () => {
      cancelled = true;
      if (poseLoopRef.current !== null) cancelAnimationFrame(poseLoopRef.current);
    };
  }, [cameraError, cameraReady, detectorError, onPose]);

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
  const primaryActionLabel = countdownValue !== null ? "Cancel countdown" : sessionState === "paused" ? "Resume session" : sessionState === "completed" ? "Start another session" : "Start session";

  if (!permissionGranted) {
    return <CameraPermissionCard onAllow={() => setPermissionGranted(true)} />;
  }

  return (
    <CoachExperienceView
      exercise={exercise}
      exerciseLabel={copy.label}
      subtitle={copy.subtitle}
      checklist={copy.checklist}
      sessionState={sessionState}
      stageAlert={stageAlert}
      cue={cue}
      secondaryCue={secondaryCue}
      repCount={repCount}
      elapsedLabel={formatDuration(elapsedMs)}
      visibilityLabel={formatPercent(visibilityScore)}
      fpsLabel={fps > 0 ? `${fps}` : "-"}
      qualityTone={qualityTone}
      qualityLabel={qualityLabel}
      phaseLabel={phaseLabel}
      framingTone={framing.tone}
      framingLabel={framing.label}
      framingDetail={framing.detail}
      cameraAngleLabel={framing.cameraAngleLabel}
      cameraAngleDetail={framing.cameraAngleDetail}
      countdownValue={countdownValue}
      cameraReady={cameraReady}
      hasStageError={Boolean(cameraError) || Boolean(detectorError)}
      muted={muted}
      mirrorVideo={mirrorVideo}
      saving={saving}
      offline={offline}
      pendingWrites={pendingWrites}
      saveNotice={saveNotice}
      deviceSummary={deviceSummary}
      recoveryTitle={recoveryGuide?.title ?? null}
      recoverySteps={recoveryGuide?.steps ?? []}
      cueFeedback={cueFeedback}
      primaryActionLabel={primaryActionLabel}
      videoRef={videoRef}
      canvasRef={canvasRef}
      overlayVideo={overlayVideo}
      landmarksRef={landmarksRef}
      onExerciseChange={handleExerciseChange}
      onMutedChange={handleMutedChange}
      onMirrorChange={handleMirrorChange}
      onCueFeedback={handleCueFeedback}
      onRetryCamera={handleRetryCamera}
      onPrimaryAction={sessionState === "active" ? pause : sessionState === "paused" ? resume : queueSessionStart}
      onEndAndSave={() => { void endAndSave(); }}
    />
  );
}



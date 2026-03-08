"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import CoachExperienceView from "@/components/coach/CoachExperienceView";
import { createCueCadenceState, resolveCueCadence } from "@/lib/coach/cueCadence";
import { getFramingGuidance } from "@/lib/coach/framing";
import { getCoachTestPoseScript } from "@/lib/coach/testPoseScripts";
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
const COUNTDOWN_SECONDS = 3;
const PREVIEW_STALE_FRAME_LIMIT = 10;
const SCRIPTED_FRAME_INTERVAL_MS = 16;

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
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [hasPose, setHasPose] = useState(false);
  const poseScriptQuery = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("pose-script")
    : null;
  const scriptedPoseFrames = useMemo(() => {
    if (process.env.NODE_ENV === "production") return null;
    return getCoachTestPoseScript(poseScriptQuery);
  }, [poseScriptQuery]);

  const running = sessionState === "active";
  const copy = EXERCISE_COPY[exercise];
  const framing = useMemo(
    () => getFramingGuidance({ cameraReady, visibilityScore, fps, hasPose }),
    [cameraReady, fps, hasPose, visibilityScore],
  );
  const stageAlert = detectorError
    ?? cameraError
    ?? (countdownValue !== null
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
    setRepCount(0);
    setPhase("idle");
    setElapsedMs(0);
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
  }, [copy.secondaryCue, exercise, resetSession, setImmediateCue]);

  const onPose = useCallback(async (result: PoseEstimateResult | null, frameTs?: number) => {
    const currentState = sessionStateRef.current;
    const frameNow = performance.now();
    const measurementTs = frameTs ?? frameNow;

    if (!result) {
      staleFrameCountRef.current += 1;
      if (staleFrameCountRef.current >= PREVIEW_STALE_FRAME_LIMIT) {
        setHasPose(false);
        setVisibilityScore(0);
        setQuality("bad");
        setTrackingStatus(
          currentState === "active"
            ? "No full-body pose detected yet. Step back and keep your frame visible."
            : "Step back until shoulders, hips, knees, and ankles stay inside the guide.",
        );
      }
      return;
    }

    staleFrameCountRef.current = 0;
    setHasPose(true);
    landmarksRef.current = result.landmarks;
    setVisibilityScore(result.visibilityScore);
    setFps(result.fps);
    setQuality(getQualityState(result.visibilityScore, result.fps));
    recordFrameDropFps(result.fps);

    if (currentState !== "active") {
      const previewFraming = getFramingGuidance({
        cameraReady: true,
        visibilityScore: result.visibilityScore,
        fps: result.fps,
        hasPose: true,
      });

      setTrackingStatus(previewFraming.detail);
      return;
    }

    visibilityAccumulatorRef.current.sum += result.visibilityScore;
    visibilityAccumulatorRef.current.count += 1;

    if (result.visibilityScore < VISIBILITY_THRESHOLD) {
      setTrackingStatus("Move back until shoulders, hips, knees, and ankles stay in frame.");
      setImmediateCue("Hold still while the camera regains a full-body read.", copy.secondaryCue);
      return;
    }

    lastPoseAtRef.current = frameNow;
    setTrackingStatus("Tracking live posture.");
    const state = await validatorRef.current(result, measurementTs, { debounceFrames: 2, bestSide: result.bestSide });
    repMetricsRef.current = state.metrics;
    setRepCount(state.repCount);
    setPhase(state.phase);
    const primaryCue = state.mentorCue?.text || state.cues[0] || copy.liveCue;
    const alternateCue = state.cues[1] || copy.secondaryCue;
    setCadencedCue(primaryCue, alternateCue, true);
  }, [copy.liveCue, copy.secondaryCue, setCadencedCue, setImmediateCue]);

  const queueSessionStart = useCallback(() => {
    if (!cameraReady || cameraError || detectorError) return;
    if (countdownValueRef.current !== null) {
      cancelCountdown();
      return;
    }
    ensureSpeechReady();
    countdownValueRef.current = COUNTDOWN_SECONDS;
    setCountdownValue(COUNTDOWN_SECONDS);
    setImmediateCue(
      `Hold steady. ${copy.label} starts in ${COUNTDOWN_SECONDS}.`,
      framing.state === "ready"
        ? "Stay inside the guide until the countdown clears."
        : "Keep your whole body inside the guide before the first live read.",
    );
    setTrackingStatus(
      framing.state === "ready"
        ? "Full body locked. Hold steady for the countdown."
        : "Starting the countdown. Keep shoulders, hips, knees, and ankles visible.",
    );
  }, [cameraError, cameraReady, cancelCountdown, copy.label, detectorError, framing.state, setImmediateCue]);

  const pause = useCallback(() => {
    if (activeStartPerfRef.current !== null) {
      setElapsedMs(performance.now() - activeStartPerfRef.current);
      activeStartPerfRef.current = null;
    }
    setTrackingStatus("Session paused. Reframe if needed, then resume.");
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
    if (countdownValueRef.current !== null) {
      cancelCountdown();
    }
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
      });
      for (const [index, rep] of repMetricsRef.current.entries()) {
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
  }, [cancelCountdown, elapsedMs, exercise, repCount, syncPending]);

  useEffect(() => { sessionStateRef.current = sessionState; }, [sessionState]);
  useEffect(() => { countdownValueRef.current = countdownValue; }, [countdownValue]);
  useEffect(() => { setVoiceMuted(muted); }, [muted]);
  useEffect(() => {
    scriptedPoseFramesRef.current = scriptedPoseFrames;
    scriptedFrameIndexRef.current = 0;
    scriptedTimestampRef.current = 0;
  }, [scriptedPoseFrames]);
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
      setTrackingStatus(cameraReady ? framing.detail : "Preparing the camera stage.");
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
        setTrackingStatus("Looking for a full-body camera read...");
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
      if (countdownTimerRef.current !== null) window.clearTimeout(countdownTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (engineRef.current) engineRef.current.dispose();
    };
  }, []);

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

    setImmediateCue(
      `Hold steady. ${copy.label} starts in ${countdownValue}.`,
      framing.state === "ready"
        ? "Stay inside the guide until the countdown clears."
        : "Keep your whole body inside the guide before the first live read.",
    );

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
      if (video && engine && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        try {
          const scriptedFrames = scriptedPoseFramesRef.current;
          if (scriptedFrames && sessionStateRef.current === "active" && scriptedFrames.length > 0) {
            const index = Math.min(scriptedFrameIndexRef.current, scriptedFrames.length - 1);
            const scriptedTs = scriptedTimestampRef.current === 0
              ? performance.now()
              : scriptedTimestampRef.current + SCRIPTED_FRAME_INTERVAL_MS;
            scriptedTimestampRef.current = scriptedTs;
            if (scriptedFrameIndexRef.current < scriptedFrames.length - 1) {
              scriptedFrameIndexRef.current += 1;
            }
            await onPose(scriptedFrames[index], scriptedTs);
          } else if (shouldProcessFrame()) {
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
  const primaryActionLabel = countdownValue !== null
    ? "Cancel countdown"
    : sessionState === "paused"
      ? "Resume session"
      : sessionState === "completed"
        ? "Start another session"
        : "Start session";

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
      countdownValue={countdownValue}
      cameraReady={cameraReady}
      hasStageError={Boolean(cameraError) || Boolean(detectorError)}
      muted={muted}
      mirrorVideo={mirrorVideo}
      saving={saving}
      offline={offline}
      pendingWrites={pendingWrites}
      saveNotice={saveNotice}
      primaryActionLabel={primaryActionLabel}
      videoRef={videoRef}
      canvasRef={canvasRef}
      overlayVideo={overlayVideo}
      landmarksRef={landmarksRef}
      onExerciseChange={setExercise}
      onMutedChange={setMuted}
      onMirrorChange={setMirrorVideo}
      onPrimaryAction={sessionState === "active" ? pause : sessionState === "paused" ? resume : queueSessionStart}
      onEndAndSave={() => {
        void endAndSave();
      }}
    />
  );
}





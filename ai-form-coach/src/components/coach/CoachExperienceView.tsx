"use client";

import Link from "next/link";
import React from "react";
import type { CoachCueFeedback } from "@/lib/coach/telemetry";
import type { Landmark3D } from "@/lib/pose/engine";
import type { Exercise } from "@/lib/validators/types";
import CoachCameraChrome from "@/components/coach/CoachCameraChrome";
import { inSessionMicroDisclaimer } from "@/lib/legal/legalContent";
import { useOverlayAutoHide } from "@/components/coach/useOverlayAutoHide";
import { Badge, Button, Card, Icon } from "@/ui/DS";

type SessionState = "idle" | "active" | "paused" | "completed";
type StatusTone = "success" | "warning" | "error";

interface CoachExperienceViewProps {
  exercise: Exercise;
  exerciseLabel: string;
  subtitle: string;
  checklist: readonly string[];
  sessionState: SessionState;
  stageAlert: string;
  cue: string;
  secondaryCue: string;
  repCount: number;
  elapsedLabel: string;
  visibilityLabel: string;
  fpsLabel: string;
  qualityTone: StatusTone;
  qualityLabel: string;
  phaseLabel: string;
  framingTone: StatusTone;
  framingLabel: string;
  framingDetail: string;
  cameraAngleLabel: string;
  cameraAngleDetail: string;
  countdownValue: number | null;
  cameraReady: boolean;
  hasStageError: boolean;
  muted: boolean;
  mirrorVideo: boolean;
  saving: boolean;
  offline: boolean;
  pendingWrites: number;
  saveNotice: string | null;
  deviceSummary: string;
  recoveryTitle: string | null;
  recoverySteps: readonly string[];
  cueFeedback: CoachCueFeedback | null;
  primaryActionLabel: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayVideo: HTMLVideoElement | null;
  landmarksRef: React.MutableRefObject<Landmark3D[] | null>;
  onExerciseChange: (exercise: Exercise) => void;
  onMutedChange: (next: boolean) => void;
  onMirrorChange: (next: boolean) => void;
  onCueFeedback: (feedback: CoachCueFeedback) => void;
  onRetryCamera: () => void;
  onPrimaryAction: () => void;
  onEndAndSave: () => void;
}

export default function CoachExperienceView({
  exercise,
  exerciseLabel,
  subtitle: _subtitle,
  checklist,
  sessionState,
  stageAlert,
  cue,
  secondaryCue,
  repCount,
  elapsedLabel,
  visibilityLabel,
  fpsLabel,
  qualityTone,
  qualityLabel,
  phaseLabel,
  framingTone,
  framingLabel,
  framingDetail,
  cameraAngleLabel,
  cameraAngleDetail,
  countdownValue,
  cameraReady,
  hasStageError,
  muted,
  mirrorVideo,
  saving,
  offline,
  pendingWrites,
  saveNotice,
  deviceSummary,
  recoveryTitle,
  recoverySteps: _recoverySteps,
  cueFeedback,
  primaryActionLabel,
  videoRef,
  canvasRef,
  overlayVideo,
  landmarksRef,
  onExerciseChange,
  onMutedChange,
  onMirrorChange,
  onCueFeedback,
  onRetryCamera,
  onPrimaryAction,
  onEndAndSave,
}: CoachExperienceViewProps) {
  const showCenterPanel = sessionState !== "active";
  const canPrimaryAction = cameraReady && !hasStageError;
  const canEndSession = sessionState === "active" || sessionState === "paused";
  const isCountingDown = countdownValue !== null;
  const showMobileTray = sessionState === "active";
  const showMobileLivePill = sessionState === "active";
  // mobileSessionFocus removed — no longer needed after grid layout restructure
  const showRecoveryGuide = Boolean(recoveryTitle);
  const { visible: overlayVisible, containerProps: overlayContainerProps } = useOverlayAutoHide({
    enabled: sessionState === "active",
    timeout: 3500,
  });
  // CSS transition classes for auto-hide overlay elements
  const overlayTransition = "transition-opacity duration-300";
  const overlayOpacityClass = overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none";
  const pageShellStyle: React.CSSProperties = { paddingTop: "env(safe-area-inset-top)" };
  const pagePaddingClass = showMobileTray
    ? "pb-[calc(6.75rem+env(safe-area-inset-bottom))] md:pb-0"
    : "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0";
  // Rich footer only shows on desktop during active session (live cue + stats + controls).
  // Non-active states use the center panel overlay instead — never render both.
  const richStageFooterClass = sessionState === "active"
    ? `pointer-events-none absolute inset-x-0 bottom-0 z-30 hidden bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent px-3 pb-3 pt-16 sm:px-6 sm:pb-4 md:block ${overlayTransition} ${overlayOpacityClass}`
    : "pointer-events-none absolute inset-x-0 bottom-0 z-30 hidden bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent px-3 pb-3 pt-16 sm:px-6 sm:pb-4";

  return (
    <div data-testid="coach-page-shell" style={pageShellStyle} className={`flex h-full flex-col ${pagePaddingClass}`}>
      {offline && (
        <div data-testid="coach-offline-banner" role="alert" className="flex items-center justify-center gap-2 bg-amber-900/60 px-3 py-1.5 text-xs font-medium text-amber-200">
          <Icon name="alert-circle" className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Offline — {pendingWrites > 0 ? `${pendingWrites} session${pendingWrites === 1 ? "" : "s"} will sync when reconnected` : "sessions will sync when reconnected"}</span>
        </div>
      )}

      {/* Main grid: camera + sidebar */}
      <main className="flex flex-1 overflow-hidden md:grid md:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]">
        {/* Camera area — fills available space */}
        <div data-testid="coach-stage-shell" role="region" aria-label="Camera view" className="relative flex-1 overflow-hidden bg-slate-950" {...overlayContainerProps}>
          {/* Video fill container */}
          <div className="relative h-full w-full">
            <CoachCameraChrome videoRef={videoRef} canvasRef={canvasRef} overlayVideo={overlayVideo} landmarks={null} landmarksRef={landmarksRef} exercise={exercise} showAngles mirrorVideo={mirrorVideo} debug={false} />
          </div>

          {/* All overlays below are direct children of stage-shell (position: relative) */}
          {showCenterPanel && (
              <FramingGuide tone={framingTone} label={framingLabel} detail={framingDetail} countdownValue={countdownValue} />
            )}

            <div className={`pointer-events-none absolute inset-x-2 top-2 z-30 flex items-center justify-between gap-2 sm:inset-x-4 sm:top-4 ${overlayTransition} ${overlayOpacityClass}`}>
              <div className="flex items-center gap-1.5">
                <Badge tone={qualityTone} size="md" className="bg-slate-950/50 text-white backdrop-blur-sm">{qualityLabel}</Badge>
                <Badge tone={framingTone} size="md" className="hidden bg-slate-950/50 text-white backdrop-blur-sm sm:inline-flex">{framingLabel}</Badge>
                <Badge tone="info" size="md" className="hidden bg-slate-950/50 text-white backdrop-blur-sm lg:inline-flex">{exerciseLabel}</Badge>
              </div>
              <div className="pointer-events-auto flex gap-1.5">
                <StageToggle label={mirrorVideo ? "Mirrored" : "Mirror off"} active={mirrorVideo} onClick={() => onMirrorChange(!mirrorVideo)} />
                <StageToggle label={muted ? "Muted" : "Voice on"} active={muted} onClick={() => onMutedChange(!muted)} />
              </div>
            </div>

            {/* Tracking status — only show on desktop or when not in active session on mobile */}
            <div className={`pointer-events-none absolute inset-x-3 top-14 z-30 sm:inset-x-6 sm:top-16 ${overlayTransition} ${overlayOpacityClass} ${sessionState === "active" ? "hidden lg:block" : ""}`}>
              <div data-testid="coach-tracking-status" className="mx-auto max-w-md rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5 text-center text-[11px] font-medium text-white/80 backdrop-blur-sm sm:text-xs">
                {stageAlert}
              </div>
            </div>

            {showCenterPanel && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-center p-2 sm:p-3">
                <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-white shadow-xl backdrop-blur-md sm:max-w-xl sm:rounded-[1.3rem] sm:p-4">
                  {isCountingDown ? (
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div data-testid="coach-countdown" className="text-7xl font-black tracking-tight sm:text-8xl">{countdownValue}</div>
                      <div className="text-sm font-semibold text-slate-200">Hold still — starting soon</div>
                      <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                        <div className="rounded-full bg-slate-950/60 px-3 py-1 font-mono text-xs text-white border border-white/10">{visibilityLabel} VIS</div>
                        <div className="rounded-full bg-slate-950/60 px-3 py-1 font-mono text-xs text-white border border-white/10">{fpsLabel} FPS</div>
                        <Badge tone={framingTone} size="md" className="backdrop-blur">{framingLabel}</Badge>
                      </div>
                      {showRecoveryGuide && (
                        <Button data-testid="coach-retry-camera" size="sm" onClick={onRetryCamera} className="mt-1">
                          <Icon name="camera" className="h-3.5 w-3.5" />
                          Retry camera
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 sm:gap-3">
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge tone={framingTone} size="md">{framingLabel}</Badge>
                          <Badge tone="info" size="md">{sessionState === "completed" ? "Complete" : sessionState === "paused" ? "Paused" : exerciseLabel}</Badge>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-white">
                          <span className="rounded-full bg-slate-950/50 px-2 py-0.5 border border-white/10">{visibilityLabel} VIS</span>
                          <span className="rounded-full bg-slate-950/50 px-2 py-0.5 border border-white/10">{fpsLabel} FPS</span>
                        </div>
                      </div>

                      {/* Exercise selector — single compact row */}
                      <div className="flex items-center gap-2">
                        <select aria-label="Exercise" data-testid="coach-exercise-select" value={exercise} onChange={(event) => onExerciseChange(event.target.value as Exercise)} disabled={sessionState === "paused"} className="rounded-lg border border-white/14 bg-slate-900/80 px-2.5 py-2 text-sm text-white outline-none focus:border-sky-400 disabled:opacity-50">
                          <option value="squat">Squat</option>
                          <option value="pushup">Pushup</option>
                          <option value="plank">Plank</option>
                        </select>
                        <span data-testid="coach-camera-setup" className="flex-1 text-[11px] text-slate-300 leading-tight">
                          {cameraAngleLabel}: {cameraAngleDetail}
                        </span>
                      </div>

                      {/* Recovery (only when camera has issues) */}
                      {showRecoveryGuide && (
                        <div data-testid="coach-recovery-guide" className="flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-400/8 px-2.5 py-2 text-xs text-white">
                          <Badge tone="warning" size="md">Camera issue</Badge>
                          <span className="flex-1 truncate text-slate-300">{recoveryTitle}</span>
                          <Button data-testid="coach-retry-camera" size="sm" onClick={onRetryCamera}>
                            <Icon name="camera" className="h-3.5 w-3.5" />
                            Retry
                          </Button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button data-testid="coach-primary-action" size="lg" onClick={onPrimaryAction} disabled={!canPrimaryAction} className="flex-1">
                          <Icon name={sessionState === "paused" ? "play" : "target"} className="h-4 w-4" />
                          {primaryActionLabel}
                        </Button>
                        <Button variant="secondary" size="lg" onClick={onEndAndSave} disabled={!canEndSession || saving} className="flex-1 border-white/14 bg-white/6 text-white hover:bg-white/10">
                          <Icon name="save" className="h-4 w-4" />
                          {saving ? "Saving..." : "End & save"}
                        </Button>
                        {sessionState === "completed" && (
                          <Link href="/history" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/14 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                            <Icon name="chart" className="h-4 w-4" />
                            History
                          </Link>
                        )}
                      </div>

                      {/* Post-session feedback — compact inline */}
                      {sessionState === "completed" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Feedback:</span>
                          <FeedbackChoice testId="coach-feedback-clear" label="Clear" selected={cueFeedback === "clear"} onClick={() => onCueFeedback("clear")} />
                          <FeedbackChoice testId="coach-feedback-calmer" label="Calmer" selected={cueFeedback === "calmer"} onClick={() => onCueFeedback("calmer")} />
                          <FeedbackChoice testId="coach-feedback-clearer" label="Clearer" selected={cueFeedback === "clearer"} onClick={() => onCueFeedback("clearer")} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {showMobileLivePill && (
              <div data-testid="coach-mobile-live-pill" className="pointer-events-none absolute inset-x-3 top-14 z-30 lg:hidden sm:inset-x-6">
                <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div data-testid="coach-mobile-live-cue" aria-live="polite" className="min-w-0 flex-1 truncate text-xs font-semibold">{cue}</div>
                    <div className="flex shrink-0 gap-2 text-[10px] font-bold">
                      <span data-testid="coach-mobile-rep-count">{repCount} {exercise === "plank" ? "holds" : "reps"}</span>
                      <span data-testid="coach-mobile-elapsed" className="text-slate-300">{elapsedLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div data-testid="coach-stage-rich-footer" className={richStageFooterClass}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                <div className="max-w-3xl rounded-[1.5rem] border border-white/14 bg-slate-950/72 px-4 py-4 text-white backdrop-blur sm:rounded-[1.7rem] sm:px-5 sm:py-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                    <span>Live coach</span>
                    <span className="hidden rounded-full bg-white/8 px-2 py-1 text-[10px] sm:inline-flex">{phaseLabel}</span>
                  </div>
                  <div data-testid="coach-live-cue" aria-live="polite" className="mt-2 text-base font-semibold leading-6 sm:text-2xl sm:leading-7">{cue}</div>
                  <div className="mt-2 text-sm leading-5 text-slate-300 sm:text-base sm:leading-6">{secondaryCue}</div>
                </div>

                <div className="hidden pointer-events-auto flex-col gap-3 lg:flex xl:min-w-[28rem]">
                  <div className="grid gap-2 sm:grid-cols-4">
                    <SummaryChip testId="coach-footer-rep-count" label={exercise === "plank" ? "Holds" : "Reps"} value={`${repCount}`} icon="target" />
                    <SummaryChip label="Elapsed" value={elapsedLabel} icon="clock" />
                    <SummaryChip label="Visibility" value={visibilityLabel} icon="camera" />
                    <SummaryChip label="FPS" value={fpsLabel} icon="activity" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {sessionState === "active" && (
                      <Button data-testid="coach-footer-primary-action" size="lg" onClick={onPrimaryAction} className="min-w-[10rem]">
                        <Icon name="pause" className="h-4 w-4" />
                        Pause
                      </Button>
                    )}
                    <Button data-testid="coach-footer-session-save" variant="secondary" size="lg" onClick={onEndAndSave} disabled={!canEndSession || saving} className="min-w-[10rem] border-white/14 bg-white/6 text-white hover:bg-white/10">
                      <Icon name="save" className="h-4 w-4" />
                      {saving ? "Saving..." : "End & save"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div
              data-testid="coach-micro-disclaimer"
              className="pointer-events-none absolute inset-x-0 bottom-1 z-20 flex justify-center px-3"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/85 backdrop-blur-sm">
                {inSessionMicroDisclaimer}
              </span>
            </div>
          </div>
        {/* end camera area */}

        {/* Sidebar — hidden on mobile, scrollable on tablet+ */}
        <aside data-testid="coach-sidebar" aria-label="Session controls" className="hidden overflow-y-auto border-l border-white/10 bg-slate-900/80 md:block">
          <div className="flex flex-col gap-4 p-4">
            {/* Session header */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Live coach</div>
              <h2 className="mt-1 text-lg font-black tracking-tight text-white">{exerciseLabel}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={qualityTone} size="md">{qualityLabel}</Badge>
                <Badge tone={framingTone} size="md">{framingLabel}</Badge>
              </div>
            </div>

            {/* Exercise selector */}
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <label htmlFor="sidebar-exercise-select" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Exercise</label>
              <select id="sidebar-exercise-select" data-testid="coach-sidebar-exercise-select" value={exercise} onChange={(event) => onExerciseChange(event.target.value as Exercise)} disabled={sessionState === "paused"} className="w-full rounded-lg border border-white/14 bg-slate-900/80 px-2.5 py-2 text-sm text-white outline-none focus:border-sky-400 disabled:opacity-50">
                <option value="squat">Squat</option>
                <option value="pushup">Pushup</option>
                <option value="plank">Plank</option>
              </select>
            </div>

            {/* Session stats */}
            <div className="grid grid-cols-2 gap-2">
              <SummaryChip testId="coach-sidebar-rep-count" label={exercise === "plank" ? "Holds" : "Reps"} value={`${repCount}`} icon="target" />
              <SummaryChip label="Elapsed" value={elapsedLabel} icon="clock" />
              <SummaryChip label="Visibility" value={visibilityLabel} icon="camera" />
              <SummaryChip label="FPS" value={fpsLabel} icon="activity" />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {canPrimaryAction && (
                <Button data-testid="coach-sidebar-primary-action" size="lg" onClick={onPrimaryAction} className="w-full">
                  <Icon name={sessionState === "active" ? "pause" : sessionState === "paused" ? "play" : "target"} className="h-4 w-4" />
                  {primaryActionLabel}
                </Button>
              )}
              <Button data-testid="coach-sidebar-session-save" variant="secondary" size="lg" onClick={onEndAndSave} disabled={!canEndSession || saving} className="w-full border-white/14 bg-white/6 text-white hover:bg-white/10">
                <Icon name="save" className="h-4 w-4" />
                {saving ? "Saving..." : "End & save"}
              </Button>
              {sessionState === "completed" && (
                <Link href="/history" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/14 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  <Icon name="chart" className="h-4 w-4" />
                  View History
                </Link>
              )}
            </div>

            {/* Post-session feedback */}
            {sessionState === "completed" && (
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Feedback</div>
                <div className="flex gap-2">
                  <FeedbackChoice testId="coach-sidebar-feedback-clear" label="Clear" selected={cueFeedback === "clear"} onClick={() => onCueFeedback("clear")} />
                  <FeedbackChoice testId="coach-sidebar-feedback-calmer" label="Calmer" selected={cueFeedback === "calmer"} onClick={() => onCueFeedback("calmer")} />
                  <FeedbackChoice testId="coach-sidebar-feedback-clearer" label="Clearer" selected={cueFeedback === "clearer"} onClick={() => onCueFeedback("clearer")} />
                </div>
              </div>
            )}

            {/* Recovery guide */}
            {showRecoveryGuide && (
              <div data-testid="coach-sidebar-recovery" className="rounded-xl border border-amber-300/30 bg-amber-400/8 p-3">
                <Badge tone="warning" size="md">Camera issue</Badge>
                <p className="mt-1.5 text-xs text-slate-300">{recoveryTitle}</p>
                <Button data-testid="coach-sidebar-retry-camera" size="sm" onClick={onRetryCamera} className="mt-2">
                  <Icon name="camera" className="h-3.5 w-3.5" />
                  Retry camera
                </Button>
              </div>
            )}

            <hr className="border-white/10" />

            {/* Framing notes */}
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Framing notes</div>
              <ul className="space-y-2 text-sm leading-6 text-slate-300">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-2"><span className="mt-0.5 text-teal-400"><Icon name="check-circle" className="h-4 w-4" /></span><span>{item}</span></li>
                ))}
              </ul>
            </div>

            {/* Camera setup info */}
            <div className="text-xs text-slate-500">
              <span>{cameraAngleLabel}: {cameraAngleDetail}</span>
              <br />
              <span>{deviceSummary}</span>
            </div>

            {/* Nav links */}
            <div className="flex flex-wrap gap-2">
              <Link href="/history" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5">
                <Icon name="chart" className="h-3.5 w-3.5" />
                History
              </Link>
              <Link href="/privacy" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5">
                <Icon name="lock" className="h-3.5 w-3.5" />
                Privacy
              </Link>
            </div>

            {/* Sync status */}
            {(offline || pendingWrites > 0 || saveNotice) && (
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-400">
                {offline ? `Offline mode. ${pendingWrites} write${pendingWrites === 1 ? "" : "s"} queued.` : pendingWrites > 0 ? `${pendingWrites} buffered write${pendingWrites === 1 ? "" : "s"} pending.` : null}
                {saveNotice && <p className="mt-1 text-teal-400">{saveNotice}</p>}
              </div>
            )}
          </div>
        </aside>
      </main>
      {/* end grid */}

      {/* Mobile tray — fixed at bottom during active session */}
      {showMobileTray && (
        <div data-testid="coach-mobile-tray" className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 px-4 md:hidden">
          <div className="mx-auto max-w-md">
            <Card className="rounded-[1.45rem] border border-white/10 bg-slate-950/86 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.7)] backdrop-blur" padding="sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button data-testid="coach-mobile-primary-action" size="lg" onClick={onPrimaryAction} className="w-full">
                  <Icon name="pause" className="h-4 w-4" />
                  Pause
                </Button>
                <Button data-testid="coach-mobile-session-save" variant="secondary" size="lg" onClick={onEndAndSave} disabled={!canEndSession || saving} className="w-full">
                  <Icon name="save" className="h-4 w-4" />
                  {saving ? "Saving..." : "End & save"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function FramingGuide({ tone, label, detail: _detail, countdownValue }: { tone: StatusTone; label: string; detail: string; countdownValue: number | null }) {
  const ringClass = tone === "success"
    ? "border-emerald-300/50 bg-emerald-400/4"
    : tone === "warning"
      ? "border-amber-300/50 bg-amber-400/4"
      : "border-white/12 bg-transparent";

  return (
    <div data-testid="coach-framing-guide" className="pointer-events-none absolute inset-0 z-25 flex items-center justify-center p-4 sm:p-6">
      {/* Lightweight body outline — no background fill, just corner brackets */}
      <div className={`relative h-[68%] w-[min(18rem,72vw)] max-w-[20rem] rounded-[1.6rem] border ${ringClass} sm:h-[70%] sm:rounded-[2rem]`}>
        {/* Corner brackets only */}
        <div className="absolute left-3 top-3 h-7 w-7 rounded-tl-[0.8rem] border-l-2 border-t-2 border-white/50 sm:left-4 sm:top-4 sm:h-9 sm:w-9 sm:rounded-tl-[1rem]" />
        <div className="absolute right-3 top-3 h-7 w-7 rounded-tr-[0.8rem] border-r-2 border-t-2 border-white/50 sm:right-4 sm:top-4 sm:h-9 sm:w-9 sm:rounded-tr-[1rem]" />
        <div className="absolute bottom-3 left-3 h-7 w-7 rounded-bl-[0.8rem] border-b-2 border-l-2 border-white/50 sm:bottom-4 sm:left-4 sm:h-9 sm:w-9 sm:rounded-bl-[1rem]" />
        <div className="absolute bottom-3 right-3 h-7 w-7 rounded-br-[0.8rem] border-b-2 border-r-2 border-white/50 sm:bottom-4 sm:right-4 sm:h-9 sm:w-9 sm:rounded-br-[1rem]" />
        {/* Minimal status pill at bottom of outline */}
        <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
          <div className="rounded-full border border-white/12 bg-slate-950/50 px-3 py-1.5 text-center text-white backdrop-blur-sm">
            <div className="text-xs font-semibold sm:text-sm">{countdownValue !== null ? `Starting in ${countdownValue}` : label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition sm:text-xs ${active ? "border-sky-400 bg-sky-500/18 text-sky-100" : "border-white/14 bg-slate-950/68 text-slate-200 hover:bg-slate-900"}`}>
      {label}
    </button>
  );
}

function SummaryChip({ label, value, icon, testId }: { label: string; value: string; icon: "target" | "clock" | "camera" | "activity"; testId?: string }) {
  return (
    <div data-testid={testId} className="rounded-[1.2rem] border border-white/14 bg-slate-950/68 px-4 py-3 text-white backdrop-blur">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"><Icon name={icon} className="h-4 w-4" />{label}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
    </div>
  );
}

function FeedbackChoice({ testId, label, selected, onClick }: { testId: string; label: string; selected: boolean; onClick: () => void }) {
  return (
    <Button
      data-testid={testId}
      type="button"
      size="sm"
      variant={selected ? "primary" : "secondary"}
      aria-pressed={selected}
      data-selected={selected ? "true" : "false"}
      onClick={onClick}
      className={selected ? "justify-center" : "justify-center border-white/14 bg-white/6 text-white hover:bg-white/10"}
    >
      {label}
    </Button>
  );
}

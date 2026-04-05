"use client";

import Link from "next/link";
import React from "react";
import type { CoachCueFeedback } from "@/lib/coach/telemetry";
import type { Landmark3D } from "@/lib/pose/engine";
import type { Exercise } from "@/lib/validators/types";
import CoachCameraChrome from "@/components/coach/CoachCameraChrome";
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
  subtitle,
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
  recoverySteps,
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
  const mobileSessionFocus = sessionState !== "idle";
  const showRecoveryGuide = Boolean(recoveryTitle);
  const pageShellStyle: React.CSSProperties = { paddingTop: "env(safe-area-inset-top)" };
  const pagePaddingClass = showMobileTray
    ? "pb-[calc(6.75rem+env(safe-area-inset-bottom))] lg:pb-8"
    : "pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8";
  const contentShellClass = mobileSessionFocus
    ? "mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-8"
    : "mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8";
  const heroHeaderClass = mobileSessionFocus
    ? "mb-4 hidden flex-col gap-4 lg:mb-5 lg:flex lg:flex-row lg:items-end lg:justify-between"
    : "mb-4 flex flex-col gap-4 lg:mb-5 lg:flex-row lg:items-end lg:justify-between";
  const stageShellPaddingClass = mobileSessionFocus ? "p-1.5 sm:p-3 sm:pb-3 lg:p-4" : "p-2 sm:p-3 sm:pb-3 lg:p-4";
  const stageAspectClass = mobileSessionFocus
    ? "aspect-[9/15] w-full sm:aspect-[10/16] md:aspect-[16/10] xl:aspect-[16/8.8]"
    : "aspect-[9/14.2] w-full sm:aspect-[10/16] md:aspect-[16/10] xl:aspect-[16/8.8]";
  // Rich footer only shows on desktop during active session (live cue + stats + controls).
  // Non-active states use the center panel overlay instead — never render both.
  const richStageFooterClass = sessionState === "active"
    ? "pointer-events-none absolute inset-x-0 bottom-0 z-30 hidden bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent px-3 pb-3 pt-16 sm:px-6 sm:pb-4 lg:block"
    : "pointer-events-none absolute inset-x-0 bottom-0 z-30 hidden bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent px-3 pb-3 pt-16 sm:px-6 sm:pb-4";
  const supportRailsClass = mobileSessionFocus
    ? "mt-4 hidden gap-3 lg:grid lg:grid-cols-[1.05fr_1fr_1fr]"
    : "mt-4 grid gap-3 lg:grid-cols-[1.05fr_1fr_1fr]";

  return (
    <div data-testid="coach-page-shell" style={pageShellStyle} className={`min-h-screen min-h-[100dvh] bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.2),_transparent_28%),linear-gradient(180deg,_#ecfeff_0%,_#f8fafc_36%,_#ffffff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_42%,_#020617_100%)] ${pagePaddingClass}`}>
      {offline && (
        <div data-testid="coach-offline-banner" className="mx-4 mb-2 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 sm:mx-6 lg:mx-8">
          <Icon name="alert-circle" className="h-4 w-4 flex-shrink-0" />
          <span>Offline — {pendingWrites > 0 ? `${pendingWrites} session${pendingWrites === 1 ? "" : "s"} will sync when reconnected` : "sessions will sync when reconnected"}</span>
        </div>
      )}
      <div className={contentShellClass}>
        {mobileSessionFocus ? (
          <div data-testid="coach-mobile-session-header" className="mb-3 flex items-center justify-between gap-3 lg:hidden">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Live coach</div>
              <h1 className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white">{exerciseLabel} session</h1>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge tone={qualityTone} size="md" className="bg-white/80 backdrop-blur dark:bg-slate-950/72">{qualityLabel}</Badge>
              <Badge tone={framingTone} size="md" className="bg-white/80 backdrop-blur dark:bg-slate-950/72">{framingLabel}</Badge>
            </div>
          </div>
        ) : null}

        <div className={heroHeaderClass}>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-200 sm:text-xs">
              <Icon name="lock" className="h-4 w-4" />
              Private motion coaching beta
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">Set the frame, count down, then move.</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:leading-7 sm:text-base">The beta coach frames first, counts you in, and keeps the live loop calmer once movement starts. The stage should feel like the product, not a diagnostic screen.</p>
            </div>
          </div>
          <div className="hidden flex-wrap gap-2 sm:flex">
            <ActionLink href="/history" icon="chart" label="History" />
            <ActionLink href="/pricing" icon="package" label="Beta" />
            <ActionLink href="/privacy" icon="lock" label="Privacy" />
          </div>
        </div>

        <div data-testid="coach-stage-shell" className={`rounded-[2.2rem] border border-white/60 bg-white/80 shadow-[0_40px_140px_-60px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/72 sm:rounded-[2.5rem] ${stageShellPaddingClass}`}>
          <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 ring-1 ring-white/10 sm:rounded-[2rem]">
            <div className={stageAspectClass}>
              <CoachCameraChrome videoRef={videoRef} canvasRef={canvasRef} overlayVideo={overlayVideo} landmarks={null} landmarksRef={landmarksRef} mirrorVideo={mirrorVideo} debug={false} />
            </div>

            {showCenterPanel ? (
              <FramingGuide tone={framingTone} label={framingLabel} detail={framingDetail} countdownValue={countdownValue} />
            ) : null}

            <div className="pointer-events-none absolute inset-x-2 top-2 z-30 flex items-center justify-between gap-2 sm:inset-x-4 sm:top-4">
              <div className="flex items-center gap-1.5">
                <Badge tone={qualityTone} size="md" className="bg-slate-950/50 text-white backdrop-blur-sm dark:bg-slate-950/50 dark:text-white">{qualityLabel}</Badge>
                <Badge tone={framingTone} size="md" className="hidden bg-slate-950/50 text-white backdrop-blur-sm dark:bg-slate-950/50 dark:text-white sm:inline-flex">{framingLabel}</Badge>
                <Badge tone="info" size="md" className="hidden bg-slate-950/50 text-white backdrop-blur-sm dark:bg-slate-950/50 dark:text-white lg:inline-flex">{exerciseLabel}</Badge>
              </div>
              <div className="pointer-events-auto flex gap-1.5">
                <StageToggle label={mirrorVideo ? "Mirrored" : "Mirror off"} active={mirrorVideo} onClick={() => onMirrorChange(!mirrorVideo)} />
                <StageToggle label={muted ? "Muted" : "Voice on"} active={muted} onClick={() => onMutedChange(!muted)} />
              </div>
            </div>

            {/* Tracking status — only show on desktop or when not in active session on mobile */}
            <div className={`pointer-events-none absolute inset-x-3 top-14 z-30 sm:inset-x-6 sm:top-16 ${sessionState === "active" ? "hidden lg:block" : ""}`}>
              <div data-testid="coach-tracking-status" className="mx-auto max-w-md rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5 text-center text-[11px] font-medium text-white/80 backdrop-blur-sm sm:text-xs">
                {stageAlert}
              </div>
            </div>

            {showCenterPanel ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-center p-2 sm:p-3">
                <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-white shadow-xl backdrop-blur-md sm:max-w-xl sm:rounded-[1.3rem] sm:p-4">
                  {isCountingDown ? (
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div data-testid="coach-countdown" className="text-7xl font-black tracking-tight sm:text-8xl">{countdownValue}</div>
                      <div className="text-sm font-semibold text-slate-200">Hold still — starting soon</div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{visibilityLabel} vis</span>
                        <span>{fpsLabel} fps</span>
                        <Badge tone={framingTone} size="md">{framingLabel}</Badge>
                      </div>
                      {showRecoveryGuide ? (
                        <Button data-testid="coach-retry-camera" size="sm" onClick={onRetryCamera} className="mt-1">
                          <Icon name="camera" className="h-3.5 w-3.5" />
                          Retry camera
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 sm:gap-3">
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge tone={framingTone} size="md">{framingLabel}</Badge>
                          <Badge tone="info" size="md">{sessionState === "completed" ? "Complete" : sessionState === "paused" ? "Paused" : exerciseLabel}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{visibilityLabel} vis</span>
                          <span>{fpsLabel} fps</span>
                        </div>
                      </div>

                      {/* Exercise selector — single compact row */}
                      <div className="flex items-center gap-2">
                        <select data-testid="coach-exercise-select" value={exercise} onChange={(event) => onExerciseChange(event.target.value as Exercise)} disabled={sessionState === "paused"} className="rounded-lg border border-white/14 bg-slate-900/80 px-2.5 py-2 text-sm text-white outline-none focus:border-sky-400 disabled:opacity-50">
                          <option value="squat">Squat</option>
                          <option value="pushup">Pushup</option>
                          <option value="plank">Plank</option>
                        </select>
                        <span data-testid="coach-camera-setup" className="flex-1 truncate text-[11px] text-slate-400">
                          {cameraAngleLabel}: {cameraAngleDetail}
                        </span>
                      </div>

                      {/* Recovery (only when camera has issues) */}
                      {showRecoveryGuide ? (
                        <div data-testid="coach-recovery-guide" className="flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-400/8 px-2.5 py-2 text-xs text-white">
                          <Badge tone="warning" size="md">Camera issue</Badge>
                          <span className="flex-1 truncate text-slate-300">{recoveryTitle}</span>
                          <Button data-testid="coach-retry-camera" size="sm" onClick={onRetryCamera}>
                            <Icon name="camera" className="h-3.5 w-3.5" />
                            Retry
                          </Button>
                        </div>
                      ) : null}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button data-testid="coach-primary-action" size="lg" onClick={onPrimaryAction} disabled={!canPrimaryAction} className="flex-1">
                          <Icon name={sessionState === "paused" ? "play" : "target"} className="h-4 w-4" />
                          {primaryActionLabel}
                        </Button>
                        <Button variant="secondary" size="lg" onClick={onEndAndSave} disabled={!canEndSession || saving} className="flex-1 border-white/14 bg-white/6 text-white hover:bg-white/10 dark:border-white/14 dark:bg-white/6 dark:text-white dark:hover:bg-white/10">
                          <Icon name="save" className="h-4 w-4" />
                          {saving ? "Saving..." : "End & save"}
                        </Button>
                        {sessionState === "completed" ? (
                          <Link href="/history" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/14 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                            <Icon name="chart" className="h-4 w-4" />
                            History
                          </Link>
                        ) : null}
                      </div>

                      {/* Post-session feedback — compact inline */}
                      {sessionState === "completed" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Feedback:</span>
                          <FeedbackChoice testId="coach-feedback-clear" label="Clear" selected={cueFeedback === "clear"} onClick={() => onCueFeedback("clear")} />
                          <FeedbackChoice testId="coach-feedback-calmer" label="Calmer" selected={cueFeedback === "calmer"} onClick={() => onCueFeedback("calmer")} />
                          <FeedbackChoice testId="coach-feedback-clearer" label="Clearer" selected={cueFeedback === "clearer"} onClick={() => onCueFeedback("clearer")} />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {showMobileLivePill ? (
              <div data-testid="coach-mobile-live-pill" className="pointer-events-none absolute inset-x-3 top-14 z-30 lg:hidden sm:inset-x-6">
                <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div data-testid="coach-mobile-live-cue" className="min-w-0 flex-1 truncate text-xs font-semibold">{cue}</div>
                    <div className="flex shrink-0 gap-2 text-[10px] font-bold">
                      <span data-testid="coach-mobile-rep-count">{repCount} {exercise === "plank" ? "holds" : "reps"}</span>
                      <span data-testid="coach-mobile-elapsed" className="text-slate-300">{elapsedLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div data-testid="coach-stage-rich-footer" className={richStageFooterClass}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                <div className="max-w-3xl rounded-[1.5rem] border border-white/14 bg-slate-950/72 px-4 py-4 text-white backdrop-blur sm:rounded-[1.7rem] sm:px-5 sm:py-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                    <span>Live coach</span>
                    <span className="hidden rounded-full bg-white/8 px-2 py-1 text-[10px] sm:inline-flex">{phaseLabel}</span>
                  </div>
                  <div data-testid="coach-live-cue" className="mt-2 text-base font-semibold leading-6 sm:text-2xl sm:leading-7">{cue}</div>
                  <div className="mt-2 text-sm leading-5 text-slate-300 sm:text-base sm:leading-6">{secondaryCue}</div>
                </div>

                <div className="hidden pointer-events-auto flex-col gap-3 lg:flex xl:min-w-[28rem]">
                  <div className="grid gap-2 sm:grid-cols-4">
                    <SummaryChip testId="coach-rep-count" label={exercise === "plank" ? "Holds" : "Reps"} value={`${repCount}`} icon="target" />
                    <SummaryChip label="Elapsed" value={elapsedLabel} icon="clock" />
                    <SummaryChip label="Visibility" value={visibilityLabel} icon="camera" />
                    <SummaryChip label="FPS" value={fpsLabel} icon="activity" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {sessionState === "active" ? (
                      <Button data-testid="coach-primary-action" size="lg" onClick={onPrimaryAction} className="min-w-[10rem]">
                        <Icon name="pause" className="h-4 w-4" />
                        Pause
                      </Button>
                    ) : null}
                    <Button data-testid="coach-session-save" variant="secondary" size="lg" onClick={onEndAndSave} disabled={!canEndSession || saving} className="min-w-[10rem] border-white/14 bg-white/6 text-white hover:bg-white/10 dark:border-white/14 dark:bg-white/6 dark:text-white dark:hover:bg-white/10">
                      <Icon name="save" className="h-4 w-4" />
                      {saving ? "Saving..." : "End & save"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showMobileTray ? (
          <div data-testid="coach-mobile-tray" className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 px-4 lg:hidden">
            <div className="mx-auto max-w-md">
              <Card className="rounded-[1.45rem] border border-white/60 bg-white/92 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.7)] backdrop-blur dark:border-white/10 dark:bg-slate-950/86" padding="sm">
                <div className="grid grid-cols-2 gap-2">
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
        ) : null}
        <div data-testid="coach-support-rails" className={supportRailsClass}>
          <Card className="rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70" padding="lg">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Session pulse</div>
              <div className="text-xl font-black text-slate-950 dark:text-white">The coach should feel calm before motion starts and quiet once tracking locks.</div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{offline ? `Offline mode active. ${pendingWrites} write${pendingWrites === 1 ? "" : "s"} waiting to sync.` : pendingWrites > 0 ? `${pendingWrites} buffered write${pendingWrites === 1 ? " is" : "s are"} waiting to flush.` : "No buffered writes. The coach path is clean right now."}</p>
              {saveNotice ? <p className="text-sm leading-7 text-teal-700 dark:text-teal-300">{saveNotice}</p> : null}
            </div>
          </Card>

          <Card className="rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70" padding="lg">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Framing notes</div>
              <div className="text-xl font-black text-slate-950 dark:text-white">Give the camera one clean full-body read before the first cue loop starts.</div>
              <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-3"><span className="mt-1 text-teal-600 dark:text-teal-300"><Icon name="check-circle" className="h-4 w-4" /></span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70" padding="lg">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Beta boundaries</div>
              <div className="text-xl font-black text-slate-950 dark:text-white">This beta only does one job in the live loop.</div>
              <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="cpu" className="h-4 w-4" /></span><span>Browser pose tracking only. No cloud LLM is sitting inside the live coaching path.</span></li>
                <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="message" className="h-4 w-4" /></span><span>Voice uses human-authored guidance with browser speech fallback.</span></li>
                <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="chart" className="h-4 w-4" /></span><span>History should only reflect real sessions from this coach surface.</span></li>
                <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="camera" className="h-4 w-4" /></span><span>Device check: {deviceSummary}</span></li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FramingGuide({ tone, label, detail, countdownValue }: { tone: StatusTone; label: string; detail: string; countdownValue: number | null }) {
  const ringClass = tone === "success"
    ? "border-emerald-300/50 bg-emerald-400/4"
    : tone === "warning"
      ? "border-amber-300/50 bg-amber-400/4"
      : "border-white/12 bg-transparent";

  return (
    <div data-testid="coach-framing-guide" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6">
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

function SummaryChip({ label, value, icon, compact = false, testId }: { label: string; value: string; icon: "target" | "clock" | "camera" | "activity"; compact?: boolean; testId?: string }) {
  return (
    <div data-testid={testId} className={`rounded-[1.2rem] border border-white/14 bg-slate-950/68 text-white backdrop-blur ${compact ? "px-3 py-3" : "px-4 py-3"}`}>
      <div className={`flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-slate-300 ${compact ? "text-[10px]" : "text-[11px]"}`}><Icon name={icon} className="h-4 w-4" />{label}</div>
      <div className={`mt-2 font-black ${compact ? "text-lg" : "text-xl"}`}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div data-testid={testId} className="min-w-[4.5rem] rounded-2xl border border-white/12 bg-white/6 px-2.5 py-2 text-center">
      <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
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
      className={selected ? "justify-center" : "justify-center border-white/14 bg-white/6 text-white hover:bg-white/10 dark:border-white/14 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"}
    >
      {label}
    </Button>
  );
}


function ActionLink({ href, icon, label }: { href: string; icon: "chart" | "package" | "lock"; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-950/72 dark:text-slate-200 dark:hover:border-sky-800 dark:hover:text-sky-200">
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </Link>
  );
}







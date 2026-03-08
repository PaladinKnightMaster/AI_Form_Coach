"use client";

import Link from "next/link";
import React from "react";
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
  countdownValue: number | null;
  cameraReady: boolean;
  hasStageError: boolean;
  muted: boolean;
  mirrorVideo: boolean;
  saving: boolean;
  offline: boolean;
  pendingWrites: number;
  saveNotice: string | null;
  primaryActionLabel: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayVideo: HTMLVideoElement | null;
  landmarksRef: React.MutableRefObject<Landmark3D[] | null>;
  onExerciseChange: (exercise: Exercise) => void;
  onMutedChange: (next: boolean) => void;
  onMirrorChange: (next: boolean) => void;
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
  countdownValue,
  cameraReady,
  hasStageError,
  muted,
  mirrorVideo,
  saving,
  offline,
  pendingWrites,
  saveNotice,
  primaryActionLabel,
  videoRef,
  canvasRef,
  overlayVideo,
  landmarksRef,
  onExerciseChange,
  onMutedChange,
  onMirrorChange,
  onPrimaryAction,
  onEndAndSave,
}: CoachExperienceViewProps) {
  const showCenterPanel = sessionState !== "active";
  const canPrimaryAction = cameraReady && !hasStageError;
  const canEndSession = sessionState === "active" || sessionState === "paused";
  const isCountingDown = countdownValue !== null;
  const showMobileTray = sessionState === "active";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.2),_transparent_28%),linear-gradient(180deg,_#ecfeff_0%,_#f8fafc_36%,_#ffffff_100%)] pb-[calc(5rem+env(safe-area-inset-bottom))] dark:bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_42%,_#020617_100%)] lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-4 flex flex-col gap-4 lg:mb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-200 sm:text-xs">
              <Icon name="lock" className="h-4 w-4" />
              Private motion coaching beta
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">A cleaner camera ritual before the first rep.</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:leading-7 sm:text-base">The coach now frames first, counts you in, and keeps the live loop calmer once movement starts. The stage should feel like a product surface, not a diagnostic screen.</p>
            </div>
          </div>
          <div className="hidden flex-wrap gap-2 sm:flex">
            <ActionLink href="/history" icon="chart" label="History" />
            <ActionLink href="/pricing" icon="package" label="Beta" />
            <ActionLink href="/privacy" icon="lock" label="Privacy" />
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-white/60 bg-white/80 p-2 shadow-[0_40px_140px_-60px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/72 sm:rounded-[2.5rem] sm:p-3 sm:pb-3 lg:p-4">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 ring-1 ring-white/10 sm:rounded-[2rem]">
            <div className="aspect-[9/14.2] w-full sm:aspect-[10/16] md:aspect-[16/10] xl:aspect-[16/8.8]">
              <CoachCameraChrome videoRef={videoRef} canvasRef={canvasRef} overlayVideo={overlayVideo} landmarks={null} landmarksRef={landmarksRef} mirrorVideo={mirrorVideo} debug={false} />
            </div>

            {showCenterPanel ? (
              <FramingGuide tone={framingTone} label={framingLabel} detail={framingDetail} countdownValue={countdownValue} />
            ) : null}

            <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex flex-wrap items-start justify-between gap-2 sm:inset-x-6 sm:top-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={qualityTone} size="md" className="bg-slate-950/72 text-white backdrop-blur dark:bg-slate-950/72 dark:text-white">{qualityLabel}</Badge>
                <Badge tone={framingTone} size="md" className="bg-slate-950/72 text-white backdrop-blur dark:bg-slate-950/72 dark:text-white">{framingLabel}</Badge>
                <Badge tone="info" size="md" className="bg-slate-950/72 text-white backdrop-blur dark:bg-slate-950/72 dark:text-white">{exerciseLabel}</Badge>
                <Badge tone="neutral" size="md" className="hidden bg-slate-950/72 text-white backdrop-blur dark:bg-slate-950/72 dark:text-white sm:inline-flex">{phaseLabel}</Badge>
              </div>
              <div className="pointer-events-auto flex flex-wrap gap-2">
                <StageToggle label={mirrorVideo ? "Mirrored" : "Mirror off"} active={mirrorVideo} onClick={() => onMirrorChange(!mirrorVideo)} />
                <StageToggle label={muted ? "Muted" : "Voice on"} active={muted} onClick={() => onMutedChange(!muted)} />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-3 top-20 z-30 sm:inset-x-6 sm:top-24">
              <div data-testid="coach-tracking-status" className="mx-auto max-w-2xl rounded-full border border-white/12 bg-slate-950/66 px-4 py-3 text-center text-xs font-medium text-white backdrop-blur sm:text-sm">
                {stageAlert}
              </div>
            </div>

            {showCenterPanel ? (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6">
                <div className="pointer-events-auto w-full max-w-2xl rounded-[1.7rem] border border-white/14 bg-slate-950/78 p-4 text-white shadow-2xl backdrop-blur sm:rounded-[2rem] sm:p-6">
                  {isCountingDown ? (
                    <div className="space-y-4 sm:space-y-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={framingTone} size="md">{framingLabel}</Badge>
                        <Badge tone="info" size="md">Countdown live</Badge>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr] lg:gap-4">
                        <div className="rounded-[1.4rem] border border-white/14 bg-white/6 px-4 py-4 sm:rounded-[1.6rem] sm:px-5 sm:py-5">
                          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Starting now</div>
                          <div data-testid="coach-countdown" className="mt-3 text-6xl font-black tracking-tight sm:text-8xl">{countdownValue}</div>
                          <div className="mt-3 text-lg font-semibold sm:text-xl">Hold your setup. The live coach begins as soon as the number clears.</div>
                          <p className="mt-2 text-sm leading-6 text-slate-300 sm:leading-7">Stay still, keep the full body inside the guide, and let the first posture read happen cleanly.</p>
                        </div>
                        <div className="rounded-[1.4rem] border border-white/14 bg-white/6 px-4 py-4 sm:rounded-[1.6rem] sm:px-5 sm:py-5">
                          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Startup checks</div>
                          <div className="mt-4 grid gap-3">
                            <CountdownMetric label="Visibility" value={visibilityLabel} />
                            <CountdownMetric label="FPS" value={fpsLabel} />
                            <CountdownMetric label="Pose state" value={framingLabel} />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button data-testid="coach-primary-action" size="lg" onClick={onPrimaryAction} disabled={!canPrimaryAction} className="min-w-[13rem]">
                          <Icon name="clock" className="h-4 w-4" />
                          {primaryActionLabel}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 sm:gap-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={framingTone} size="md">{framingLabel}</Badge>
                          <Badge tone="info" size="md">{sessionState === "completed" ? "Session complete" : sessionState === "paused" ? "Session paused" : "Pre-session framing"}</Badge>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{exerciseLabel} live coach</h2>
                        <p className="text-sm leading-6 text-slate-300 sm:leading-7">{subtitle}</p>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-[1.4rem] border border-white/14 bg-white/6 px-4 py-4 sm:rounded-[1.6rem] sm:px-5 sm:py-5">
                          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Framing check</div>
                          <div className="mt-3 text-2xl font-black">{framingLabel}</div>
                          <p className="mt-2 text-sm leading-6 text-slate-300 sm:leading-7">{framingDetail}</p>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <CountdownMetric label="Visibility" value={visibilityLabel} />
                            <CountdownMetric label="FPS" value={fpsLabel} />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="space-y-2 text-sm font-medium text-slate-200">
                            <span>Exercise</span>
                            <select data-testid="coach-exercise-select" value={exercise} onChange={(event) => onExerciseChange(event.target.value as Exercise)} disabled={sessionState === "paused"} className="w-full rounded-2xl border border-white/14 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60">
                              <option value="squat">Squat</option>
                              <option value="pushup">Pushup</option>
                              <option value="plank">Plank</option>
                            </select>
                          </label>

                          <div className="grid gap-2">
                            {checklist.map((item) => (
                              <div key={item} className="rounded-[1.05rem] border border-white/12 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">{item}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button data-testid="coach-primary-action" size="lg" onClick={onPrimaryAction} disabled={!canPrimaryAction} className="min-w-[12rem]">
                          <Icon name={sessionState === "paused" ? "play" : "target"} className="h-4 w-4" />
                          {primaryActionLabel}
                        </Button>
                        <Button variant="secondary" size="lg" onClick={onEndAndSave} disabled={!canEndSession || saving} className="min-w-[12rem] border-white/14 bg-white/6 text-white hover:bg-white/10 dark:border-white/14 dark:bg-white/6 dark:text-white dark:hover:bg-white/10">
                          <Icon name="save" className="h-4 w-4" />
                          {saving ? "Saving..." : "End & save"}
                        </Button>
                        {sessionState === "completed" ? (
                          <Link href="/history" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/14 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                            <Icon name="chart" className="h-4 w-4" />
                            Open history
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-slate-950 via-slate-950/84 to-transparent px-3 pb-3 pt-24 sm:px-6 sm:pb-6">
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
                    <SummaryChip label={exercise === "plank" ? "Holds" : "Reps"} value={`${repCount}`} icon="target" />
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

                <div className="grid gap-2 sm:grid-cols-2 lg:hidden">
                  <SummaryChip label={exercise === "plank" ? "Holds" : "Reps"} value={`${repCount}`} icon="target" compact />
                  <SummaryChip label="Elapsed" value={elapsedLabel} icon="clock" compact />
                  <SummaryChip label="Visibility" value={visibilityLabel} icon="camera" compact />
                  <SummaryChip label="FPS" value={fpsLabel} icon="activity" compact />
                </div>
              </div>
            </div>
          </div>
        </div>

        {showMobileTray ? (
          <div data-testid="coach-mobile-tray" className="sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mt-3 grid gap-3 lg:hidden">
            <Card className="rounded-[1.7rem] border border-white/60 bg-white/92 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.7)] backdrop-blur dark:border-white/10 dark:bg-slate-950/86" padding="sm">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button data-testid="coach-mobile-primary-action" size="lg" onClick={onPrimaryAction} className="w-full">
                    <Icon name="pause" className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button data-testid="coach-session-save" variant="secondary" size="lg" onClick={onEndAndSave} disabled={!canEndSession || saving} className="w-full">
                    <Icon name="save" className="h-4 w-4" />
                    {saving ? "Saving..." : "End & save"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SummaryChip label={exercise === "plank" ? "Holds" : "Reps"} value={`${repCount}`} icon="target" compact />
                  <SummaryChip label="Elapsed" value={elapsedLabel} icon="clock" compact />
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_1fr_1fr]">
          <Card className="rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70" padding="lg">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Session pulse</div>
              <div className="text-xl font-black text-slate-950 dark:text-white">The coach should feel calm before motion starts and nearly invisible once motion is locked.</div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{offline ? `Offline mode active. ${pendingWrites} write${pendingWrites === 1 ? "" : "s"} waiting to sync.` : pendingWrites > 0 ? `${pendingWrites} buffered write${pendingWrites === 1 ? " is" : "s are"} waiting to flush.` : "No buffered writes. The coach path is clean right now."}</p>
              {saveNotice ? <p className="text-sm leading-7 text-teal-700 dark:text-teal-300">{saveNotice}</p> : null}
            </div>
          </Card>

          <Card className="rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_28px_90px_-58px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70" padding="lg">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Framing notes</div>
              <div className="text-xl font-black text-slate-950 dark:text-white">Let the camera lock the body before the first cue loop starts.</div>
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
              <div className="text-xl font-black text-slate-950 dark:text-white">No extra platform noise in the live loop.</div>
              <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="cpu" className="h-4 w-4" /></span><span>Browser pose tracking only. No LLM is sitting inside the live coaching path.</span></li>
                <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="message" className="h-4 w-4" /></span><span>Voice is human-authored guidance with browser speech fallback.</span></li>
                <li className="flex gap-3"><span className="mt-1 text-sky-600 dark:text-sky-300"><Icon name="chart" className="h-4 w-4" /></span><span>History should only reflect real sessions from this coach surface.</span></li>
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
    ? "border-emerald-300/70 bg-emerald-400/6"
    : tone === "warning"
      ? "border-amber-300/70 bg-amber-400/6"
      : "border-white/16 bg-white/0";

  return (
    <div data-testid="coach-framing-guide" className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6">
      <div className={`relative h-[72%] w-[min(22rem,82vw)] max-w-[24rem] rounded-[2rem] border ${ringClass} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] sm:h-[74%] sm:rounded-[2.4rem]`}>
        <div className="absolute left-5 top-5 h-10 w-10 rounded-tl-[1.1rem] border-l-2 border-t-2 border-white/70 sm:h-12 sm:w-12 sm:rounded-tl-[1.4rem]" />
        <div className="absolute right-5 top-5 h-10 w-10 rounded-tr-[1.1rem] border-r-2 border-t-2 border-white/70 sm:h-12 sm:w-12 sm:rounded-tr-[1.4rem]" />
        <div className="absolute bottom-5 left-5 h-10 w-10 rounded-bl-[1.1rem] border-b-2 border-l-2 border-white/70 sm:h-12 sm:w-12 sm:rounded-bl-[1.4rem]" />
        <div className="absolute bottom-5 right-5 h-10 w-10 rounded-br-[1.1rem] border-b-2 border-r-2 border-white/70 sm:h-12 sm:w-12 sm:rounded-br-[1.4rem]" />
        <div className="absolute inset-x-10 top-7 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        <div className="absolute inset-x-10 bottom-7 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        <div className="absolute bottom-16 left-1/2 top-16 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-x-4 bottom-6 sm:inset-x-6 sm:bottom-8">
          <div className="rounded-[1.2rem] border border-white/16 bg-slate-950/66 px-4 py-4 text-center text-white backdrop-blur sm:rounded-[1.4rem]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300 sm:text-xs">{countdownValue !== null ? "Countdown" : "Framing guide"}</div>
            <div className="mt-2 text-sm font-black sm:text-lg">{countdownValue !== null ? `Starting in ${countdownValue}` : label}</div>
            <div className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">{countdownValue !== null ? "Keep the whole body centered until the count clears." : detail}</div>
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

function SummaryChip({ label, value, icon, compact = false }: { label: string; value: string; icon: "target" | "clock" | "camera" | "activity"; compact?: boolean }) {
  return (
    <div className={`rounded-[1.2rem] border border-white/14 bg-slate-950/68 text-white backdrop-blur ${compact ? "px-3 py-3" : "px-4 py-3"}`}>
      <div className={`flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-slate-300 ${compact ? "text-[10px]" : "text-[11px]"}`}><Icon name={icon} className="h-4 w-4" />{label}</div>
      <div className={`mt-2 font-black ${compact ? "text-lg" : "text-xl"}`}>{value}</div>
    </div>
  );
}

function CountdownMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white/12 bg-slate-950/54 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
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

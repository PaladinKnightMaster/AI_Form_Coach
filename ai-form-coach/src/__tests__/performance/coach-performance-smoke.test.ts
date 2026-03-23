import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFramingGuidance } from "@/lib/coach/framing";
import { shouldCommitCoachLiveUi, type CoachLiveUiSnapshot } from "@/lib/coach/liveUi";
import { getCoachTestPoseScript } from "@/lib/coach/testPoseScripts";
import { buildMotionFeatures, deriveJoints, reduceToFitnessSkeleton } from "@/lib/pose/contracts";
import { PerformanceBenchmark } from "@/lib/pose/performanceBenchmark";
import { createValidator } from "@/lib/validators";
import type { Exercise, Phase } from "@/lib/validators/types";

const FRAME_INTERVAL_MS = 16;
const BENCHMARK_REPETITIONS = 30;
const STABLE_HOLD_MAX_COMMIT_RATIO = 0.2;
const AVG_FRAME_BUDGET_MS = 4;
const P95_FRAME_BUDGET_MS = 8;
const MAX_FRAME_BUDGET_MS = 20;

type ScriptScenario = {
  exercise: Exercise;
  scriptName: Parameters<typeof getCoachTestPoseScript>[0];
};

const SCRIPT_SCENARIOS: ScriptScenario[] = [
  { exercise: "squat", scriptName: "squat-single-rep" },
  { exercise: "pushup", scriptName: "pushup-single-rep" },
  { exercise: "plank", scriptName: "plank-short-hold" },
  { exercise: "squat", scriptName: "squat-visibility-recovery" },
];

function getQuality(visibilityScore: number, fps: number): CoachLiveUiSnapshot["quality"] {
  if (visibilityScore >= 0.78 && fps >= 24) return "good";
  if (visibilityScore >= 0.55 && fps >= 16) return "warn";
  return "bad";
}

function createSnapshot(frameVisibility: number, fps: number, repCount: number, phase: Phase, trackingStatus: string): CoachLiveUiSnapshot {
  return {
    hasPose: frameVisibility > 0,
    visibilityScore: frameVisibility,
    fps,
    quality: getQuality(frameVisibility, fps),
    trackingStatus,
    repCount,
    phase,
  };
}

async function benchmarkCoachPipeline() {
  const benchmark = new PerformanceBenchmark();
  let checksum = 0;
  let totalCommits = 0;

  for (const scenario of SCRIPT_SCENARIOS) {
    const frames = getCoachTestPoseScript(scenario.scriptName);
    expect(frames).toBeTruthy();
    expect(frames?.length ?? 0).toBeGreaterThan(0);

    for (let repetition = 0; repetition < BENCHMARK_REPETITIONS; repetition += 1) {
      const validator = createValidator(scenario.exercise);
      let ts = 0;
      let state = await validator(null, ts, { debounceFrames: 2, bestSide: "right" });
      let previousSnapshot: CoachLiveUiSnapshot | null = null;
      let lastCommitAt = 0;

      for (const frame of frames ?? []) {
        ts += FRAME_INTERVAL_MS;
        const frameStart = performance.now();

        const skeleton = reduceToFitnessSkeleton(frame.landmarks);
        const derived = deriveJoints(skeleton);
        const motion = buildMotionFeatures(skeleton, derived);
        const framing = getFramingGuidance({
          exercise: scenario.exercise,
          cameraReady: true,
          visibilityScore: frame.visibilityScore,
          fps: frame.fps,
          hasPose: true,
        });

        state = await validator(frame, ts, { debounceFrames: 2, bestSide: frame.bestSide });

        const trackingStatus = state.phase === "idle" ? framing.detail : "Tracking live posture.";
        const snapshot = createSnapshot(frame.visibilityScore, frame.fps, state.repCount, state.phase, trackingStatus);
        const shouldCommit = shouldCommitCoachLiveUi(previousSnapshot, snapshot, ts, lastCommitAt);
        if (shouldCommit) {
          previousSnapshot = snapshot;
          lastCommitAt = ts;
          totalCommits += 1;
        }

        const totalMs = performance.now() - frameStart;
        benchmark.record({
          detectionLatencyMs: totalMs,
          renderLatencyMs: 0,
          totalLatencyMs: totalMs,
          fps: frame.fps,
          frameDropRate: 0,
          memoryUsedMB: 0,
          motionMagnitude: motion.symmetryScore,
          isStatic: motion.cueState === "clear" && state.phase === "idle",
          simdEnabled: false,
        });

        checksum += motion.visibilityScore + framing.label.length + state.repCount + (shouldCommit ? 1 : 0);
      }
    }
  }

  return {
    summary: benchmark.getSummary(),
    checksum,
    totalCommits,
  };
}

describe("coach performance smoke", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("keeps stable hold UI commits low enough for mobile coaching", () => {
    const frames = getCoachTestPoseScript("squat-ready-hold");

    expect(frames).toBeTruthy();
    expect(frames?.length ?? 0).toBeGreaterThan(0);

    let previousSnapshot: CoachLiveUiSnapshot | null = null;
    let lastCommitAt = 0;
    let ts = 0;
    let commits = 0;

    for (const frame of frames ?? []) {
      ts += FRAME_INTERVAL_MS;
      const snapshot = createSnapshot(frame.visibilityScore, frame.fps, 0, "idle", "Tracking live posture.");
      if (shouldCommitCoachLiveUi(previousSnapshot, snapshot, ts, lastCommitAt)) {
        previousSnapshot = snapshot;
        lastCommitAt = ts;
        commits += 1;
      }
    }

    expect(commits).toBeGreaterThan(0);
    expect(commits / (frames?.length ?? 1)).toBeLessThanOrEqual(STABLE_HOLD_MAX_COMMIT_RATIO);
  });

  it("keeps the scripted coach hot path inside the release budgets", async () => {
    const { summary, checksum, totalCommits } = await benchmarkCoachPipeline();

    expect(checksum).toBeGreaterThan(0);
    expect(totalCommits).toBeGreaterThan(0);
    expect(summary.totalSamples).toBeGreaterThan(0);
    expect(summary.avgDetectionMs).toBeLessThan(AVG_FRAME_BUDGET_MS);
    expect(summary.p95DetectionMs).toBeLessThan(P95_FRAME_BUDGET_MS);
    expect(summary.p99DetectionMs).toBeLessThan(MAX_FRAME_BUDGET_MS);
    expect(summary.minFPS).toBeGreaterThanOrEqual(30);
    expect(summary.avgFrameDropRate).toBe(0);
  });
});
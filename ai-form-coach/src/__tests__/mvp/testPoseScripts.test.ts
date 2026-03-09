import { describe, expect, it } from "vitest";
import { getCoachTestPoseScript } from "@/lib/coach/testPoseScripts";
import { getExerciseAngle } from "@/lib/pose/normalize";
import { normalizeAngleForPhaseDetection } from "@/lib/phaseDetection/phaseDetector";
import { createPlankValidator } from "@/lib/validators/plank";
import { createPushupValidator } from "@/lib/validators/pushup";
import { createSquatValidator } from "@/lib/validators/squat";

async function runScriptThroughValidator(
  validator: ReturnType<typeof createSquatValidator> | ReturnType<typeof createPushupValidator> | ReturnType<typeof createPlankValidator>,
  scriptName: Parameters<typeof getCoachTestPoseScript>[0],
) {
  const frames = getCoachTestPoseScript(scriptName);

  expect(frames).not.toBeNull();
  expect(frames?.length ?? 0).toBeGreaterThan(0);

  let ts = 0;
  let state = await validator(null, ts, { debounceFrames: 1, bestSide: "right" });

  for (const frame of frames ?? []) {
    ts += 16;
    state = await validator(frame, ts, { debounceFrames: 1, bestSide: frame.bestSide });
  }

  return { frames: frames ?? [], state };
}

describe("coach test pose scripts", () => {
  it("drives the squat validator through a counted rep", async () => {
    const { state } = await runScriptThroughValidator(createSquatValidator(), "squat-single-rep");

    expect(state.repCount).toBeGreaterThanOrEqual(1);
    expect(state.metrics.length).toBeGreaterThanOrEqual(1);
    expect(state.metrics[0]?.tempo).toBeDefined();
  });

  it("drives the pushup validator through a counted rep", async () => {
    const { state } = await runScriptThroughValidator(createPushupValidator(), "pushup-single-rep");

    expect(state.repCount).toBeGreaterThanOrEqual(1);
    expect(state.metrics.length).toBeGreaterThanOrEqual(1);
    expect(state.metrics[0]?.tempo).toBeDefined();
  });

  it("drives the plank validator through a completed hold", async () => {
    const { state } = await runScriptThroughValidator(createPlankValidator(), "plank-short-hold");

    expect(state.repCount).toBeGreaterThanOrEqual(1);
    expect(state.metrics.length).toBeGreaterThanOrEqual(1);
    expect(state.metrics[0]?.duration ?? 0).toBeGreaterThan(300);
  });

  it("keeps plank angle normalization on the calibrated body-line scale", () => {
    const frames = getCoachTestPoseScript("plank-short-hold");
    const firstFrame = frames?.[0];

    expect(firstFrame).toBeTruthy();

    const plankAngle = getExerciseAngle(firstFrame!, "plank");
    expect(plankAngle ?? 0).toBeGreaterThan(170);
    expect(normalizeAngleForPhaseDetection(plankAngle ?? 0, "plank")).toBeGreaterThan(0.8);
  });

  it("includes a low-visibility recovery script for coach reliability checks", () => {
    const frames = getCoachTestPoseScript("squat-visibility-recovery");

    expect(frames?.some((frame) => frame.visibilityScore < 0.55)).toBe(true);
    expect(frames?.at(-1)?.visibilityScore ?? 0).toBeGreaterThan(0.9);
  });
});

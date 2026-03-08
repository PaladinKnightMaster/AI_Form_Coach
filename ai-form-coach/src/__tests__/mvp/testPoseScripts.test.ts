import { describe, expect, it } from "vitest";
import { getCoachTestPoseScript } from "@/lib/coach/testPoseScripts";
import { createSquatValidator } from "@/lib/validators/squat";

describe("coach test pose scripts", () => {
  it("drives the squat validator through a counted rep", async () => {
    const frames = getCoachTestPoseScript("squat-single-rep");

    expect(frames).not.toBeNull();
    expect(frames?.length ?? 0).toBeGreaterThan(0);

    const validator = createSquatValidator();
    let ts = 0;
    let state = await validator(null, ts, { debounceFrames: 1, bestSide: "right" });

    for (const frame of frames ?? []) {
      ts += 16;
      state = await validator(frame, ts, { debounceFrames: 1, bestSide: frame.bestSide });
    }

    expect(state.repCount).toBeGreaterThanOrEqual(1);
    expect(state.metrics.length).toBeGreaterThanOrEqual(1);
    expect(state.metrics[0]?.tempo).toBe("normal");
  });
});

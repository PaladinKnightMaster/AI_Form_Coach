import { describe, expect, it } from "vitest";
import {
  getCoachStageSimulationIssue,
  getCoachStageSimulationMode,
} from "@/lib/coach/stageSimulation";

describe("coach stage simulation", () => {
  it("maps known query values to supported simulation modes", () => {
    expect(getCoachStageSimulationMode("camera-blocked-once")).toBe("camera-blocked-once");
    expect(getCoachStageSimulationMode("detector-error")).toBe("detector-error");
    expect(getCoachStageSimulationMode("unknown")).toBe("none");
  });

  it("returns a one-time camera issue only on the first attempt", () => {
    expect(getCoachStageSimulationIssue("camera-blocked-once", 0)?.kind).toBe("camera");
    expect(getCoachStageSimulationIssue("camera-blocked-once", 1)).toBeNull();
  });

  it("returns a one-time detector issue only on the first attempt", () => {
    expect(getCoachStageSimulationIssue("detector-error-once", 0)?.kind).toBe("detector");
    expect(getCoachStageSimulationIssue("detector-error-once", 1)).toBeNull();
  });

  it("describes the camera-busy recovery path", () => {
    expect(getCoachStageSimulationIssue("camera-busy", 0)).toMatchObject({
      kind: "camera",
      status: "Camera unavailable.",
    });
  });
});

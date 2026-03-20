import { describe, expect, it } from "vitest";
import { getFramingGuidance } from "@/lib/coach/framing";

describe("coach framing guidance", () => {
  it("reports loading while camera is not ready", () => {
    expect(getFramingGuidance({ exercise: "squat", cameraReady: false, visibilityScore: 0, fps: 0, hasPose: false })).toMatchObject({
      state: "searching",
      tone: "error",
      label: "Camera stage loading",
      cameraAngleLabel: "Quarter turn",
    });
  });

  it("reports squat-ready when visibility and fps are stable", () => {
    expect(getFramingGuidance({ exercise: "squat", cameraReady: true, visibilityScore: 0.82, fps: 24, hasPose: true })).toMatchObject({
      state: "ready",
      tone: "success",
      label: "Quarter turn locked",
      cameraAngleLabel: "Quarter turn",
    });
  });

  it("reports pushup-specific searching guidance before pose lock", () => {
    expect(getFramingGuidance({ exercise: "pushup", cameraReady: true, visibilityScore: 0.2, fps: 18, hasPose: false })).toMatchObject({
      state: "searching",
      tone: "error",
      label: "Find your pushup line",
      cameraAngleLabel: "Side profile",
    });
  });

  it("reports plank-specific adjust guidance when the body is partially framed", () => {
    expect(getFramingGuidance({ exercise: "plank", cameraReady: true, visibilityScore: 0.61, fps: 18, hasPose: true })).toMatchObject({
      state: "adjust",
      tone: "warning",
      label: "Almost framed",
      detail: "Stay side-on and step back slightly so elbows, hips, and ankles all stay visible.",
      cameraAngleLabel: "Side profile",
    });
  });
});

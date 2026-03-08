import { describe, expect, it } from "vitest";
import { getFramingGuidance } from "@/lib/coach/framing";

describe("coach framing guidance", () => {
  it("reports loading while camera is not ready", () => {
    expect(getFramingGuidance({ cameraReady: false, visibilityScore: 0, fps: 0, hasPose: false })).toMatchObject({
      state: "searching",
      tone: "error",
      label: "Camera stage loading",
    });
  });

  it("reports ready when visibility and fps are stable", () => {
    expect(getFramingGuidance({ cameraReady: true, visibilityScore: 0.82, fps: 24, hasPose: true })).toMatchObject({
      state: "ready",
      tone: "success",
      label: "Full body locked",
    });
  });

  it("reports adjust when the body is partially framed", () => {
    expect(getFramingGuidance({ cameraReady: true, visibilityScore: 0.61, fps: 18, hasPose: true })).toMatchObject({
      state: "adjust",
      tone: "warning",
      label: "Almost framed",
    });
  });
});

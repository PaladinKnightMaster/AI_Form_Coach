import { describe, expect, it } from "vitest";
import { detectCoachDeviceProfile, formatCoachDeviceSummary, getCoachRecoveryGuide } from "@/lib/coach/deviceReadiness";

describe("coach device readiness", () => {
  it("detects an iPhone Safari profile", () => {
    const profile = detectCoachDeviceProfile({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      viewportWidth: 390,
      viewportHeight: 844,
      maxTouchPoints: 5,
      pixelRatio: 3,
    });

    expect(profile.family).toBe("iphone-safari");
    expect(formatCoachDeviceSummary(profile)).toContain("Safari on iPhone");
  });

  it("detects an Android Chrome profile", () => {
    const profile = detectCoachDeviceProfile({
      userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36",
      viewportWidth: 412,
      viewportHeight: 915,
      maxTouchPoints: 5,
      pixelRatio: 2.63,
    });

    expect(profile.family).toBe("android-chrome");
    expect(profile.browser).toBe("Chrome");
  });

  it("returns Safari-specific camera recovery guidance", () => {
    const profile = detectCoachDeviceProfile({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      viewportWidth: 390,
      viewportHeight: 844,
      maxTouchPoints: 5,
      pixelRatio: 3,
    });

    const guide = getCoachRecoveryGuide({
      cameraError: "Camera access is blocked. Allow permission and reload.",
      detectorError: null,
      deviceProfile: profile,
    });

    expect(guide?.title).toContain("Safari");
    expect(guide?.steps[0]).toContain("Safari");
  });

  it("returns detector recovery guidance when the pose detector fails", () => {
    const profile = detectCoachDeviceProfile({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      viewportWidth: 1440,
      viewportHeight: 900,
      maxTouchPoints: 0,
      pixelRatio: 1,
    });

    const guide = getCoachRecoveryGuide({
      cameraError: null,
      detectorError: "Pose detector could not start. Check MediaPipe asset access, then reload.",
      deviceProfile: profile,
    });

    expect(guide?.title).toContain("Pose detector");
    expect(guide?.steps).toHaveLength(3);
  });
});

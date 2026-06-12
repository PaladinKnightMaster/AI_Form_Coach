/**
 * Pinning test for war-room #1 — now that the smoother is a CORRECT EMA.
 * Inverts the old sgDefaultDisabled bug-existence assertion.
 */
import { describe, it, expect } from "vitest";
import { EmaSmoother, alphaFromWindow } from "@/lib/phaseDetection/ema";
import { ValidatorPhaseDetector } from "@/lib/phaseDetection/validatorIntegration";

describe("EMA smoothing is correct — war-room #1 resolved", () => {
  it("EMA round-trips a constant 0.5 (the old SG returned ~2.7e10)", () => {
    const ema = new EmaSmoother(alphaFromWindow(5));
    let out = 0;
    for (let i = 0; i < 6; i++) out = ema.addPoint(i * 16, 0.5);
    expect(Math.abs(out - 0.5)).toBeLessThan(1e-6);
  });

  it("default ValidatorPhaseDetector has smoothing ON and stays near a constant input", () => {
    const detector = new ValidatorPhaseDetector("squat");
    // Knee 135° normalizes to (180-135)/90 = 0.5 for squat.
    let last = { smoothedValue: 0, enhanced: false };
    for (let i = 0; i < 6; i++) last = detector.detectPhase(1000 + i * 16, 135);
    expect(last.enhanced).toBe(true);
    expect(last.smoothedValue).toBeCloseTo(0.5, 3); // EMA round-trip, in [0,1]
  });
});

describe("HMM detects phases through the EMA path", () => {
  it("squat down-then-back-to-idle transition registers with smoothing on", () => {
    const detector = new ValidatorPhaseDetector("squat");
    const angles = [180, 170, 150, 120, 100, 90, 100, 120, 150, 170, 180];
    const phases: string[] = [];
    angles.forEach((angle, i) => phases.push(detector.detectPhase(i * 16, angle).phase));
    expect(phases).toContain("down");
    expect(phases[phases.length - 1]).toBe("idle");
  });
});

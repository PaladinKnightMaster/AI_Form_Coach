/**
 * Pinning tests for war-room concern #1 — Savitzky-Golay coefficient bug.
 *
 * Three tests:
 *   1. Bug-existence: locks the CURRENT broken behavior of RealTimeSavitzkyGolay
 *      in place. A future PR that fixes the math will see this test fail,
 *      which is the unambiguous signal that the production default in
 *      `validatorIntegration.ts` can be flipped back to `true`.
 *   2. Production-bypass: proves that the default ValidatorPhaseDetector
 *      configuration skips SG (smoothedValue === normalized input).
 *   3. HMM-still-works: proves that the downstream HMM still detects squat
 *      phase transitions correctly on raw normalized angles, i.e. Beta 1
 *      phase detection works without smoothing.
 *
 * See `docs/superpowers/specs/2026-05-28-sg-default-disable-design.md`
 * and `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` (concern #1).
 */

import { describe, it, expect } from "vitest";

import { RealTimeSavitzkyGolay } from "@/lib/phaseDetection/savitzkyGolay";
import { ValidatorPhaseDetector } from "@/lib/phaseDetection/validatorIntegration";

describe("SG math is currently broken — war-room concern #1", () => {
  it("RealTimeSavitzkyGolay does NOT round-trip a constant 0.5 input", () => {
    const sg = new RealTimeSavitzkyGolay(5, 2);
    const constant = [0.5, 0.5, 0.5, 0.5, 0.5];
    let lastOutput = 0;
    for (let i = 0; i < constant.length; i++) {
      lastOutput = sg.addPoint(i * 16, constant[i]);
    }
    // A correct SG filter (coefficients sum to 1) would produce 0.5 here.
    // This assertion locks the *broken* behavior so a future "fix the math"
    // PR sees this test fail (signal that production default can flip back).
    expect(Math.abs(lastOutput - 0.5)).toBeGreaterThan(0.01);
  });
});

describe("Production default bypasses SG", () => {
  it("default ValidatorPhaseDetector preserves normalized input across 5+ frames", () => {
    const detector = new ValidatorPhaseDetector("squat");
    // Knee angle of 135° normalizes to (180 - 135) / 90 = 0.5 for squat.
    // Feed 5 consecutive frames so the internal SG buffer (windowSize=5)
    // would FILL if smoothing were enabled. RealTimeSavitzkyGolay.addPoint
    // returns the raw input verbatim while the buffer is under-filled, so a
    // single-call test passes regardless of the default flag. Feeding 5
    // frames guarantees the broken SG path executes if smoothing.enabled is
    // true, and the produced smoothedValue diverges wildly from 0.5.
    let last = { smoothedValue: 0 };
    for (let i = 0; i < 5; i++) {
      last = detector.detectPhase(1000 + i * 16, 135);
    }
    expect(last.smoothedValue).toBeCloseTo(0.5, 5);
  });
});

describe("HMM still detects phases on raw normalized angles", () => {
  it("squat down-then-back-to-idle transition registers without smoothing", () => {
    const detector = new ValidatorPhaseDetector("squat");
    // Knee angle pattern: standing (180° → idle/up) → deep squat (90° → down) → standing.
    const angles = [180, 170, 150, 120, 100, 90, 100, 120, 150, 170, 180];
    const phases: string[] = [];
    angles.forEach((angle, i) => {
      phases.push(detector.detectPhase(i * 16, angle).phase);
    });
    expect(phases).toContain("down"); // descent registered
    expect(phases[phases.length - 1]).toBe("idle"); // returned to standing
  });
});

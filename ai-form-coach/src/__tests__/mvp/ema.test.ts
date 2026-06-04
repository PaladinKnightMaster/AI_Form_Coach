import { describe, it, expect } from "vitest";
import { EmaSmoother, alphaFromWindow } from "@/lib/phaseDetection/ema";

describe("EmaSmoother", () => {
  it("round-trips a constant input exactly (seed-first)", () => {
    const ema = new EmaSmoother(alphaFromWindow(5));
    let out = 0;
    for (let i = 0; i < 6; i++) out = ema.addPoint(i * 16, 0.5);
    expect(out).toBeCloseTo(0.5, 10);
  });

  it("keeps output within the input range [0,1]", () => {
    const ema = new EmaSmoother(alphaFromWindow(5));
    let out = 0;
    for (const v of [0, 1, 0, 1, 0.3, 0.9, 0.1]) out = ema.addPoint(0, v);
    expect(out).toBeGreaterThanOrEqual(0);
    expect(out).toBeLessThanOrEqual(1);
  });

  it("lags a step input (smoothing is actually applied)", () => {
    const ema = new EmaSmoother(alphaFromWindow(5));
    ema.addPoint(0, 0); // seed at 0
    const afterStep = ema.addPoint(16, 1); // jump to 1
    expect(afterStep).toBeGreaterThan(0);
    expect(afterStep).toBeLessThan(1); // smoothed, not the raw 1
  });

  it("clear() resets the seed so the next point round-trips again", () => {
    const ema = new EmaSmoother(alphaFromWindow(5));
    ema.addPoint(0, 0.2);
    ema.clear();
    expect(ema.addPoint(0, 0.8)).toBeCloseTo(0.8, 10);
  });

  it("alphaFromWindow(5) ≈ 0.333", () => {
    expect(alphaFromWindow(5)).toBeCloseTo(1 / 3, 6);
  });
});

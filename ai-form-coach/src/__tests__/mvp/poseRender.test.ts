import { describe, expect, it } from "vitest";
import { getContainedVideoRect } from "@/lib/pose/render";

describe("getContainedVideoRect", () => {
  it("centers a wide video inside a taller container", () => {
    const rect = getContainedVideoRect(1000, 1000, 1920, 1080);

    expect(rect.x).toBe(0);
    expect(rect.width).toBe(1000);
    expect(rect.height).toBeCloseTo(562.5);
    expect(rect.y).toBeCloseTo(218.75);
  });

  it("centers a tall video inside a wider container", () => {
    const rect = getContainedVideoRect(900, 500, 720, 1280);

    expect(rect.y).toBe(0);
    expect(rect.height).toBe(500);
    expect(rect.width).toBeCloseTo(281.25);
    expect(rect.x).toBeCloseTo(309.375);
  });
});
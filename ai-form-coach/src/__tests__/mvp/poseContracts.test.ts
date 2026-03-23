import { describe, expect, it } from "vitest";
import {
  buildMotionFeatures,
  deriveJoints,
  FITNESS_SKELETON_EDGES,
  getRenderedFitnessJoints,
  reduceToFitnessSkeleton,
  type RawPose33,
} from "@/lib/pose/contracts";

function createPose(): RawPose33 {
  return Array.from({ length: 33 }, (_, index) => ({
    x: 0.1 + index * 0.01,
    y: 0.2 + index * 0.01,
    z: index * 0.001,
    visibility: 0.9,
  }));
}

describe("pose contracts", () => {
  it("reduces raw pose data and derives neck and pelvis center", () => {
    const skeleton = reduceToFitnessSkeleton(createPose());
    const derived = deriveJoints(skeleton);

    expect(skeleton.leftShoulder?.sourceIndices).toEqual([11]);
    expect(derived.neck?.sourceIndices).toEqual([11, 12]);
    expect(derived.pelvis_center?.sourceIndices).toEqual([23, 24]);
  });

  it("renders neck and pelvis center without face chains", () => {
    const skeleton = reduceToFitnessSkeleton(createPose());
    const derived = deriveJoints(skeleton);
    const renderedIds = getRenderedFitnessJoints(skeleton, derived).map((joint) => joint.id);

    expect(renderedIds).toContain("neck");
    expect(renderedIds).toContain("pelvis_center");
    expect(FITNESS_SKELETON_EDGES.some(([from, to]) => from === "nose" || to === "nose")).toBe(false);
  });

  it("builds motion features for the live loop", () => {
    const skeleton = reduceToFitnessSkeleton(createPose());
    const derived = deriveJoints(skeleton);
    const features = buildMotionFeatures(skeleton, derived);

    expect(features.visibilityScore).toBeGreaterThan(0.5);
    expect(["clear", "adjust", "low_visibility"]).toContain(features.cueState);
    expect(Number.isFinite(features.torsoAngleDeg)).toBe(true);
  });
});

# ADR-002: 10-Joint Fitness Skeleton

**Status:** Accepted
**Date:** 2026-03
**Author:** Solo dev

## Context

MediaPipe Pose Landmarker provides 33 landmarks per frame. Most landmarks are irrelevant for fitness form coaching (face mesh points, individual finger joints). Rendering all 33 creates visual clutter and makes form correction highlighting ambiguous.

## Decision

Reduce to 10 fitness-relevant joints: shoulders, elbows, wrists, hips, knees, ankles. Plus derived joints (head_center, torso_center) calculated from raw landmarks. This is defined in `src/lib/pose/contracts.ts` as `FitnessJointId` and `DerivedJointId`.

Skeleton edges are defined as `FITNESS_SKELETON_EDGES` — a curated list of connections between these joints.

## Consequences

- **Easier:** Clean skeleton overlay, easier to highlight specific joints for form corrections, less computation per frame
- **Harder:** Cannot coach fine motor movements (wrist angle in yoga, finger placement in climbing)
- **Revisit when:** Adding exercises that need face, hands, or feet detail (Phase 2+ exercise expansion)

# Phase-Detection Smoothing: replace broken Savitzky-Golay with EMA (war-room #1)

**Date:** 2026-05-30
**Branch:** `fix/phase-detection-ema`
**War-room concern:** #1 — S-G coefficient bug (currently 🟡: smoothing default-disabled, broken math dormant in repo).
**Goal:** flip #1 → 🟢 by deleting the broken Savitzky-Golay code and shipping a correct, tested EMA smoother with smoothing re-enabled in production.

## Problem

`src/lib/phaseDetection/savitzkyGolay.ts` is mathematically broken (constant 0.5
input returns values like `27000000002`). A prior PR mitigated this by
**default-disabling** smoothing (`smoothing.enabled = false` in both
`createConfigFromValidator` and `createDefaultEnhancedPhaseConfig`), so the HMM
runs on raw normalized [0,1] angles. The broken code remains in the repo marked
`@deprecated`, and `src/__tests__/mvp/sgDefaultDisabled.test.ts` pins the broken
behavior. That leaves #1 at 🟡: a known-broken filter sits dormant, and there is
no working smoothing to reject real-camera jitter before the HMM.

## Goal / non-goals

- **Goal:** a correct exponential-moving-average smoother, re-enabled in
  production, broken S-G deleted, #1 → 🟢.
- **Non-goal:** re-deriving a correct Savitzky-Golay filter (YAGNI — EMA is
  sufficient for single-channel [0,1] angle smoothing before an HMM).
- **Non-goal:** retuning the HMM observation model or thresholds.

## Decisions (brainstorm, 2026-05-30)

- **Smoother:** EMA. **α ≈ 0.33**, derived from the existing
  `config.smoothing.windowSize` (5) via the standard `α = 2/(windowSize+1)`.
  Keeps the config field meaningful; tune later with real-device data (#12).
- **Re-enable smoothing in production:** yes (both config defaults → `true`).
- **Delete `savitzkyGolay.ts` outright** (not keep-dead).
- **User authorized iterating on α** until the rep-count tests pass.

## Architecture

### New module — `src/lib/phaseDetection/ema.ts`

```ts
export class EmaSmoother {
  private smoothed: number | null = null;
  constructor(private alpha: number) {}      // 0 < alpha <= 1

  addPoint(_timestamp: number, value: number): number {
    this.smoothed = this.smoothed === null
      ? value                                  // seed: constant input round-trips
      : this.alpha * value + (1 - this.alpha) * this.smoothed;
    return this.smoothed;
  }

  clear(): void { this.smoothed = null; }
}

// α from an effective window, matching the prior config field.
export function alphaFromWindow(windowSize: number): number {
  return 2 / (Math.max(1, windowSize) + 1);
}
```

Properties: constant input round-trips exactly from the first sample; output is a
convex combination of in-range inputs, so it stays within the input range
(in [0,1] for normalized angles) — the HMM observation means (idle 0.05, up 0.4,
down 0.8, hold 0.5) remain valid. `addPoint`/`clear` match the interface the HMM
already calls (`timestamp` accepted but unused — EMA is time-agnostic).

### Wire into `hmmPhaseDetector.ts`

- Replace `import { RealTimeSavitzkyGolay } from './savitzkyGolay'` with
  `import { EmaSmoother, alphaFromWindow } from './ema'`.
- Field type `RealTimeSavitzkyGolay` → `EmaSmoother`.
- Constructor + `updateConfig` reconstruction:
  `new EmaSmoother(alphaFromWindow(detectorConfig.smoothing.windowSize))`
  (drop the now-unused `polynomialOrder` argument).
- `addPoint` call site (line ~210) and `.clear()` (line ~370) unchanged.

### Re-enable smoothing — `validatorIntegration.ts`

Flip both defaults back to `enabled: true`:
- `createConfigFromValidator`: `smoothing.enabled` → `enhancedConfig?.smoothing?.enabled ?? true`.
- `createDefaultEnhancedPhaseConfig`: `smoothing.enabled: true`.
Replace the war-room bypass comments with a one-line "EMA smoother (working)" note.

### Delete broken S-G

- Delete `src/lib/phaseDetection/savitzkyGolay.ts`.
- Remove every reference (the `@deprecated` blocks go with the file).
- Update the extended test `src/lib/phaseDetection/__tests__/phaseDetection.test.ts`
  (runs under `test:extended`) — remove or rewrite any S-G-specific cases so it
  references the EMA path or drops the deleted symbols. Must compile + pass.

### Rewrite the pinning test

Replace `src/__tests__/mvp/sgDefaultDisabled.test.ts` with
`src/__tests__/mvp/emaSmoothing.test.ts` (kept in `mvp/` so it runs in the gate):

1. **EMA round-trips** a constant 0.5 input → `toBeCloseTo(0.5)` (inverse of the
   old "bug exists" assertion).
2. **EMA stays in range:** feeding values in [0,1] yields outputs in [0,1].
3. **Production has smoothing on:** a default `ValidatorPhaseDetector` reports
   `enhanced` with smoothing active; for constant input `smoothedValue ≈ input`
   (EMA round-trip), and for a step input the smoothed value lags the raw (proves
   EMA is actually applied, not bypassed).
4. **HMM still detects** the squat down→idle transition through EMA (carried over
   from the old test #3, still valid).

## The verification risk (explicit)

`src/__tests__/mvp/testPoseScripts.test.ts` (squat / pushup / plank rep counting)
was calibrated with smoothing **off**. Re-enabling EMA changes the signal the HMM
sees and could shift rep counts. **Hard checkpoint:** these three tests must stay
green with EMA on. If any breaks, debug systematically (superpowers:systematic-
debugging) — most likely an α adjustment via `alphaFromWindow` / the windowSize
config, or confirming the transition still crosses the HMM means. The user
authorized iterating on α until they pass. Do **not** weaken the rep-count
assertions to force a pass.

## Testing

- New `src/__tests__/mvp/ema.test.ts` (or fold into `emaSmoothing.test.ts`):
  round-trip, convergence toward a step, range-staying, `clear()` resets.
- Rewritten `emaSmoothing.test.ts` (integration, above).
- Full gate: `npm run lint`, `npm run test` (incl. testPoseScripts), `npm run build`.
- `npx tsc --noEmit`: no new errors referencing deleted/changed files.

## Docs / tracker

- War-room tracker #1 → 🟢 (resolution: broken S-G deleted, EMA shipped + enabled,
  pinning test inverted) + Resolution Log row.
- Brief note wherever phase detection is documented (if a doc exists) that
  smoothing is EMA, α = 2/(windowSize+1).

## Rollout

Branch `fix/phase-detection-ema` from `dev`, one purpose. User opens the PR
manually. #1 reaches 🟢 once merged (no external dependency, unlike #2).

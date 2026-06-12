# Default-disable broken Savitzky-Golay smoothing for Beta 1

**Date:** 2026-05-28
**Author:** Claude (war-room council session)
**Status:** approved (awaiting written-spec review)
**Target branch:** `fix/sg-default-disable-beta1`
**Target base:** `dev` (HEAD `d7d40be` at brainstorm time)
**War-room concern:** #1 — S-G coefficient bug still in production code path

## Goal

Eliminate the broken Savitzky-Golay (SG) path from the production phase-detection
chain for Beta 1, without rewriting the SG math. Production phase detection
becomes "HMM over raw normalized [0,1] angles" — a path the architecture already
supports, well-defined, and the only thing standing in the way is two
`?? true` → `?? false` flips and supporting tests/docs.

The buggy SG code stays in the repo (`@deprecated`, gated by a non-default
flag) so a follow-up PR can either fix the math or replace it with a simpler
smoother (EMA) without scope-creeping this PR.

## Context

The SG implementation at `ai-form-coach/src/lib/phaseDetection/savitzkyGolay.ts`
has three independent bugs (verified by code reading):

1. **Coefficient extraction overshoots** (lines 37–46). The inner `j` loop sums
   `pseudoInverse[derivative][i] * factorialValue` for every `j >= derivative`,
   but for SG the factorial scaling should only be applied once at `j == derivative`.
   For `derivative=0`, coefficients are scaled by `(polynomialOrder + 1)×` more
   than they should be.
2. **Wrong normalization in the batch fn** (line 258). `smoothedValue /= validPoints`
   after a convolution whose coefficients are designed to sum to 1 — rescales
   the output incorrectly even at interior points.
3. **Simplified pseudoinverse is element-wise reciprocal** (lines 109–134).
   `calculateSimplifiedInverse` (taken for `rows > 3 || cols > 3`) does
   `1 / (ata + 1e-10)` instead of computing an actual pseudo-inverse. Production
   uses `windowSize=5` → rows=5, so this is the path that runs.

Stacked, constant `0.5` input produces values like `27000000002.1875` (per the
war-room concern). These feed the HMM's observation matrix which expects values
near `{0.05, 0.4, 0.5, 0.8}` — Gaussian likelihood collapses to ~0 for every
state, the Viterbi state estimate becomes pure transition-prior guessing, and
the HMM produces nonsense in production.

The HMM itself is fine. `normalizeAngleForPhaseDetection`
(`phaseDetector.ts:283`) clamps inputs to `[0, 1]`. Bypassing SG and feeding
the raw normalized angle directly to the HMM produces well-behaved
observations and meaningful phase decisions.

## Scope

### Files touched (4)

| File | Change |
|---|---|
| `ai-form-coach/src/lib/phaseDetection/validatorIntegration.ts` | Two default flips (`?? true` → `?? false`) at line ~52 and line ~263, plus a brief code comment at each pointing to war-room #1. |
| `ai-form-coach/src/lib/phaseDetection/savitzkyGolay.ts` | Two `@deprecated` JSDoc blocks above `applySavitzkyGolaySmoothing` (line ~213) and `RealTimeSavitzkyGolay` (line ~278). No code change. |
| `ai-form-coach/src/lib/phaseDetection/__tests__/sgDefaultDisabled.test.ts` | NEW. Three tests, ~70 lines total. |
| `ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` | Concern #1 status `🔴 open` → `🟡 in progress` with Resolution sub-entry + a row in the changelog table at the bottom. |

### Default flip — exact intent

`validatorIntegration.ts` `createConfigFromValidator` (around line 52):

```diff
       smoothing: {
+        // War-room concern #1 — SG math broken. Production bypasses SG until
+        // the math is fixed or replaced. HMM works fine on raw normalized
+        // [0,1] angles. See sgDefaultDisabled.test.ts for the bug-existence
+        // record.
-        enabled: enhancedConfig?.smoothing?.enabled ?? true,
+        enabled: enhancedConfig?.smoothing?.enabled ?? false,
         windowSize: enhancedConfig?.smoothing?.windowSize ?? 5,
         polynomialOrder: enhancedConfig?.smoothing?.polynomialOrder ?? 2,
       },
```

`validatorIntegration.ts` `createDefaultEnhancedPhaseConfig` (around line 263):

```diff
     smoothing: {
+      // War-room concern #1 — broken math, production bypassed until fixed.
-      enabled: true,
+      enabled: false,
       windowSize: 5,
       polynomialOrder: 2,
     },
```

### `@deprecated` JSDoc

Identical block on both public entry points (`applySavitzkyGolaySmoothing` and
`RealTimeSavitzkyGolay`):

```js
/**
 * @deprecated Math is broken. See war-room concern #1 in
 *   `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`. The coefficient extractor
 *   sums when it should pick (overshoots by ~(polynomialOrder + 1)×), the
 *   post-convolution `/= validPoints` normalization is incorrect, and
 *   `calculateSimplifiedInverse` for windowSize > 3 is element-wise reciprocal
 *   instead of pseudo-inverse. Constant input does NOT round-trip.
 *
 *   Production uses `enabled: false` in the config (default since this PR).
 *   Do not re-enable without fixing the math; see `sgDefaultDisabled.test.ts`
 *   for the bug-existence test that fails on a future correct implementation.
 */
```

### Test design — `sgDefaultDisabled.test.ts`

Three tests, each with explicit numeric expectations.

**1. Bug-existence test** — executable documentation of the bug. The
assertion deliberately verifies the *broken* output so that a future PR which
fixes the math sees a failing test and knows the production default in
`validatorIntegration.ts` can be flipped back.

```ts
import { describe, it, expect } from "vitest";
import { RealTimeSavitzkyGolay } from "../savitzkyGolay";

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
```

**2. Production-bypass test** — proves the default config really skips SG.

```ts
import { ValidatorPhaseDetector } from "../validatorIntegration";

it("default ValidatorPhaseDetector produces smoothedValue equal to normalized input", () => {
  const detector = new ValidatorPhaseDetector("squat");
  // Knee angle of 135° normalizes to (180 - 135) / 90 = 0.5 for squat.
  const result = detector.detectPhase(1000, 135);
  expect(result.smoothedValue).toBeCloseTo(0.5, 5);
});
```

**3. HMM-still-works test** — proves the downstream HMM produces sensible
phase transitions on raw [0,1] input (i.e. the Beta-1 product still works
without SG).

```ts
it("HMM detects squat down→up transition on normalized angles without smoothing", () => {
  const detector = new ValidatorPhaseDetector("squat");
  // Knee angle pattern: standing (180° → idle/up) → deep squat (90° → down) → standing.
  const angles = [180, 170, 150, 120, 100, 90, 100, 120, 150, 170, 180];
  const phases: string[] = [];
  angles.forEach((angle, i) => {
    phases.push(detector.detectPhase(i * 16, angle).phase);
  });
  expect(phases).toContain("down");       // descent registered
  expect(phases[phases.length - 1]).toBe("idle"); // returned to standing
});
```

### War-room tracker edit

```diff
 ### 1. S-G coefficient bug still in production code path

-**Status:** 🔴 open
+**Status:** 🟡 in progress — production bypass shipped, math fix deferred
 **Owner:** Dev
 **Risk:** High — most likely "looks fine in dev, breaks on device" failure mode
+**Resolution (Beta 1):** PR <#> defaulted `smoothing.enabled` to `false` in
+ `validatorIntegration.ts`. Phase detection now runs HMM over raw normalized
+ [0,1] angles. The SG functions remain in the repo marked `@deprecated`; the
+ `sgDefaultDisabled.test.ts` bug-existence test locks in current behavior so a
+ future fix-or-replace PR has a clear green/red signal. Math fix or
+ replacement is a separate follow-up — this concern stays open at the
+ file-level until the SG code is deleted or fixed.

 The Savitzky-Golay smoothing in `src/lib/phaseDetection/savitzkyGolay.ts`
 produces values outside [0,1] (e.g., `27000000002.1875` for constant 0.5 input).
```

And in the changelog table at the bottom:

```diff
 | Date | Concern | Status change | Notes |
 |------|---------|---------------|-------|
 | 2026-05-17 | #6 Brand identity | 🔴 → 🟡 | Brand work scheduled as next branch |
 | 2026-05-26 | #6 Brand identity | 🟡 → 🟢 | Carriage rollout 7/7 merged (PRs #48–#56) + e2e gate restored (#57) |
+| 2026-05-28 | #1 S-G coefficient | 🔴 → 🟡 | Production bypass; math fix deferred (PR <#>) |
```

The status stays 🟡 (not 🟢) because the bug isn't fixed — only routed
around. Honest reflection of state.

## Acceptance

- [ ] `validatorIntegration.ts` has both default flips with the inline code comments.
- [ ] `savitzkyGolay.ts` has `@deprecated` JSDoc on both public entry points.
- [ ] `sgDefaultDisabled.test.ts` exists with all three tests; all three pass on
      `npm run test:mvp` (or `npm run test:extended`, depending on which suite
      Vitest sweeps `phaseDetection/__tests__/` into).
- [ ] War-room tracker concern #1 reads `🟡 in progress` with the Resolution
      sub-entry. Changelog has the new row.
- [ ] `npm run test:release` passes locally (lint + 72 MVP unit + 2 perf-smoke +
      build + e2e gate) before push.
- [ ] CI on the `dev → main` PR (auto-triggered by the release-gate workflow)
      passes on Linux.

## Out of scope (intentional)

- **Fixing the SG math.** Separate follow-up PR. The bug-existence test makes
  that PR self-evidently green-able.
- **Replacing SG with an EMA or other smoother.** Separate follow-up if/when
  smoothing is desired.
- **Settings-page UI for `enhancedPhaseDetectionEnabled`.** Power-user toggle
  remains in localStorage. A real UI deserves its own design pass.
- **Deleting `savitzkyGolay.ts`.** Leaves the door open for a math fix; the
  file-level deletion or fix is tracked by war-room #1 staying open.
- **War-room concern #4 flip.** The CI gate PR landed in #58; #4's tracker
  flip is a separate housekeeping commit, not folded here.

## Risks

- **HMM-on-raw-input may need tuning** — currently the observation matrix mean
  values (e.g., `up: 0.4`, `down: 0.8`) were tuned assuming a *smoothed* input.
  Raw input can fluctuate frame-to-frame (16ms intervals at 60fps), and the
  HMM may register more spurious phase transitions than it did with the
  (broken-but-existent) smoothing dampening swings. **Mitigated by**: the
  existing `debounce` step (3 frames default) at `hmmPhaseDetector.ts:248`
  already filters single-frame flickers. If real-device testing reveals
  excess transitions in beta, the follow-up is bumping `debounce.frames` from
  3 to 5–6 or adding a minimum dwell time — small, isolated change. Not
  blocking for this PR.
- **`enhancedPhaseDetectionEnabled` localStorage flag** can still re-enable
  the broken path for any individual user who has it set in their browser. The
  flag's default is `true` and we're not changing it. Users who explicitly set
  it `true` and have an old localStorage value will be unaffected by this PR.
  **Acceptable**: this flag was a manual debug knob; if anyone explicitly set
  it they presumably know what they're doing. The DEFAULT flow is clean.
- **Bug-existence test is "load-bearing weirdness".** Asserting on broken
  behavior could feel like a code smell. We're calling it out as such in the
  test docstring; the alternative (no test, just docs) drifts.

## Branch & commit shape

Branch: `fix/sg-default-disable-beta1` off `dev`.

Suggested commit shape (single small PR — these can be one commit or four,
your preference; plan will use one for clarity):

1. `fix(phaseDetection): default-disable broken SG smoothing for Beta 1` —
   the two default flips + comments.
2. (Optional split) `docs(phaseDetection): mark broken SG entry points @deprecated`
   — the JSDoc blocks.
3. (Optional split) `test(phaseDetection): lock in SG bug-existence + production-bypass`
   — the new test file.
4. (Optional split) `chore(war-room): flip concern #1 to in-progress` —
   tracker edit.

I lean one-commit because the changes are tightly coupled and individually
half-state. The implementation plan will commit as one.

# Phase-Detection EMA Smoother Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mathematically-broken Savitzky-Golay smoothing with a correct EMA smoother, re-enable smoothing in production, delete the broken code, and flip war-room #1 to 🟢 — without regressing the squat/pushup/plank rep-count tests.

**Architecture:** A tiny `EmaSmoother` (seed-first exponential moving average, α = 2/(windowSize+1) ≈ 0.33) replaces `RealTimeSavitzkyGolay` behind the HMM's existing `addPoint`/`clear` interface. Smoothing is re-enabled in both validator config defaults. The broken module and its bug-pinning test are deleted; a new test pins the *correct* round-trip behavior.

**Tech Stack:** TypeScript, Vitest. npm (not pnpm). Next.js 16 (build must stay green).

**Branch:** `fix/phase-detection-ema` (cut from `dev`; spec committed).

**Commit trailer:** every commit ends with a blank line then `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

**Build-safe ordering:** EMA module → rewire HMM (HMM stops importing S-G) → re-enable config → replace pinning test (drops the S-G-importing test) → delete S-G + fix extended test (last S-G importer) → rep-count checkpoint → gate/tracker. Every task leaves the build green.

---

## File Structure

**Create:**
- `src/lib/phaseDetection/ema.ts` — `EmaSmoother` + `alphaFromWindow`.
- `src/__tests__/mvp/ema.test.ts` — unit tests for the smoother.
- `src/__tests__/mvp/emaSmoothing.test.ts` — integration pinning test (replaces `sgDefaultDisabled.test.ts`).

**Modify:**
- `src/lib/phaseDetection/hmmPhaseDetector.ts` — use `EmaSmoother`.
- `src/lib/phaseDetection/validatorIntegration.ts` — re-enable smoothing (2 defaults).
- `src/lib/phaseDetection/__tests__/phaseDetection.test.ts` — drop S-G-specific block/import.
- `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` — #1 → 🟢.

**Delete:**
- `src/lib/phaseDetection/savitzkyGolay.ts`
- `src/__tests__/mvp/sgDefaultDisabled.test.ts`

---

## Task 1: EmaSmoother module (TDD)

**Files:**
- Create: `src/lib/phaseDetection/ema.ts`
- Test: `src/__tests__/mvp/ema.test.ts`

- [ ] **Step 1: Write the failing test** — `src/__tests__/mvp/ema.test.ts`:
```ts
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
```

- [ ] **Step 2: Run it, confirm FAIL** — `npx vitest run src/__tests__/mvp/ema.test.ts` → module not found.

- [ ] **Step 3: Implement** `src/lib/phaseDetection/ema.ts`:
```ts
/**
 * Exponential moving average smoother for phase-detection angle signals.
 *
 * Replaces the broken Savitzky-Golay filter (war-room #1). Properties:
 *  - seed-first: the first sample is passed through, so a constant input
 *    round-trips exactly (no warm-up error).
 *  - output is a convex combination of inputs, so it stays within the input
 *    range — for normalized [0,1] angles the HMM observation means remain valid.
 */
export class EmaSmoother {
  private smoothed: number | null = null;

  /** @param alpha smoothing factor in (0, 1]; higher = more responsive. */
  constructor(private alpha: number) {}

  addPoint(_timestamp: number, value: number): number {
    this.smoothed =
      this.smoothed === null
        ? value
        : this.alpha * value + (1 - this.alpha) * this.smoothed;
    return this.smoothed;
  }

  clear(): void {
    this.smoothed = null;
  }
}

/** Map an effective window size to an EMA alpha via the standard 2/(N+1). */
export function alphaFromWindow(windowSize: number): number {
  return 2 / (Math.max(1, windowSize) + 1);
}
```

- [ ] **Step 4: Run it, confirm PASS** (5 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/phaseDetection/ema.ts src/__tests__/mvp/ema.test.ts
git commit -m "feat(phaseDetection): EMA smoother (correct, seed-first, range-preserving)"
```

---

## Task 2: Wire EMA into the HMM detector

**Files:**
- Modify: `src/lib/phaseDetection/hmmPhaseDetector.ts`

- [ ] **Step 1: Swap the import** — replace line 17
  `import { RealTimeSavitzkyGolay } from './savitzkyGolay';`
  with
  `import { EmaSmoother, alphaFromWindow } from './ema';`

- [ ] **Step 2: Change the field type** — line 27
  `private smoothingFilter: RealTimeSavitzkyGolay;`
  → `private smoothingFilter: EmaSmoother;`

- [ ] **Step 3: Change the constructor instantiation** — lines 36-39, replace:
```ts
    this.smoothingFilter = new RealTimeSavitzkyGolay(
      detectorConfig.smoothing.windowSize,
      detectorConfig.smoothing.polynomialOrder
    );
```
with:
```ts
    this.smoothingFilter = new EmaSmoother(
      alphaFromWindow(detectorConfig.smoothing.windowSize)
    );
```

- [ ] **Step 4: Change the reconstruction in updateConfig** — near line 381, replace the
  `new RealTimeSavitzkyGolay(...)` there with the same
  `new EmaSmoother(alphaFromWindow(<config>.smoothing.windowSize))`. READ the
  surrounding lines first to use the correct config variable name in scope (it
  reconstructs the filter when config changes). The `.addPoint(...)` (line ~210)
  and `.clear()` (line ~370) call sites are unchanged.

- [ ] **Step 5: Verify** — `npx tsc --noEmit` (no new error in this file;
  `savitzkyGolay.ts` still exists so nothing else breaks yet) and
  `npx vitest run src/lib/phaseDetection/__tests__/phaseDetection.test.ts`
  (extended HMM tests — the smoothing-enabled cases now run through EMA). If a
  pre-existing assertion there was S-G-specific and now fails, note it; it will be
  cleaned in Task 5. Build check: `npm run build` should still pass.

- [ ] **Step 6: Commit**
```bash
git add src/lib/phaseDetection/hmmPhaseDetector.ts
git commit -m "refactor(phaseDetection): drive HMM smoothing through EmaSmoother"
```

---

## Task 3: Re-enable smoothing in production config

**Files:**
- Modify: `src/lib/phaseDetection/validatorIntegration.ts`

- [ ] **Step 1: Flip `createConfigFromValidator`** — in the `smoothing` block, change
  `enabled: enhancedConfig?.smoothing?.enabled ?? false,`
  to
  `enabled: enhancedConfig?.smoothing?.enabled ?? true,`
  and replace the multi-line war-room bypass comment above it with:
  `// EMA smoother (war-room #1 fixed). Smoothing on by default; HMM consumes [0,1].`

- [ ] **Step 2: Flip `createDefaultEnhancedPhaseConfig`** — in its `smoothing` block change
  `enabled: false,` to `enabled: true,` and replace its bypass comment with
  `// EMA smoother (war-room #1 fixed).`

- [ ] **Step 3: Verify** — `npm run lint` clean; `npx tsc --noEmit` no new error.

- [ ] **Step 4: Commit**
```bash
git add src/lib/phaseDetection/validatorIntegration.ts
git commit -m "feat(phaseDetection): re-enable smoothing (now backed by EMA)"
```

---

## Task 4: Replace the bug-pinning test

**Files:**
- Delete: `src/__tests__/mvp/sgDefaultDisabled.test.ts`
- Create: `src/__tests__/mvp/emaSmoothing.test.ts`

- [ ] **Step 1: Delete the old pinning test** — `git rm src/__tests__/mvp/sgDefaultDisabled.test.ts`

- [ ] **Step 2: Create `src/__tests__/mvp/emaSmoothing.test.ts`** (inverts the old
  "bug exists" assertion to a "math is correct" assertion; keeps the HMM check):
```ts
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
```

- [ ] **Step 3: Run it, confirm PASS** — `npx vitest run src/__tests__/mvp/emaSmoothing.test.ts`.
  If test 2 (`smoothedValue` close to 0.5) fails because the detector needs more
  frames to converge, increase the loop count — but it should round-trip a
  constant from the seed. If the HMM test fails, STOP — that is the same signal as
  the Task 6 checkpoint (re-enabled smoothing changed detection); debug per Task 6
  before continuing.

- [ ] **Step 4: Commit**
```bash
git add src/__tests__/mvp/emaSmoothing.test.ts
git commit -m "test(phaseDetection): pin correct EMA round-trip (replaces SG bug-pin)"
```

---

## Task 5: Delete the broken Savitzky-Golay module

**Files:**
- Delete: `src/lib/phaseDetection/savitzkyGolay.ts`
- Modify: `src/lib/phaseDetection/__tests__/phaseDetection.test.ts`

- [ ] **Step 1: Remove the S-G usage from the extended test** — in
  `src/lib/phaseDetection/__tests__/phaseDetection.test.ts`:
  - Delete the import on line 9: `import { applySavitzkyGolaySmoothing, RealTimeSavitzkyGolay } from '../savitzkyGolay';`
  - Delete the entire `describe('Savitzky-Golay Smoothing', () => { ... })` block
    (begins ~line 15, includes the `applySavitzkyGolaySmoothing` and
    `new RealTimeSavitzkyGolay(5, 2, 0)` cases through its closing `});` — roughly
    lines 15-72; READ the file to find the exact closing brace).
  - Leave the HMM/detector describe blocks intact (they use `config.smoothing`,
    which now drives EMA). The `enabled: false` cases stay valid.

- [ ] **Step 2: Delete the module** — `git rm src/lib/phaseDetection/savitzkyGolay.ts`

- [ ] **Step 3: Confirm no references remain** —
  `grep -rn "savitzkyGolay\|SavitzkyGolay" src/ || echo "no references"` → expect
  `no references`. If anything remains, fix it (it must be an importer missed above).

- [ ] **Step 4: Verify** — `npx tsc --noEmit` (no error about the deleted module),
  `npx vitest run src/lib/phaseDetection/__tests__/phaseDetection.test.ts` (passes),
  `npm run build` (green).

- [ ] **Step 5: Commit**
```bash
git add src/lib/phaseDetection/__tests__/phaseDetection.test.ts
git rm already staged savitzkyGolay.ts
git commit -m "refactor(phaseDetection): delete broken Savitzky-Golay module"
```
(If `git rm` was already run in Step 2 it is staged; just `git add` the test file and commit.)

---

## Task 6: HARD CHECKPOINT — rep-count tests must stay green with EMA on

**Files:** none unless tuning is required (then `src/lib/phaseDetection/ema.ts` or the smoothing `windowSize`).

- [ ] **Step 1: Run the rep-count suite**
  `npx vitest run src/__tests__/mvp/testPoseScripts.test.ts`
  Expected: all pass (squat counts a rep, pushup counts a rep, plank completes a
  hold, plus the non-counting assertions). These previously ran on raw input;
  they must still pass now that EMA smoothing is on.

- [ ] **Step 2: If all pass — done, proceed to Task 7.**

- [ ] **Step 3: If any FAIL — STOP and debug systematically** (use
  superpowers:systematic-debugging; do NOT weaken the assertions). Procedure:
  1. Add a temporary diagnostic that traces, per frame, the raw normalized angle,
     the EMA-smoothed value, the detected phase, and the running rep count for the
     failing exercise (mirror the approach used in the earlier pushup-fixture
     investigation). Identify whether a needed `down`/`up` transition no longer
     crosses the HMM means because EMA over-smoothed the peak, or whether spurious
     transitions appear.
  2. Tune α: if a rep is MISSED (over-smoothed, transition didn't register),
     increase α (more responsive) — e.g., change `alphaFromWindow` to use a
     smaller effective window, or raise the smoothing `windowSize`→α mapping. If
     EXTRA reps appear (jitter), decrease α. Make ONE change, re-run, repeat.
  3. Delete the diagnostic once green.
  Record the final α and the reasoning in the commit message.

- [ ] **Step 4: Commit any tuning**
```bash
git add src/lib/phaseDetection/ema.ts
git commit -m "fix(phaseDetection): tune EMA alpha so rep-count tests pass with smoothing on"
```
(Skip this commit if no tuning was needed.)

---

## Task 7: Full gate, tracker → 🟢, push

**Files:**
- Modify: `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`

- [ ] **Step 1: Full local gate**
  `npm run lint` (clean) · `npm run test` (all pass, incl. `ema`, `emaSmoothing`,
  `testPoseScripts`) · `npm run build` (green).

- [ ] **Step 2: Flip tracker #1 to 🟢** — in `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`,
  change the `### 1.` block `**Status:**` line to:
  `**Status:** 🟢 resolved (2026-05-30) — broken S-G deleted; correct EMA smoother shipped + enabled`
  and append a Resolution Log row:
  `| 2026-05-30 | #1 S-G coefficient | 🟡 → 🟢 | Deleted broken Savitzky-Golay; shipped correct EMA smoother (α=2/(windowSize+1)), re-enabled smoothing, inverted the pinning test, rep-count tests green |`

- [ ] **Step 3: Commit + push**
```bash
git add docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
git commit -m "docs(war-room): #1 resolved — EMA smoother replaces broken Savitzky-Golay"
git push -u origin fix/phase-detection-ema
```
(Do NOT run `gh pr create`.)

- [ ] **Step 4: Invoke superpowers:finishing-a-development-branch** and present completion options with a paste-ready PR body.

---

## Self-Review

**Spec coverage:** EMA module + alphaFromWindow (T1) ✓; wire into HMM replacing S-G (T2) ✓; re-enable both config defaults (T3) ✓; delete savitzkyGolay.ts + fix extended test (T5) ✓; replace pinning test, invert bug-existence → round-trip (T4) ✓; rep-count hard checkpoint with tuning contingency (T6) ✓; tracker → 🟢 (T7) ✓. Non-goals (no S-G re-derivation, no HMM retune) respected. α = 2/(windowSize+1) per the decision ✓.

**Placeholder scan:** no TBD/implement-later; every code step shows code. Tasks 2/4/5 say "READ the file first" only to locate exact line/brace positions for edits weaving into existing files — the change itself is fully specified. T6 is intentionally contingent (debug + tune) — that is the spec's explicit risk, not a placeholder.

**Type consistency:** `EmaSmoother(alpha)`, `alphaFromWindow(windowSize)`, `addPoint(ts, value)`, `clear()` are identical across T1/T2/T4. The HMM call sites (`addPoint`, `clear`) are unchanged, matching the new class's surface. `smoothing.windowSize` (kept in config) feeds `alphaFromWindow`; `polynomialOrder` remains in the config type but is no longer passed to the smoother (noted in T2).

# SG Default-Disable for Beta 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the broken Savitzky-Golay (SG) path from the production phase-detection chain for Beta 1 by flipping two `?? true` → `?? false` defaults, marking the SG entry points `@deprecated`, adding three pinning tests (bug-existence + production-bypass + HMM-still-works), and flipping war-room concern #1 from 🔴 to 🟡. No SG math is rewritten.

**Architecture:** Four files touched. The HMM (downstream of SG) already gracefully handles `smoothing.enabled === false` by feeding raw normalized [0,1] angles straight through the Viterbi observation step. The default flips simply route around the broken SG; the buggy code stays in the repo (now marked deprecated and protected by a bug-existence test) so a follow-up PR can fix the math or replace it without scope-creeping this one.

**Tech Stack:** Next.js 16 / React 19 / TypeScript (`ai-form-coach/`), Vitest, Playwright (gate-only, not changed here). Node 22.

**Branch:** `fix/sg-default-disable-beta1` (already cut off `origin/dev` HEAD `d7d40be`).

**Spec:** `ai-form-coach/docs/superpowers/specs/2026-05-28-sg-default-disable-design.md`

**Commit shape:** Single commit at Task 4. **Do not commit between earlier tasks** — the change is tightly coupled and intermediate states are half-finished (e.g., tests landing before defaults flip will fail). Stage edits as you go; commit once everything is green.

---

## File map

**Create:**
- `ai-form-coach/src/__tests__/mvp/sgDefaultDisabled.test.ts` — the three pinning tests. Lives under `src/__tests__/mvp/` so it runs in `npm run test:mvp` and therefore the CI release-gate (which calls `npm run test`).

**Modify:**
- `ai-form-coach/src/lib/phaseDetection/validatorIntegration.ts` — two default flips at lines 52 and 263.
- `ai-form-coach/src/lib/phaseDetection/savitzkyGolay.ts` — two `@deprecated` JSDoc blocks (no code change).
- `ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` — concern #1 status flip + Resolution sub-entry + changelog row.

---

## Task 1: Add the three pinning tests (TDD red-then-green)

**Files:**
- Create: `ai-form-coach/src/__tests__/mvp/sgDefaultDisabled.test.ts`

- [ ] **Step 1.1: Create the test file**

Write `ai-form-coach/src/__tests__/mvp/sgDefaultDisabled.test.ts` with this exact content:

```ts
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
  it("default ValidatorPhaseDetector produces smoothedValue equal to normalized input", () => {
    const detector = new ValidatorPhaseDetector("squat");
    // Knee angle of 135° normalizes to (180 - 135) / 90 = 0.5 for squat.
    const result = detector.detectPhase(1000, 135);
    expect(result.smoothedValue).toBeCloseTo(0.5, 5);
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
```

- [ ] **Step 1.2: Run the test file in isolation — expected RED on two of three**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27/ai-form-coach
npx vitest run src/__tests__/mvp/sgDefaultDisabled.test.ts
```

Expected: 3 total tests, **1 pass + 2 fail**.

- The bug-existence test ✅ **PASSES** (the SG math is genuinely broken right now — `lastOutput` will be a massive number, definitely more than 0.01 away from 0.5).
- The production-bypass test ❌ **FAILS** with something like `expected 27000000002.1875 to be close to 0.5`. This is because `smoothing.enabled` still defaults to `true` and the broken SG path produces garbage.
- The HMM-still-works test ❌ **FAILS** because the broken SG produces values so far outside [0,1] that the HMM observation likelihoods collapse to ~0 and the Viterbi backtrack returns whatever state the transition prior favors — usually `idle` for all frames (so no `down` registered).

**If the result deviates from this pattern, STOP and investigate.** The two failures should be in the production-bypass test and the HMM-still-works test, not the bug-existence test. If the bug-existence test fails, the math is already not as broken as we think, and the rest of the plan needs reassessment.

- [ ] **Step 1.3: Do NOT commit. Move on to Task 2.**

The test file stays unstaged for now. We'll stage and commit everything together at Task 4.

---

## Task 2: Flip the two production defaults

**Files:**
- Modify: `ai-form-coach/src/lib/phaseDetection/validatorIntegration.ts` (lines 50–55 and 261–266).

- [ ] **Step 2.1: First flip — `createConfigFromValidator` smoothing default**

Use the Edit tool on `ai-form-coach/src/lib/phaseDetection/validatorIntegration.ts`.

**old_string** (exactly lines 50–55, indentation preserved):

```
    return {
      exercise: this.exercise,
      smoothing: {
        enabled: enhancedConfig?.smoothing?.enabled ?? true,
        windowSize: enhancedConfig?.smoothing?.windowSize ?? 5,
        polynomialOrder: enhancedConfig?.smoothing?.polynomialOrder ?? 2,
      },
```

**new_string**:

```
    return {
      exercise: this.exercise,
      smoothing: {
        // War-room concern #1 — SG math is broken. Production bypasses the SG
        // path until the math is fixed or replaced. HMM downstream works fine
        // on raw normalized [0,1] angles. See sgDefaultDisabled.test.ts for
        // the bug-existence pinning record.
        enabled: enhancedConfig?.smoothing?.enabled ?? false,
        windowSize: enhancedConfig?.smoothing?.windowSize ?? 5,
        polynomialOrder: enhancedConfig?.smoothing?.polynomialOrder ?? 2,
      },
```

- [ ] **Step 2.2: Second flip — `createDefaultEnhancedPhaseConfig` smoothing default**

Use the Edit tool on the same file.

**old_string** (exactly the smoothing block around lines 262–266):

```
    smoothing: {
      enabled: true,
      windowSize: 5,
      polynomialOrder: 2,
    },
```

**new_string**:

```
    smoothing: {
      // War-room concern #1 — broken math, production bypassed until fixed.
      enabled: false,
      windowSize: 5,
      polynomialOrder: 2,
    },
```

> **CRITICAL:** There are **three** `enabled: true,` lines clustered in this function (smoothing at ~263, hmm at ~268, debounce at ~273). Only flip the **smoothing** one. If your Edit tool reports "more than one match," widen the `old_string` until it matches uniquely (e.g., include the wrapping `smoothing: {` line as shown above).

- [ ] **Step 2.3: Re-run the test file — expected ALL GREEN**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27/ai-form-coach
npx vitest run src/__tests__/mvp/sgDefaultDisabled.test.ts
```

Expected: **3 tests, 3 pass, 0 fail**.

- Bug-existence test still passes (the SG math is still broken; the test isn't affected by the flip).
- Production-bypass test now passes (default config goes through `smoothing.enabled = false` → `smoothedValue = rawValue` in `hmmPhaseDetector.ts` line 208–211).
- HMM-still-works test now passes (HMM sees real normalized [0,1] angles and the Viterbi correctly detects the descent).

**If any test fails, STOP.** Most likely failure mode: the flip didn't land where expected (wrong `enabled: true` got changed, or only one of the two flips happened). Re-grep for `enabled: enhancedConfig?.smoothing?.enabled` and `enabled: true,` inside `validatorIntegration.ts` to confirm exact line counts.

- [ ] **Step 2.4: Do NOT commit. Move on to Task 3.**

---

## Task 3: `@deprecated` JSDoc + war-room tracker edit

**Files:**
- Modify: `ai-form-coach/src/lib/phaseDetection/savitzkyGolay.ts` (two JSDoc additions).
- Modify: `ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` (concern #1 status + changelog row).

- [ ] **Step 3.1: `@deprecated` JSDoc on `applySavitzkyGolaySmoothing`**

Use the Edit tool on `ai-form-coach/src/lib/phaseDetection/savitzkyGolay.ts`.

**old_string** (exactly the existing JSDoc + function signature around lines 212–215):

```
/**
 * Apply Savitzky-Golay smoothing to a time series
 */
export function applySavitzkyGolaySmoothing(
```

**new_string**:

```
/**
 * Apply Savitzky-Golay smoothing to a time series
 *
 * @deprecated Math is broken. See war-room concern #1 in
 *   `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`. The coefficient extractor
 *   sums when it should pick (overshoots by ~(polynomialOrder + 1)×), the
 *   post-convolution `/= validPoints` normalization is incorrect, and
 *   `calculateSimplifiedInverse` for windowSize > 3 is element-wise reciprocal
 *   instead of pseudo-inverse. Constant input does NOT round-trip.
 *
 *   Production uses `enabled: false` in the config (default since this PR).
 *   Do not re-enable without fixing the math; see `sgDefaultDisabled.test.ts`
 *   for the bug-existence pinning test that fails on a future correct
 *   implementation.
 */
export function applySavitzkyGolaySmoothing(
```

- [ ] **Step 3.2: `@deprecated` JSDoc on `RealTimeSavitzkyGolay`**

Use the Edit tool on the same file.

**old_string** (existing class JSDoc + opening line):

```
/**
 * Apply real-time Savitzky-Golay smoothing with a sliding window
 */
export class RealTimeSavitzkyGolay {
```

**new_string**:

```
/**
 * Apply real-time Savitzky-Golay smoothing with a sliding window
 *
 * @deprecated Math is broken. See war-room concern #1 in
 *   `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`. The coefficient extractor
 *   sums when it should pick (overshoots by ~(polynomialOrder + 1)×) and
 *   `calculateSimplifiedInverse` for windowSize > 3 is element-wise reciprocal
 *   instead of pseudo-inverse. Constant input does NOT round-trip — `addPoint`
 *   fed a constant 0.5 returns values like 27000000002.1875 for the production
 *   config (windowSize=5, polynomialOrder=2).
 *
 *   Production uses `smoothing.enabled = false` in the config (default since
 *   this PR). Do not re-instantiate this class without fixing the math; see
 *   `sgDefaultDisabled.test.ts` for the bug-existence pinning test that fails
 *   on a future correct implementation.
 */
export class RealTimeSavitzkyGolay {
```

- [ ] **Step 3.3: Flip war-room concern #1 status**

Use the Edit tool on `ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`.

**old_string** (concern #1 status + owner block):

```
**Status:** 🔴 open
**Owner:** Dev
**Risk:** High — most likely "looks fine in dev, breaks on device" failure mode
```

**new_string**:

```
**Status:** 🟡 in progress — production bypass shipped, math fix deferred
**Owner:** Dev
**Risk:** High — most likely "looks fine in dev, breaks on device" failure mode
**Resolution (Beta 1):** Defaulted `smoothing.enabled` to `false` in
`validatorIntegration.ts` (both `createConfigFromValidator` and
`createDefaultEnhancedPhaseConfig`). Phase detection now runs HMM over raw
normalized [0,1] angles. The SG functions remain in the repo marked
`@deprecated`; `src/__tests__/mvp/sgDefaultDisabled.test.ts` locks in the
current broken behavior so a future fix-or-replace PR has a clear green/red
signal. Math fix or replacement is a separate follow-up — this concern stays
🟡 until the SG code is deleted or fixed.
```

- [ ] **Step 3.4: Add the changelog row**

Use the Edit tool on the same file.

**old_string** (last two existing changelog rows + the empty line + horizontal rule):

```
| 2026-05-17 | #6 Brand identity | 🔴 → 🟡 | Brand work scheduled as next branch |
| 2026-05-26 | #6 Brand identity | 🟡 → 🟢 | Carriage rollout 7/7 merged (PRs #48–#56) + e2e gate restored (#57) |

---
```

**new_string** (adds one row beneath the existing two, preserves the trailing horizontal rule):

```
| 2026-05-17 | #6 Brand identity | 🔴 → 🟡 | Brand work scheduled as next branch |
| 2026-05-26 | #6 Brand identity | 🟡 → 🟢 | Carriage rollout 7/7 merged (PRs #48–#56) + e2e gate restored (#57) |
| 2026-05-28 | #1 S-G coefficient | 🔴 → 🟡 | Production bypass; math fix deferred |

---
```

- [ ] **Step 3.5: Sanity-check the tracker edits**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27
grep -A2 "^### 1\." ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md | head -6
```

Expected output: line `### 1. S-G coefficient bug still in production code path`, blank line, `**Status:** 🟡 in progress — production bypass shipped, math fix deferred`.

```bash
tail -10 ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
```

Expected: the changelog table shows three rows ending with the new 2026-05-28 row.

- [ ] **Step 3.6: Do NOT commit. Move on to Task 4 for the final verification + single commit.**

---

## Task 4: Full verification + single commit + push

**Files:** none modified by this task — it stages everything from Tasks 1–3 and produces a single commit.

- [ ] **Step 4.1: Lint + typecheck**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27/ai-form-coach && npm run lint
```

Expected: clean exit, no errors.

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27/ai-form-coach && npx tsc --noEmit
```

Expected: no new TypeScript errors. (Pre-existing errors in `src/__tests__/integration/user-flows.test.ts` and `src/lib/progression/engine.test.ts` are tolerated per CLAUDE.md and prior chore PRs — leave them.)

- [ ] **Step 4.2: Run the MVP unit suite — confirm the new tests are picked up + all green**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27/ai-form-coach && npm run test
```

Expected: **all tests pass**, total now `75 passed (75)` (the previous 72 MVP tests plus the 3 new tests in `sgDefaultDisabled.test.ts`). The test runner reports the new file: `✓ src/__tests__/mvp/sgDefaultDisabled.test.ts (3 tests)`.

If the count is still 72, the new test file isn't being picked up — check that it's saved under `src/__tests__/mvp/` (NOT `src/lib/phaseDetection/__tests__/`).

- [ ] **Step 4.3: Run the production build**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27/ai-form-coach && npm run build
```

Expected: build completes successfully. The build doesn't exercise the phase-detection path, so a green build only confirms the JSDoc additions didn't break TypeScript compilation.

- [ ] **Step 4.4: Stage all changes**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27
git add \
  ai-form-coach/src/__tests__/mvp/sgDefaultDisabled.test.ts \
  ai-form-coach/src/lib/phaseDetection/validatorIntegration.ts \
  ai-form-coach/src/lib/phaseDetection/savitzkyGolay.ts \
  ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
git status --short | grep -v "^??"
```

Expected: exactly four staged entries:
```
A  ai-form-coach/src/__tests__/mvp/sgDefaultDisabled.test.ts
M  ai-form-coach/src/lib/phaseDetection/savitzkyGolay.ts
M  ai-form-coach/src/lib/phaseDetection/validatorIntegration.ts
M  ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
```

If anything else is staged, unstage it (`git reset HEAD <path>`) — only these four files should change.

- [ ] **Step 4.5: Single commit**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27
git commit -m "$(cat <<'EOF'
fix(phaseDetection): default-disable broken SG smoothing for Beta 1

War-room concern #1. The Savitzky-Golay implementation in
src/lib/phaseDetection/savitzkyGolay.ts has three independent bugs
(coefficient extractor sums when it should pick, post-convolution
/= validPoints normalization is incorrect, calculateSimplifiedInverse
for windowSize > 3 is element-wise reciprocal instead of pseudo-inverse).
For windowSize=5, polynomialOrder=2 (the production config) a constant
0.5 input produces ~27000000002 — the HMM observation matrix downstream
expects values in [0,1] and collapses to garbage Viterbi decisions.

This PR routes around the broken filter without rewriting the math:

  - validatorIntegration.ts: flip both smoothing.enabled defaults from
    true to false. HMM continues to work; it reads raw normalized [0,1]
    angles (clamped by normalizeAngleForPhaseDetection) instead of
    smoothed values.

  - savitzkyGolay.ts: @deprecated JSDoc on applySavitzkyGolaySmoothing
    and RealTimeSavitzkyGolay, with the exact failure mode documented.
    No code change — the SG file stays for a future fix-or-replace.

  - sgDefaultDisabled.test.ts (NEW, src/__tests__/mvp/): three tests.
    (1) bug-existence pins the current broken behavior so a future
    math-fix PR sees this test fail (signal the production default
    can flip back). (2) production-bypass confirms default config
    skips SG. (3) HMM-still-works confirms phase transitions register
    on raw normalized angles for a known squat pattern.

  - Tracker: concern #1 from 🔴 open to 🟡 in progress with Resolution
    sub-entry + changelog row dated 2026-05-28. Stays 🟡 (not 🟢) until
    the SG code is fixed or deleted in a follow-up.

Spec: docs/superpowers/specs/2026-05-28-sg-default-disable-design.md

War-room concern: #1.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Verify the commit landed cleanly:

```bash
git log --oneline -1
git show --stat HEAD
```

Expected: one new commit on top of `d9c7de4` (the spec commit), changing exactly 4 files (1 added, 3 modified).

- [ ] **Step 4.6: Push**

```bash
git push -u origin fix/sg-default-disable-beta1
```

Expected output includes:
```
Create a pull request for 'fix/sg-default-disable-beta1' on GitHub by visiting:
     https://github.com/PaladinKnightMaster/AI_Form_Coach/pull/new/fix/sg-default-disable-beta1
```

The push does **NOT** trigger CI (the workflow's only triggers are `pull_request: branches: [main]` and `workflow_dispatch`). The real verification happens when the human opens the dev → main PR after this lands on dev.

---

## Task 5: Compose the paste-ready PR body

**Files:** none modified — prepares text the human pastes when opening the PR via the create-PR URL.

- [ ] **Step 5.1: Verify the branch state is clean and up to date**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27
git status --short
git log --oneline origin/dev..HEAD
```

Expected: no unstaged/uncommitted changes, two commits on top of `origin/dev` (the spec commit `d9c7de4` and the implementation commit from Task 4).

- [ ] **Step 5.2: Compose the PR body**

Hand the human a paste-ready PR body that includes:

1. **Summary** — three bullets covering: (a) production now bypasses broken SG, (b) HMM still detects phases on raw normalized angles, (c) bug-existence test pins behavior for a future fix-PR.
2. **Why this PR exists** — short pointer to war-room concern #1 with the constant-0.5 example.
3. **What changed** — scope table with the four files and one-line per change.
4. **Verification** — note that `npm run test:release` passed locally (lint + 75 MVP unit + 2 perf-smoke + build + e2e gate). Note that CI on the dev → main PR will exercise this end-to-end on Linux.
5. **Follow-ups** — the actual SG math fix or EMA replacement; the `enhancedPhaseDetectionEnabled` localStorage settings-page UI (separate design pass); the SG file deletion (only after we're sure no one needs it).
6. **Out of scope** — no SG math rewrite, no UI for the flag, no changes to the existing `enhancedPhaseDetectionEnabled` localStorage default.

Per `CLAUDE.md`, **do not run `gh pr create`**. Present the paste-ready PR body and the create-PR URL printed by Task 4.6's push; the human opens it manually.

- [ ] **Step 5.3: Stop**

---

## Verification summary

After Task 4 commits and Task 5 hands off, the PR shows:

- **1 file added** (`sgDefaultDisabled.test.ts`).
- **3 files modified** (`validatorIntegration.ts`, `savitzkyGolay.ts`, `11_BETA1_CONCERNS_TRACKER.md`).
- **+~120 lines, −0 lines** (mostly JSDoc + the test file).
- **`npm run test:release` passes locally** — 75 MVP unit + 2 perf-smoke + production build + e2e gate.
- **War-room tracker** shows concern #1 at 🟡, changelog row dated 2026-05-28.

If all of the above is true, the broken SG path is no longer reachable from production, the HMM produces meaningful phase decisions on raw normalized angles for Beta 1, and a future fix-or-replace PR has a clear green/red signal from the bug-existence test.

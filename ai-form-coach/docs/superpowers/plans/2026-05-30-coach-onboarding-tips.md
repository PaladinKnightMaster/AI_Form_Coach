# Coach Onboarding Tips Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A one-time, premium "Set the scene" tips interstitial before the first coach session that sets up the user and gently communicates single-camera expectations (war-room #13 → 🟢).

**Architecture:** A pure gating helper + an accessible modal (`CoachTipsCard`) mounted by `CoachPage` after the required safety gate; shown once via a versioned localStorage flag, suppressed under the e2e bypass, re-openable from a sidebar "Setup tips" link.

**Tech Stack:** Next 16 App Router, React 19, Vitest (+ @testing-library/react for the component test), Playwright. npm (not pnpm).

**Branch:** `feat/coach-tips` (cut from `dev`; spec `1afdec7`).

**Commit trailer:** every commit ends with a blank line then `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure
- **Create** `src/lib/coach/coachTips.ts` — `shouldShowCoachTips` + `COACH_TIPS_SEEN_KEY`.
- **Create** `src/__tests__/mvp/coachTips.test.ts` — helper unit test.
- **Create** `src/components/coach/CoachTipsCard.tsx` — the accessible modal.
- **Create** `src/__tests__/mvp/coachTipsCard.test.tsx` — component a11y test (gate gap safety net).
- **Modify** `src/app/(coach)/coach/page.tsx` — state, hydration-safe effect, ordering, handlers.
- **Modify** `src/components/coach/CoachExperienceView.tsx` — `onShowTips` prop + sidebar "Setup tips" button.
- **Modify** `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` — #13 → 🟢.

---

## Task 1: gating helper (TDD)

**Files:** Create `src/lib/coach/coachTips.ts`, Test `src/__tests__/mvp/coachTips.test.ts`

- [ ] **Step 1: Write the failing test** (`src/__tests__/mvp/coachTips.test.ts`):
```ts
import { describe, it, expect } from "vitest";
import { shouldShowCoachTips, COACH_TIPS_SEEN_KEY } from "@/lib/coach/coachTips";

describe("shouldShowCoachTips", () => {
  it("shows when unseen and not e2e", () => {
    expect(shouldShowCoachTips(false, false)).toBe(true);
  });
  it("hides when already seen", () => {
    expect(shouldShowCoachTips(true, false)).toBe(false);
  });
  it("hides under e2e even if unseen (never blocks the harness)", () => {
    expect(shouldShowCoachTips(false, true)).toBe(false);
  });
  it("exposes a versioned storage key", () => {
    expect(COACH_TIPS_SEEN_KEY).toBe("carriage.coachTipsSeenV1");
  });
});
```

- [ ] **Step 2: Run it, confirm FAIL** — `npx vitest run src/__tests__/mvp/coachTips.test.ts`.

- [ ] **Step 3: Implement** `src/lib/coach/coachTips.ts`:
```ts
/** Versioned so a future tips refresh can re-prompt. */
export const COACH_TIPS_SEEN_KEY = "carriage.coachTipsSeenV1";

/** Show the one-time tips card only when unseen and not under the e2e bypass. */
export function shouldShowCoachTips(seen: boolean, isE2E: boolean): boolean {
  return !seen && !isE2E;
}
```

- [ ] **Step 4: Run it, confirm PASS** (4 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/coach/coachTips.ts src/__tests__/mvp/coachTips.test.ts
git commit -m "feat(coach): gating helper for the one-time tips card"
```

---

## Task 2: CoachTipsCard component + a11y test

**Files:** Create `src/components/coach/CoachTipsCard.tsx`, Test `src/__tests__/mvp/coachTipsCard.test.tsx`

- [ ] **Step 1: Create `src/components/coach/CoachTipsCard.tsx`** EXACTLY:
```tsx
"use client";

import { useEffect, useRef } from "react";

const INTRO =
  "Carriage reads your form from a single camera. A clear, side-on view is all it needs to coach you well — a quiet minute of setup makes every session sharper.";

const TIPS = [
  { label: "Turn side-on", detail: "Stand about 30–45° to the camera so each working joint stays in view." },
  { label: "Light it softly", detail: "Face an even light; keep bright windows ahead of you, not behind." },
  { label: "Wear something fitted", detail: "Close-fitting layers let the coach trace your true line." },
  { label: "Make space", detail: "Step back roughly six feet, until shoulders to ankles rest comfortably in frame." },
] as const;

const LIMITS =
  "Carriage is a single-camera companion, not a clinic — read its counts and angles as considered guidance, a mirror for your practice rather than a precise measurement.";

export default function CoachTipsCard({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    headingRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-tips-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-md space-y-5 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100">
        <h2 id="coach-tips-heading" ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none">
          Set the scene
        </h2>
        <p className="text-sm text-slate-300">{INTRO}</p>
        <ul className="space-y-3">
          {TIPS.map((t) => (
            <li key={t.label} className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-white">{t.label}</span>
              <span className="text-sm text-slate-300">{t.detail}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-5 text-slate-400">{LIMITS}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          I&apos;m ready
        </button>
      </div>
    </div>
  );
}
```
(Colors are AA on `bg-slate-900`: `text-slate-300` ≈ 12:1, `text-slate-400` ≈ 7:1, white-on-emerald-600 passes.)

- [ ] **Step 2: Write the component a11y test** (`src/__tests__/mvp/coachTipsCard.test.tsx`). This is the safety net the axe gate can't give (the modal is e2e-suppressed):
```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CoachTipsCard from "@/components/coach/CoachTipsCard";

afterEach(cleanup);

describe("CoachTipsCard accessibility", () => {
  it("is a labelled modal dialog", () => {
    render(<CoachTipsCard onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "coach-tips-heading");
    expect(screen.getByRole("heading", { name: "Set the scene" })).toBeTruthy();
  });

  it("calls onClose from the button", () => {
    const onClose = vi.fn();
    render(<CoachTipsCard onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /i'm ready/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<CoachTipsCard onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Verify** — `npx vitest run src/__tests__/mvp/coachTipsCard.test.tsx` → 3 pass.
  (If `@testing-library/react` / `@testing-library/jest-dom` matchers aren't set up, drop
  `toHaveAttribute`/`toBeTruthy` to plain `expect(dialog.getAttribute(...)).toBe(...)` — the
  existing `*.test.tsx` files confirm React testing works in this repo; mirror their imports.)
  `npm run lint` clean.

- [ ] **Step 4: Commit**
```bash
git add src/components/coach/CoachTipsCard.tsx src/__tests__/mvp/coachTipsCard.test.tsx
git commit -m "feat(coach): accessible 'Set the scene' tips modal"
```

---

## Task 3: wire the card into CoachPage (hydration-safe, ordered after the safety gate)

**Files:** Modify `src/app/(coach)/coach/page.tsx`

READ the file first. It already has: `const [safetyGate, setSafetyGate] = useState<...>("loading")`, a final
`return (<><CoachExperienceView .../>{safetyGate === "needed" && <FirstSessionSafetyGate .../>}</>)`,
`const e2eAccessQuery = searchParams?.get("e2e-access") ?? null;`, and a loopback host check used
for `allowLoopbackAutomation`.

- [ ] **Step 1: Imports** — add:
```ts
import CoachTipsCard from "@/components/coach/CoachTipsCard";
import { shouldShowCoachTips, COACH_TIPS_SEEN_KEY } from "@/lib/coach/coachTips";
```

- [ ] **Step 2: State** — near the other `useState`s:
```ts
const [tips, setTips] = useState<"loading" | "show" | "hidden">("loading");
```

- [ ] **Step 3: Hydration-safe effect** (client-only localStorage read; runs once on mount):
```ts
useEffect(() => {
  let seen = false;
  try { seen = localStorage.getItem(COACH_TIPS_SEEN_KEY) === "1"; } catch { /* private mode */ }
  const isLoopbackHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");
  const isE2E = e2eAccessQuery === "1" && isLoopbackHost;
  setTips(shouldShowCoachTips(seen, isE2E) ? "show" : "hidden");
}, [e2eAccessQuery]);
```

- [ ] **Step 4: Handlers** — near the other `useCallback`s:
```ts
const handleCloseTips = useCallback(() => {
  try { localStorage.setItem(COACH_TIPS_SEEN_KEY, "1"); } catch { /* private mode */ }
  setTips("hidden");
}, []);
const handleShowTips = useCallback(() => setTips("show"), []);
```

- [ ] **Step 5: Render + pass the prop.** In the final return: pass `onShowTips={handleShowTips}`
  to `<CoachExperienceView .../>`, and add the tips overlay AFTER the safety-gate line so only one
  shows at a time (safety is required first):
```tsx
    {safetyGate === "needed" && <FirstSessionSafetyGate onAccept={handleAcceptSafety} />}
    {safetyGate === "ok" && tips === "show" && <CoachTipsCard onClose={handleCloseTips} />}
```

- [ ] **Step 6: Verify** — `npm run lint`, `npx tsc --noEmit` (no new error in page.tsx),
  `npm run build` green.

- [ ] **Step 7: Commit**
```bash
git add "src/app/(coach)/coach/page.tsx"
git commit -m "feat(coach): show one-time tips card after the safety gate (e2e-suppressed)"
```

---

## Task 4: re-view affordance in the sidebar

**Files:** Modify `src/components/coach/CoachExperienceView.tsx`

READ the file. It has a sidebar "Framing notes" block:
`<div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Framing notes</div>`
followed by the checklist `<ul>`.

- [ ] **Step 1: Add the prop** to `CoachExperienceViewProps`:
```ts
  onShowTips?: () => void;
```
and destructure `onShowTips` in the component params.

- [ ] **Step 2: Replace the "Framing notes" header** with a header row that includes a re-view link:
```tsx
<div className="mb-2 flex items-center justify-between">
  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Framing notes</span>
  {onShowTips && (
    <button
      type="button"
      onClick={onShowTips}
      className="text-[11px] font-medium text-teal-300 underline-offset-2 hover:underline"
    >
      Setup tips
    </button>
  )}
</div>
```
(`text-teal-300` on the `bg-slate-900/80` sidebar passes AA — this element IS in the audited
`/coach` DOM, so it keeps the axe gate green.)

- [ ] **Step 3: Verify** — `npm run lint`, `npx tsc --noEmit` (no new error), `npm run build` green.
  Note: this changes the sidebar → `coach.visual` snapshots will differ (accepted; re-baselined at
  `dev → main` with the pending #2 + #10 changes).

- [ ] **Step 4: Commit**
```bash
git add src/components/coach/CoachExperienceView.tsx
git commit -m "feat(coach): 'Setup tips' re-view link in the sidebar framing notes"
```

---

## Task 5: full verify, tracker → 🟢, push

**Files:** Modify `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`

- [ ] **Step 1: Unit + a11y gate** — `npm run lint` (clean), `npm run test` (all pass incl. the
  two new tests), `npm run build` (green). Then run the a11y spec to confirm the sidebar link
  passes contrast and nothing regressed:
  `npx playwright test tests/e2e/a11y.spec.ts --project=chromium` → 7/7 pass.

- [ ] **Step 2: coach.smoke regression** — `npx playwright test tests/e2e/coach.smoke.spec.ts --project=chromium`
  → all pass (the tips modal is suppressed under `e2e-access`, so it must NOT block the harness).
  `coach.visual` is expected to differ (sidebar link) — that re-baselines at `dev → main`; do not
  weaken it.

- [ ] **Step 3: Flip tracker #13 → 🟢** — set concern #13's `**Status:**` line to:
  `**Status:** 🟢 resolved (2026-05-30) — one-time "Set the scene" tips card (single-camera setup + expectations) before the first session; re-viewable; e2e-suppressed`
  and append a Resolution Log row:
  `| 2026-05-30 | #13 Single-camera comms | 🔴 → 🟢 | One-time accessible "Set the scene" tips modal (side-on/lighting/clothing/distance + single-camera expectation line) before first coach session; localStorage-gated, e2e-suppressed, re-viewable via sidebar "Setup tips" link |`

- [ ] **Step 4: Commit + push**
```bash
git add docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
git commit -m "docs(war-room): #13 resolved — coach onboarding tips card"
git push -u origin feat/coach-tips
```
(Do NOT run `gh pr create`.)

- [ ] **Step 5: Invoke superpowers:finishing-a-development-branch** and present completion options +
  a paste-ready PR body. Note the `coach.visual` re-baseline now bundles #2 + #10 + #13.

---

## Self-Review

**Spec coverage:** helper + unit test (T1) ✓; accessible modal w/ premium copy, AA colors, dialog
pattern, Escape-closes (T2) ✓; component a11y test as the gate-gap safety net (T2) ✓; hydration-safe
localStorage read in useEffect, versioned key, reuse loopback check, ordering after safety gate (T3) ✓;
`onShowTips` prop + sidebar "Setup tips" link (T4) ✓; verify lint/test/build + a11y 7/7 + coach.smoke +
coach.visual re-baseline note (T5) ✓; tracker → 🟢 (T5) ✓. Non-goals (no in-session duplication, no
per-exercise variants, no Supabase persistence) respected.

**Placeholder scan:** all code shown in full. Tasks 3/4 say "READ the file first" only to locate the
exact insertion points in large existing files — the inserted code and edits are fully specified.

**Type/identifier consistency:** `shouldShowCoachTips(seen, isE2E)` and `COACH_TIPS_SEEN_KEY` (T1) are
used identically in the page effect/handlers (T3) and tests. `CoachTipsCard`'s prop `{ onClose }` (T2)
matches the `onClose={handleCloseTips}` call site (T3). `onShowTips` prop name matches across page (T3)
and CoachExperienceView (T4). The heading id `coach-tips-heading` matches `aria-labelledby` and the
component test (T2).

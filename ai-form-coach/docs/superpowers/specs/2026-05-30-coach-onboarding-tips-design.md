# Coach Onboarding — "Set the scene" tips card (war-room #13)

**Date:** 2026-05-30
**Branch:** `feat/coach-tips`
**War-room concern:** #13 — single-camera accuracy not communicated; risk of bad reviews for technical limits that aren't the app's fault.
**Goal:** a one-time, premium "tips for best results" interstitial that sets up the user well and gently sets single-camera expectations before the first coach session; flip #13 → 🟢.

## Decisions (brainstorm, 2026-05-30)

- **A new one-time tips screen** (not just strengthening the existing in-session framing
  help). The overlay + sidebar "Framing notes" stay for *live* feedback; this card is
  *up-front* setup + expectation-setting.
- **Shown once**, dismissible, **re-viewable** via a "Setup tips" link.
- **Content = setup essentials + single-camera expectations** (the war-room intent).
- **Tone:** Carriage editorial — calm, premium, wellbeing-oriented.

## Architecture

### Component — `src/components/coach/CoachTipsCard.tsx`
An accessible modal (mirrors the audited `FirstSessionSafetyGate` dialog pattern:
`role="dialog"`, `aria-modal`, `aria-labelledby`, focus moved in on open, focus trap,
focus restored on close) — but **Escape dismisses** (informational, not a required gate).
Dark coach surface. Props: `{ onClose: () => void }`.

### Copy (premium / wellbeing voice)

- **Heading:** "Set the scene"
- **Intro:** "Carriage reads your form from a single camera. A clear, side-on view is all
  it needs to coach you well — a quiet minute of setup makes every session sharper."
- **Four essentials** (label — line):
  1. **Turn side-on** — "Stand about 30–45° to the camera so each working joint stays in view."
  2. **Light it softly** — "Face an even light; keep bright windows ahead of you, not behind."
  3. **Wear something fitted** — "Close-fitting layers let the coach trace your true line."
  4. **Make space** — "Step back roughly six feet, until shoulders to ankles rest comfortably in frame."
- **Expectation line:** "Carriage is a single-camera companion, not a clinic. Read its counts
  and angles as considered guidance — a mirror for your practice, not a clinical measurement."
- **Button:** "I'm ready"

(Copy lives as constants in the component; easy to tune. Final wording subject to user review.)

### Trigger / storage / ordering — `src/app/(coach)/coach/page.tsx`
- A pure helper `shouldShowCoachTips(seen: boolean, isE2E: boolean): boolean` → `!seen && !isE2E`.
- On coach mount, read `localStorage["carriage.coachTipsSeen"]`. `isE2E` reuses the page's
  existing loopback/`e2e-access=1` computation (so the modal NEVER blocks the Playwright
  harness). State machine: `tips: "loading" | "show" | "hidden"`.
- **Ordering with the safety gate:** the required `FirstSessionSafetyGate` shows first; once
  it is satisfied (`safetyGate === "ok"`), the tips card shows if `shouldShowCoachTips(...)`.
  Then the coach is fully interactive. Only one overlay renders at a time (safety > tips).
- `onClose`: set `localStorage["carriage.coachTipsSeen"] = "1"` and `tips = "hidden"`.

### Re-view affordance — `src/components/coach/CoachExperienceView.tsx`
A small **"Setup tips"** text button in the sidebar "Framing notes" header that calls a new
`onShowTips?: () => void` prop (passed from `CoachPage`, which re-opens the card without
clearing the seen flag).

## Testing

- **Unit:** `src/__tests__/mvp/coachTips.test.ts` for `shouldShowCoachTips` — true when
  unseen and not e2e; false when seen; false when e2e (even if unseen).
- The card is **suppressed under e2e**, so `coach.smoke` and `coach.visual` are unaffected by
  the modal. `npm run lint` / `npm run test` / `npm run build` stay green.
- New modal a11y must keep the axe audit green (reuses the safety-gate accessible pattern).

## Risks / notes

- The sidebar **"Setup tips" link renders always → another `coach.visual` snapshot change**,
  folding into the *already-pending* re-baseline (#2 micro-disclaimer + #10 contrast). One
  `update_snapshots=true` dispatch at `dev → main` covers all of them. Flag in the PR.
- localStorage is per-device (a returning user on a new device sees it again) — acceptable;
  it's guidance, not consent.

## Non-goals

- Replacing or duplicating the in-session framing overlay / sidebar per-exercise checklist
  (those stay; different purpose: live feedback).
- Per-exercise variants of the tips card (generic single-camera setup is enough; per-exercise
  angle nuance is already in-session).
- Server/Supabase persistence of "seen" (localStorage is sufficient; YAGNI).

## Rollout

Branch `feat/coach-tips` from `dev`, one purpose. User opens the PR manually.

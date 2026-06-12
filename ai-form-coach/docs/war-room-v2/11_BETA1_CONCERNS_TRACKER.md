# Beta 1 War Room Concerns Tracker

**Created:** May 17, 2026
**Source:** War room session reviewing Beta 1 hardening status after `chore/test-config-cleanup` merge
**Status format:** 🔴 open · 🟡 in progress · 🟢 resolved · ⚪ deferred (with reason)

This document captures honest concerns surfaced during the May 17 war room review.
Each item has a recommended action, an owner, and a status. Resolve or defer with
documented reason — do not let items expire silently.

---

## 🔴 BIG CONCERNS — Real risk to Beta launch or early revenue

### 1. S-G coefficient bug still in production code path

**Status:** 🟢 resolved (2026-05-30) — broken S-G deleted; correct EMA smoother shipped + enabled
**Owner:** Dev
**Risk:** High — most likely "looks fine in dev, breaks on device" failure mode
**Resolution (2026-05-30, final):** Deleted `savitzkyGolay.ts` entirely and
replaced it with a correct exponential moving average (`src/lib/phaseDetection/ema.ts`,
`EmaSmoother` + `alphaFromWindow`, α = 2/(windowSize+1) ≈ 0.33). The EMA is
seed-first (constant input round-trips exactly) and range-preserving (output
stays in [0,1], so the HMM observation means remain valid). Smoothing is
**re-enabled** in both `validatorIntegration.ts` config defaults. The old
bug-pinning test was inverted: `sgDefaultDisabled.test.ts` (which locked the
broken behavior) was replaced by `emaSmoothing.test.ts` (pins the correct
round-trip). The squat/pushup/plank rep-count tests stay green with smoothing on
(α=0.33 needed no tuning). EMA params can be tuned with real-device data (#12).

**Resolution (interim, 2026-05-28):** Defaulted `smoothing.enabled` to `false`
as a stopgap (HMM ran over raw normalized angles). Superseded by the EMA
resolution above.

**Pushup-test follow-up (RESOLVED 2026-05-29):** the `testPoseScripts.test.ts >
drives the pushup validator through a counted rep` test was passing under broken
smoothing (false positive: SG noise was producing accidental phase transitions
that the rep counter caught). With clean raw input it began failing — and the
investigation found the cause was **not** in the pushup validator but in the
synthetic test fixture. `buildPushupPose` in `src/lib/coach/testPoseScripts.ts`
filtered its candidate shoulder vectors with `x <= 0 && y <= 0`, which rejected
BOTH valid solutions for deep elbow bends (~100°) and silently fell back to a
hardcoded near-straight default — so the deepest frame of the scripted rep
reconstructed to ~175° instead of 102° and no descent was ever detected. The
production pushup validator and shared HMM path are fine (squat + plank exercise
the same code on correctly-reconstructed input). Fix: relaxed the filter to
`x <= 0` (mirrors `buildSquatPose`); deepest frame now reconstructs to 102.0°,
the HMM reaches `down`, and the rep counts. Test un-skipped.

The Savitzky-Golay smoothing in `src/lib/phaseDetection/savitzkyGolay.ts`
produces values outside [0,1] (e.g., `27000000002.1875` for constant 0.5 input).
Tests work around it by disabling smoothing. Production code path still calls
the broken filter with smoothing enabled.

**Recommendation:** Either fix the coefficient generator OR globally disable
smoothing before beta. Do not ship a known-broken filter to 20–50 real users.

**Estimate:** 1–2 days to fix coefficient math, or ~1 hour to disable smoothing
flag in production config.

---

### 2. Liability waiver and medical disclaimer in `/terms`

**Status:** 🟡 in progress — disclaimer/waiver draft + consent UX shipped for legal review (NOT lawyer-approved)
**Owner:** External (lawyer) + Dev
**Risk:** Catastrophic — single injured beta tester could end the project
**Resolution (draft, pending lawyer):** Added a single versioned legal-content
module (`src/lib/legal/legalContent.ts`, `DISCLAIMER_VERSION`) feeding a new
`/medical-disclaimer` page (medical disclaimer + assumption of risk & release),
strengthened `/terms` (safety, liability, 18+, governing-law placeholder) and
`/privacy` (camera on-device, no health data, GDPR, 18+). Consent UX: signup
clickwrap + 18+ checkbox, a one-time first-session safety self-attestation gate
(show-don't-store PAR-Q criteria), and a persistent in-session micro-disclaimer.
Consent recorded as `{disclaimer_version, accepted_at, context}` in
`user_consents` (RLS, **no health data**). **Every string carries
`[LAWYER REVIEW REQUIRED]`** — stays 🔴-worthy until a lawyer reviews/replaces the
copy; this entry is 🟡 only because the draft + plumbing exist. Known limitation:
email-confirmation signups don't write a 'signup' consent row (the first-session
gate still enforces + records before any exercise). UI design + UX/a11y review:
`docs/design/2026-05-30-disclaimer-ui-design.md`.

Solo dev shipping movement correction without a properly worded waiver is a
legal liability. `/terms` and `/privacy` likely lack explicit "not medical
advice / consult a physician" language.

**Recommendation:** ~$300 lawyer consult for a real waiver. Update `/terms`
with explicit language before recruiting any beta tester, even friends.

**Estimate:** 1 day end-to-end (consult + integration).

---

### 3. Sentry verification is P0, not P1

**Status:** 🟢 resolved (2026-05-30)
**Owner:** Dev
**Risk:** High — flying blind in beta = first crash burns a tester forever
**Resolution:** Migrated to full `@sentry/nextjs` (client + server + edge).
`getSentryInitOptions()` (error-only: no tracing/replay/PII) feeds
`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`;
`instrumentation.ts` exports `onRequestError`. `ErrorBoundary` now forwards to
Sentry (was swallowing); `withSentryConfig` uploads source maps. Verified on a
Vercel preview: a client error and a server error both produced Sentry issues
with readable, source-mapped stack traces.

**Server-capture fix (the non-obvious part):** server-side errors initially did
NOT reach Sentry while client errors did. Root cause (found via local
production-server repro): `onRequestError` fires and the event is captured, but
on Vercel the serverless function freezes before Sentry's async transport
delivers it — the event was silently dropped. Fixed by making `onRequestError`
async and awaiting `Sentry.flush(2000)` (Next.js awaits the hook). Regression
test: `src/__tests__/mvp/instrumentationFlush.test.ts`. The temporary
`/sentry-check` verification surface was removed in this change.

**Recommendation (original):** Promote to P0. Verify on production build with a
deliberately injected error before Vercel deploy.

**Estimate:** 4 hours.

---

### 4. No CI workflow — release gate is a manual checklist

**Status:** 🟢 resolved (2026-05-30)
**Owner:** Dev
**Risk:** Medium — gate will eventually slip; bugs sneak into `dev`
**Resolution:** Two complementary GitHub Actions now enforce the gate:
`release-gate.yml` (heavy, full `npm run test:release` incl. Playwright e2e) on
PRs into `main`, and the new `dev-pr-gate.yml` (lightweight: `lint` + `test` +
`build`, no e2e) on every PR into `dev`. The dev gate closes the previously
deliberate gap where `dev` PRs relied only on local discipline. E2E stays at the
main boundary to keep dev CI fast and cheap on the free tier.

No `.github/workflows/` enforcement of `npm run test:release` on PRs.

**Recommendation:** Single GitHub Action running `npm run lint`,
`npm run test`, `npm run build` on every PR to `dev`. Skip E2E to keep CI
fast (E2E stays manual for now).

**Estimate:** 2–4 hours.

---

### 5. Beta tester recruitment target is below statistical floor

**Status:** 🔴 open
**Owner:** PM / Founder
**Risk:** Medium — retention and NPS numbers will be statistically meaningless

20–50 testers with 40–60% engagement = n≈10–30 active. Confidence intervals
swing wildly at that size.

**Recommendation:** Raise recruitment target to 75–150 to land n≈40 active.

---

## 🟠 MEDIUM CONCERNS — Will hurt later if ignored

### 6. Brand identity gap — "AI Form Coach" is a working title

**Status:** 🟢 resolved (2026-05-26)
**Owner:** Brand design team + Dev
**Resolution:** Seven-step Carriage rollout merged to `dev` across PRs #48 (tokens), #49 (fonts), #51 (Ribbon C mark + SiteHeader Lockup A), #52 (pose overlay → Form Line palette), #54 (marketing copy + bone editorial surface), #55 (OG keyart, favicon, app icons, manifest + font deploy fix), #56 (signature splash). PR #57 restored the e2e release gate.
**Risk:** Brand debt scales fast — every email, receipt, blog post compounds the cost

**Recommendation:** Tackle brand identity (name, logo, color, typography,
voice/tone) as the next branch BEFORE beta recruitment. Pre-traction is the
cheapest possible rename moment.

**Filter for the chosen name:**
- `.com` domain available (or `.ai`/`.app` as fallback)
- Pronounceable by non-English speakers
- No conflict in USPTO TESS search
- Doesn't accidentally claim medical authority (no -care, -med, -health, -clinic)
- ≤2 syllables ideal, ≤3 max
- Spells unambiguously when heard aloud
- Works as wordmark and monogram

**Branch scope when started:**
- Brand tokens into Tailwind theme (colors, typography, radii)
- Font loading
- Logo SVG + favicon + app manifest icon
- OG image template update
- Global string replacement (~20+ files)
- **NOT a UI redesign** — that's Phase 1 polish, not this branch

**Estimate:** 2–4 days code work after design lock.

---

### 7. Phase 2 MRR math doesn't reconcile

**Status:** 🔴 open
**Owner:** Founder (pricing decision)
**Risk:** Medium — Phase 2 timeline is 1–2 months later than planned

$500–800 MRR at $9.99/mo = 50–80 paid users. At 5% conversion that needs
1,000–1,600 active free users, but Phase 1 targets 300–800.

**Options:**
- Accept Phase 2 = Month 4–6 instead of 2–4
- Need 10%+ conversion (aggressive)
- **Price at $14.99 from day 1** (bottom of consumer fitness range is $9.99 — leaving money on the table)

**Recommendation:** Test $14.99 from launch.

---

### 8. HIPAA estimate of 10 days is wildly optimistic

**Status:** 🔴 open
**Owner:** Founder (planning correction)
**Risk:** Phase 3 PT clinic revenue is blocked until real HIPAA clearance

Realistic HIPAA for solo dev with PHI: BAA with Supabase, encryption audit,
access logging, breach procedures — **30–90 days**.

**Recommendation:** Either start prep in Phase 2 (parallel), OR plan PT pilots
as non-PHI (anonymized session data only) until HIPAA is real.

---

### 9. Pre-launch content pipeline is empty

**Status:** 🔴 open
**Owner:** Marketing / Founder
**Risk:** SEO won't rank for 6 months; social is the only fast channel

TikTok/Reel is listed as Phase 1 P2. Should be P1.

**Recommendation:** Record 3 short demos during beta period. Post day-of
public launch. Fitness content is the cheapest acquisition channel in 2026.

---

### 10. No accessibility audit

**Status:** 🟢 resolved (2026-05-30) — axe WCAG 2.1 AA audit: 0 serious/critical on public routes + coach; gated in test:e2e:release
**Owner:** Dev / Design
**Risk:** Beta testers with assistive needs will struggle; credibility hit
**Resolution:** Added `@axe-core/playwright` + `tests/e2e/a11y.spec.ts` (chromium) over
`/`, `/pricing`, `/signin`, `/terms`, `/privacy`, `/medical-disclaimer`, `/coach` — fails on
any serious/critical WCAG 2.1 AA violation, now wired into the release gate. All findings were
`color-contrast`: the muted-gold brand label `#8A6F4A → #7A6240` (approved; ~5:1 on bone), the
signin form's semi-transparent-over-bone widgets made opaque + on-bone text darkened, terms/
privacy `slate-500 → slate-600` + two near-invisible hero badges, and the coach device-summary
`slate-500 → slate-400`. Note: the coach contrast fix shifts `coach.visual` snapshots — they
re-baseline at `dev → main` (alongside the #2 micro-disclaimer). Follow-ups (documented in
`docs/technical/accessibility.md`): auth-gated routes (`history`/`settings`/`session/[id]`) and
`moderate`/`minor` violations.

13 launch routes, no WCAG pass mentioned. Dark-only theme is a strong
opinion that needs to be defensible.

**Recommendation:** Run Lighthouse accessibility on all 13 routes. Target
90+ each before beta.

**Estimate:** 1 day.

---

### 11. `microModel` test skip will bit-rot

**Status:** 🔴 open
**Owner:** Dev
**Risk:** Low-medium — silent compile breakage on type changes

`hybridQualityScorer.test.ts` is `.skip`'d in `src/`, not in `legacy-disabled/`.
Compiles but never runs. Type changes to `RepMetric` or `FormError` silently
break this file.

**Recommendation:** Either move `src/lib/microModel/` to `legacy-disabled/`,
OR realign the 5 drifted assertions. Mixed state is worst-of-both.

---

## 🟡 SMALLER CONCERNS — Worth noting

### 12. No real-world calibration data

**Status:** ⚪ deferred (resolves naturally during beta)
**Owner:** Dev (logging setup)
**Action:** Log anonymized phase detector traces during beta. Flag "weird" rep
counts for review. Build for Phase 1 retro.

### 13. Single-camera MediaPipe accuracy not communicated to users

**Status:** 🟢 resolved (2026-05-30) — one-time "Set the scene" tips card before the first session; re-viewable; e2e-suppressed
**Owner:** Design / Dev
**Risk:** Bad reviews for technical limits that aren't your fault
**Resolution:** Added `CoachTipsCard` — a one-time, accessible (`role=dialog`, focus-trapped,
Escape-closes), premium-voiced "Set the scene" interstitial shown before the first coach
session. Covers the four setup essentials (side-on angle, soft even lighting, fitted clothing,
~6 ft distance) plus an explicit single-camera expectation line ("a single-camera companion,
not a clinic … a mirror for your practice rather than a precise measurement"). Gated once via
`localStorage["carriage.coachTipsSeenV1"]`, suppressed under the `e2e-access` bypass (so
`coach.smoke`/`coach.visual` are unaffected by the modal), and re-viewable via a "Setup tips"
link in the sidebar framing notes. The existing in-session framing overlay/checklist stay for
live feedback. (The sidebar link shifts `coach.visual` → folds into the pending #2 + #10
re-baseline at `dev → main`.)
**Action:** Add a "tips for best results" screen during onboarding. Sideline
angle, lighting, clothing, distance.

### 14. Account deletion not E2E tested (GDPR)

**Status:** 🟢 resolved (2026-05-30) — deletion verified complete (profiles-cascade chokepoint); `events` now CASCADE-deletes; audit fn + gated test guard regressions
**Owner:** Dev
**Risk:** Regulatory liability if deletion is incomplete
**Resolution:** Audited all 42 user-scoped tables. Deletion cascades correctly via
the `profiles.id → auth.users ON DELETE CASCADE` chokepoint — every user table
cascade-deletes directly or through `profiles`. The one gap, `events.user_id`
(`SET NULL`), was changed to `ON DELETE CASCADE` (migration `10_...`, applied via
MCP). Added `public.account_deletion_completeness()` (MCP-verified to return zero
offending tables) + a gated RPC regression test (`accountDeletionCompleteness.test.ts`,
auto-skips in CI) + a same-origin CSRF check on the delete route. GDPR
external-processor follow-ups documented in `docs/technical/account-deletion.md`.
A literal signup→delete Playwright e2e was *not* added — CI uses placeholder
Supabase creds; the audit function + MCP verification cover completeness instead.
**Estimate (original):** 30 min — one Playwright test: signup → delete → assert zero rows.

### 15. No A/B test framework for cue effectiveness

**Status:** ⚪ deferred (Phase 1)
**Owner:** Dev
**Action:** Add `cue_variant` column to session logs. Even passive logging
without UI lets you learn during beta.

---

## 🎯 Top 3 Recommendations (the war room's "do these before invites go out")

1. **Fix the S-G coefficient bug** (or disable smoothing in production) — concern #1
2. **Sentry verification + GitHub Action CI** — concerns #3 and #4 (~half a day combined)
3. **Liability waiver in `/terms`** — concern #2

Everything else can wait until after beta launches. But those three before the first beta invite.

---

## Resolution Log

| Date | Concern | Status change | Notes |
|------|---------|---------------|-------|
| 2026-05-17 | #6 Brand identity | 🔴 → 🟡 | Brand work scheduled as next branch |
| 2026-05-26 | #6 Brand identity | 🟡 → 🟢 | Carriage rollout 7/7 merged (PRs #48–#56) + e2e gate restored (#57) |
| 2026-05-28 | #1 S-G coefficient | 🔴 → 🟡 | Production bypass; math fix deferred |
| 2026-05-29 | #1 pushup-test follow-up | resolved | Root cause was broken `buildPushupPose` fixture, not the validator; filter fixed, test un-skipped |
| 2026-05-29 | #3 Sentry verification | 🔴 → 🟡 | Full @sentry/nextjs (client+server+edge) wired; preview verification pending |
| 2026-05-30 | #3 Sentry verification | 🟡 → 🟢 | Client + server errors verified on Vercel preview with readable traces; serverless flush fix (`onRequestError` awaits `Sentry.flush`); temp /sentry-check surface removed |
| 2026-05-30 | #4 CI workflow | 🔴 → 🟢 | Added `dev-pr-gate.yml` (lint+test+build on PRs to dev) complementing `release-gate.yml` (e2e on PRs to main) |
| 2026-05-30 | #2 Liability waiver | 🔴 → 🟡 | Draft medical disclaimer + assumption-of-risk, /medical-disclaimer page, strengthened terms/privacy, signup clickwrap + 18+, first-session self-attestation gate, consent record. PLACEHOLDER copy pending lawyer review. |
| 2026-05-30 | #1 S-G coefficient | 🟡 → 🟢 | Deleted broken Savitzky-Golay; shipped correct EMA smoother (α=2/(windowSize+1)), re-enabled smoothing, inverted the pinning test, rep-count tests green |
| 2026-05-30 | #14 Account deletion | 🔴 → 🟢 | Audit: all user tables cascade via profiles chokepoint; fixed events SET NULL → CASCADE; added account_deletion_completeness() fn (MCP-verified empty) + gated RPC test + same-origin check + GDPR follow-up docs |
| 2026-05-30 | #10 Accessibility | 🔴 → 🟢 | axe-core/playwright WCAG 2.1 AA audit over public routes + /coach; fixed all serious/critical color-contrast (brand label #8A6F4A→#7A6240 approved; signin/terms/privacy/coach utility contrast); gated in test:e2e:release; moderate/minor + auth-gated routes deferred |
| 2026-05-30 | #13 Single-camera comms | 🔴 → 🟢 | One-time accessible "Set the scene" tips modal (side-on/lighting/clothing/distance + single-camera expectation line) before first coach session; localStorage-gated, e2e-suppressed, re-viewable via sidebar "Setup tips" link |

---

*Append rows above as concerns resolve. Cite this file's section number (#1–#15)
in commit messages and PR descriptions when addressing items.*

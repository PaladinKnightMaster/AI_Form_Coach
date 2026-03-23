# AI Form Coach — Comprehensive Phased Release Roadmap

**Date:** March 20, 2026 | **Context:** Solo developer, no funding, revenue before complexity
**Competitive Window:** Consumer web-based AI form coaching niche is COMPLETELY VACANT (Q1 2026)
**Cross-Product Portfolio:** AI Form Coach, Heatwave Sauna, Runner App, Yoga App
**War Room Team:** World-class dynamic cross-functional team (Principal Frontend Engineer, Principal Backend Engineer, Staff AI/ML Engineer, Principal UI/UX Designer, DevOps/Infra, Tech Lead, Product Manager, Business Analyst, Marketing Manager, Wellness Consultant)

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Phase 0: Beta 1 — v0.9.0 "Foundation"](#phase-0-beta-1--v090-foundation)
3. [Phase 1: Public Launch — v1.0.0 "Signal"](#phase-1-public-launch--v100-signal)
4. [Phase 2: Retention + Freemium — v1.5.0 "Momentum"](#phase-2-retention--freemium--v150-momentum)
5. [Phase 3: Revenue Growth + B2B — v2.0.0 "Traction"](#phase-3-revenue-growth--b2b--v200-traction)
6. [Phase 4: B2B Revenue + Scale — v2.5.0 "Enterprise"](#phase-4-b2b-revenue--scale--v250-enterprise)
7. [Phase 5: Platform — v3.0.0 "Platform"](#phase-5-platform--v300-platform)
8. [Blocked Feature Alignment](#blocked-feature-alignment)
9. [Cross-Product Strategy](#cross-product-strategy)
10. [Revenue Trajectory](#revenue-trajectory)
11. [4-Moat Architecture](#4-moat-architecture)

---

## Phase Overview

```
Phase 0  ──── Beta 1 (v0.9.0 "Foundation")
              Now → Beta Launch (2-4 weeks)
              Goal: Ship reliably on real devices

Phase 1  ──── Public Launch (v1.0.0 "Signal")
              Month 0-2 post-beta
              Goal: Validate PMF with organic users

Phase 2  ──── Retention + Freemium (v1.5.0 "Momentum")
              Month 2-4 post-launch
              Goal: Build retention + first paid tier → $500-800 MRR

Phase 3  ──── Revenue Growth + B2B (v2.0.0 "Traction")
              Month 4-9 post-launch
              Goal: Scale DTC + PT clinic pilots → $3,000-5,000 MRR

Phase 4  ──── B2B Revenue + Scale (v2.5.0 "Enterprise")
              Month 9-18 post-launch
              Goal: Convert B2B + corporate wellness → $8,000-12,000 MRR

Phase 5  ──── Platform (v3.0.0 "Platform")
              Month 18-24 post-launch
              Goal: Clinical validation + API + bundles → $15,000-25,000 MRR
```

---

## Phase 0: Beta 1 — v0.9.0 "Foundation"

**Goal:** Ship reliably on real devices without embarrassment
**Timeline:** Now → 2-4 weeks | **Target Users:** 20-50 invited beta testers | **Revenue:** $0 (free)

### What's Done (Active in Beta 1)

| # | Feature | Status |
|---|---------|--------|
| 1 | Live pose detection (MediaPipe Lite, on-device) | DONE |
| 2 | Real-time coaching: squat, pushup, plank | DONE |
| 3 | Session history (save, view, detail) | DONE |
| 4 | Auth flows (email/password, magic link, callback recovery, redirect preservation) | DONE |
| 5 | Offline support (IndexedDB sync queue) | DONE |
| 6 | Voice coaching (human-authored cue pack, browser TTS) | DONE |
| 7 | Fitness skeleton overlay (Canvas 2D, 10-joint simplified) | DONE |
| 8 | Device profiling & framing guidance | DONE |
| 9 | E2E test framework (Playwright, visual regression, perf smoke) | DONE |
| 10 | Automated release gate (`npm run test:release`) | DONE |
| 11 | 10 public routes: `/`, `/signin`, `/signup`, `/reset-password`, `/auth/auth-code-error`, `/coach`, `/history`, `/pricing`, `/privacy`, `/terms` | DONE |

### What Remains (Release Blockers)

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Android Chrome physical device validation (DEVICE_VALIDATION_RUNBOOK.md) | 1 day |
| P0 | iPhone Safari physical device validation | 1 day |
| P0 | Triage & fix device validation failures | 2-5 days |
| P0 | Wellness consultant cue review & lock | 2 days |
| P0 | Record human audio pack (15+ cues x 3 exercises) | 2 days |
| P1 | Audit FeatureRegistry — all disabled paths redirect | 0.5 day |
| P1 | Account deletion flow (GDPR) | 1 day |
| P1 | Sentry + Better Uptime + telemetry live | 1 day |
| P1 | Copy audit: no placeholder text on public routes | 0.5 day |
| P2 | Deploy to production Vercel | 0.5 day |
| P2 | Beta waitlist landing page | 1 day |
| P2 | Recruit 20-50 beta users | 3 days |
| P2 | Beta feedback channel (Discord/Tally) | 0.5 day |

**Total remaining effort:** ~15-22 days

### Exit Criteria

- `npm run test:release` green
- Both physical device runbook passes complete
- Detector ≤25ms, frame drop <10%, cue latency p95 ≤300ms
- Session save >99%, all cues locked, audio pack shipped
- No placeholder text, all non-MVP routes gated, account deletion works, monitoring live

---

## Phase 1: Public Launch — v1.0.0 "Signal"

**Goal:** Validate product-market fit with real organic users
**Timeline:** Month 0-2 post-beta | **Target Users:** 300-800 organic | **Revenue:** $0 (free beta)
**Unlock:** Phase 0 exit criteria met + 20+ beta users gave feedback

### Feature Scope

| Feature | Effort | Priority |
|---------|--------|----------|
| Landing page SEO metadata (OG image route exists at `/og-image`) | 1 day | P1 |
| `sitemap.xml` (already in `src/app/sitemap.ts`) | 0.5 day | P1 |
| `robots.txt` (already in `src/app/robots.ts`) | 0.5 day | P1 |
| Pricing page — beta→launch copy update | 1 day | P1 |
| Internal analytics dashboard (Supabase SQL) | 2 days | P1 |
| Blog infrastructure (`/blog/` + Article schema) | 3 days | P1 |
| 5 SEO blog posts | 5 days | P1 |
| Session history pagination (>30 sessions) | 2 days | P2 |
| Product Hunt launch execution | 1 day | P1 |
| Show HN + Reddit posts | 1 day | P1 |
| First TikTok/Reel demo | 1 day | P2 |

**Total effort:** ~18 days feature work + ongoing content/monitoring

### Exit Criteria (Decision Gate for Phase 2)

| Metric | Gate | Confidence Target |
|--------|------|-----------|
| Session completion rate | ≥60% | ≥70% |
| D7 repeat session rate | ≥20% | ≥30% |
| Cue usefulness (positive) | ≥65% | ≥75% |
| Save success rate | ≥99% | — |
| Frame drop rate | <10% | <5% |
| NPS (n≥30) | ≥20 | ≥40 |
| Critical bugs in 48h | 0 | — |

### Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Product Hunt falls flat | Medium | Medium | Not single-channel; Reddit + HN + TikTok parallel |
| D7 repeat <20% | Medium | High | Investigate drop-off; do NOT monetize until fixed |
| NPS <20 | Low | High | Fundamental UX issue; pause Phase 2 and investigate |
| SEO articles slow to rank | High | Low | Long-term play; social provides immediate traffic |

---

## Phase 2: Retention + Freemium — v1.5.0 "Momentum"

**Goal:** Build the reason to come back and introduce first paid tier
**Timeline:** Month 2-4 | **Target Users:** 800-3,000 | **Revenue:** $500-800 MRR
**Unlock:** Phase 1 gates met + D7 repeat ≥25% from organic users

### Feature Scoring

**Priority Score** = Defensibility 20% + Market Fit 30% + Revenue 20% + Social/Viral 15% + Inverse Complexity 15%

| Feature | Def | Cmplx | Mkt | Social | Rev | **Score** | Effort |
|---------|-----|-------|-----|--------|-----|-----------|--------|
| Shareable Form Score card | 7 | 4 | 7 | 10 | 4 | **7.05** | 4 days |
| Streak system | 6 | 3 | 9 | 4 | 5 | **6.70** | 3 days |
| Exercise: lunge | 5 | 5 | 8 | 3 | 6 | **5.95** | 4 days |
| Exercise: deadlift | 5 | 5 | 8 | 3 | 6 | **5.95** | 4 days |
| Exercise: bent-over row | 5 | 5 | 7 | 3 | 6 | **5.65** | 4 days |
| Freemium paywall + Stripe | 3 | 5 | 6 | 1 | 10 | **5.35** | 5 days |
| Environment calibration | 4 | 4 | 8 | 2 | 3 | **5.15** | 3 days |
| Email sequences | 4 | 3 | 6 | 2 | 5 | **5.00** | 2 days |
| Wearable overlay (read-only) | 5 | 6 | 5 | 3 | 4 | **4.55** | 4 days |
| Free tier enforcement | 3 | 3 | 5 | 1 | 8 | **4.20** | 2 days |

**Build order:** Shareable cards → Streak → Freemium paywall + free tier enforcement → Lunge → Deadlift → Row → Calibration → Email → Wearable

### Feature Flags to Unblock

- `monetization: true` — enables Stripe, `/pricing/success`, `/pricing/cancel`
- `healthIntegrations: true` (partial) — enables wearable read-only overlay

### Key Files to Modify

- `src/lib/mvp/featureRegistry.ts` — flip flags, add new exercises to `MVP_EXERCISES`
- `src/lib/subscription/subscriptionService.ts` — already written, unblock and connect
- `src/lib/calibration/` — existing calibration code to integrate into onboarding

### Revenue Model (Phase 2)

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 forever | Squat only, 3 sessions/week, 30 history |
| **Pro** | $9.99/mo or $69.99/yr | All exercises, unlimited sessions, full history, streaks, sharing |

### Exit Criteria

- 30+ paying subscribers, $500-800 MRR
- Stripe webhooks handling all lifecycle events
- ≥100 users with 7+ day streaks
- ≥50 form score cards shared externally

### Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Conversion <5% | Medium | High | A/B test free tier limits (2 vs 3 sessions/week) |
| Exercise expansion slow | Medium | Medium | Ship lunge first (closest to squat kinematically) |
| Shared cards not viral | Medium | Medium | Design must be visually compelling; test with 10 beta users |

---

## Phase 3: Revenue Growth + B2B — v2.0.0 "Traction"

**Goal:** Scale DTC past $3K MRR, begin PT clinic conversations
**Timeline:** Month 4-9 | **Target Users:** 3,000-8,000 DTC + 3 PT clinic pilots | **Revenue:** $3,000-5,000 MRR
**Unlock:** Phase 2 complete + $500 MRR + D30 retention ≥25%

### Feature Scoring

| Feature | Def | Cmplx | Mkt | Social | Rev | **Score** | Effort |
|---------|-----|-------|-----|--------|-----|-----------|--------|
| Fitness Age Score | 7 | 5 | 7 | 9 | 5 | **6.85** | 5 days |
| Premium tier ($14.99/mo) | 4 | 3 | 7 | 2 | 9 | **6.30** | 3 days |
| Social Accountability Pods | 7 | 7 | 6 | 8 | 5 | **6.20** | 8 days |
| Progressive programming (AI) | 6 | 5 | 7 | 3 | 6 | **5.85** | 5 days |
| Analytics dashboard (user-facing) | 5 | 5 | 7 | 4 | 5 | **5.60** | 5 days |
| Voice AI Coach | 6 | 6 | 6 | 5 | 5 | **5.60** | 6 days |
| Affiliate program | 3 | 2 | 5 | 6 | 7 | **5.55** | 2 days |
| PT Clinic MVP dashboard | 6 | 7 | 5 | 2 | 8 | **5.30** | 8 days |
| Wellhub listing | 4 | 4 | 4 | 2 | 7 | **4.75** | 3 days |
| HIPAA compliance | 5 | 8 | 3 | 1 | 7 | **4.10** | 10 days |

**Build order:** Premium tier → Fitness Age Score → Affiliate program → Analytics dashboard → Progressive programming → Social Pods → Voice AI → HIPAA → PT Clinic dashboard → Wellhub

### Feature Flags to Unblock

- `planGeneration: true` — enables AI workout plans (server-side Claude/OpenAI)
- `community: true` — enables Social Accountability Pods
- `organizations: true` (partial) — enables PT Clinic MVP dashboard
- `readiness: true` — enables full health integrations

### Revenue Model (Phase 3)

| Tier | Price | Additional Features |
|------|-------|-----------|
| **Free** | $0 | (Same as Phase 2) |
| **Pro** | $9.99/mo | (Same as Phase 2) |
| **Premium** | $14.99/mo or $99.99/yr | + Analytics, Fitness Age, wearables, AI plans, Voice Coach, streak shields, Pods |
| **PT Clinic (pilot)** | $0 | Free 90-day pilot, up to 10 patients |

### Exit Criteria

- $3,000-5,000 MRR, Premium ≥50 subscribers
- 3 PT clinic pilots running with positive feedback
- 10+ active affiliates, HIPAA audit complete

### Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| HIPAA takes >10 days | High | Medium | DTC revenue continues; B2B timeline adjusts |
| PT pilots don't convert | Medium | Medium | B2B is additive; DTC is the business |
| Solo developer burnout | Medium | Critical | Strict scope freeze; revenue enables hiring at $3K MRR |

---

## Phase 4: B2B Revenue + Scale — v2.5.0 "Enterprise"

**Goal:** Convert B2B pilots to revenue, reach $10K MRR
**Timeline:** Month 9-18 | **Target Users:** 8,000-25,000 DTC + 10+ PT clinics + Wellhub | **Revenue:** $8,000-12,000 MRR
**Unlock:** Phase 3 complete + $3K MRR + 3 PT pilots with positive NPS

### Feature Scoring

| Feature | Def | Cmplx | Mkt | Social | Rev | **Score** | Effort |
|---------|-----|-------|-----|--------|-----|-----------|--------|
| Injury Prevention Alerts | 9 | 7 | 7 | 5 | 6 | **6.65** | 8 days |
| B2B Admin Dashboard | 7 | 8 | 6 | 1 | 9 | **5.75** | 15 days |
| Healthspan Dashboard | 6 | 6 | 6 | 4 | 5 | **5.45** | 7 days |
| Exercise expansion (5 more) | 5 | 5 | 7 | 3 | 5 | **5.35** | 20 days |
| Leaderboards | 4 | 5 | 5 | 8 | 3 | **5.00** | 5 days |
| Recovery Protocol Engine | 5 | 6 | 6 | 3 | 5 | **5.00** | 8 days |
| White-label | 6 | 7 | 4 | 1 | 8 | **4.75** | 10 days |
| Wellhub billing | 5 | 6 | 4 | 1 | 8 | **4.70** | 8 days |
| HSA/FSA integration | 3 | 3 | 5 | 1 | 6 | **4.55** | 5 days |

### Revenue Model (Phase 4)

| Tier | Price | Scope |
|------|-------|-------|
| DTC Free/Pro/Premium | (Same as Phase 3) | |
| **PT Clinic Starter** | $49/mo | Up to 25 patients, compliance reports |
| **PT Clinic Pro** | $99/mo | Up to 100 patients, white-label option |
| **Corporate Wellness** | $2-5 PEPM | Via Wellhub, usage reports, admin portal |

### Exit Criteria

- $8,000-12,000 MRR (~$100-144K ARR)
- 10+ paying PT clinic accounts
- Wellhub listing live and generating PEPM revenue

---

## Phase 5: Platform — v3.0.0 "Platform"

**Goal:** Compound the moat, pursue clinical validation, explore native/API, cross-product bundling
**Timeline:** Month 18-24 | **Target Users:** 25,000-80,000 | **Revenue:** $15,000-25,000 MRR
**Unlock:** $10K MRR + B2B >$2K MRR

### Feature Scoring

| Feature | Def | Cmplx | Mkt | Social | Rev | **Score** | Effort |
|---------|-----|-------|-----|--------|-----|-----------|--------|
| Clinical validation study | 9 | 5 | 5 | 6 | 7 | **6.60** | 30d + 6mo |
| Coach packs & creator packs | 6 | 6 | 6 | 7 | 6 | **5.90** | 10 days |
| Full AI workout plans | 6 | 6 | 7 | 3 | 6 | **5.70** | 10 days |
| API/SDK | 8 | 7 | 4 | 2 | 7 | **5.30** | 20 days |
| Cross-product bundle | 5 | 4 | 5 | 4 | 7 | **5.30** | 5 days |
| Embeddings + micro-model | 9 | 8 | 5 | 2 | 5 | **5.15** | 15 days |
| Multi-angle fusion | 8 | 9 | 4 | 3 | 4 | **4.55** | 15 days |
| Native mobile apps | 4 | 9 | 6 | 3 | 5 | **4.25** | 60-90 days |

### Revenue Model (Phase 5)

| Tier | Price | Scope |
|------|-------|-------|
| DTC + B2B | (Same as Phase 4) | |
| **Enterprise/White-label** | $500-2,000/mo | Custom branding, domain, API access, SLA |
| **Cross-product bundle** | $19.99/mo | AI Form Coach Pro + Heatwave Premium |

### Exit Criteria

- $15,000-25,000 MRR (~$180-300K ARR)
- Clinical validation study initiated
- At least one of: native app shipped, API/SDK in beta, or bundle live

---

## Blocked Feature Alignment

### Complete Mapping

| # | Blocked Feature | Unblock Phase | Rationale |
|---|----------------|---------------|-----------|
| 1 | **Nutrition & food scan AI** | **Cross-product → Runner App** | Best fit for runner app (macro tracking, hydration, race fuel). Not core to form coaching. Potential cross-product bundle at Phase 5+. |
| 2 | Workout plans & programs | Phase 3 (v2.0) | Premium feature, needs session data |
| 3 | Readiness & health systems | Phase 2 partial, Phase 3 full | Wearable overlay is Premium hook |
| 4 | Organizations & B2B | Phase 3 MVP, Phase 4 full | PT Clinic dashboard gates B2B revenue |
| 5 | Leaderboards & challenges | Phase 4 (v2.5) | Needs scale (1,000+ users) to be meaningful |
| 6 | **Coach packs & creator packs** | **Phase 5+ (conditional)** | Strong platform feature but premature before 10K+ users. Unblock only when creator demand signals appear. |
| 7 | Monetization & Stripe | Phase 2 (v1.5) | Core revenue enablement |
| 8 | Analytics dashboards | Phase 1 internal, Phase 3 user-facing | Metrics visibility → Premium feature |
| 9 | Embeddings & micro-model | Phase 5 (v3.0) | Needs 200K+ sessions dataset |
| 10 | **Demo & test pages** | **Dev-only (all phases)** | Available in `NODE_ENV=development`, blocked in production. Never public-facing. |
| 11 | Insights & coaching insights | Phase 3 (v2.0) | Premium analytics |
| 12 | Progression & FormIQ | Phase 3 (v2.0) | Fitness Age Score wrapper |
| 13 | Reports & CSV export | Phase 3 B2B, Phase 4 full | PT compliance reports |

### Feature Flag Unblock Schedule

```
Phase 2:     monetization: true, healthIntegrations: true (partial)
Phase 3:     planGeneration: true, community: true, organizations: true (partial), readiness: true
Phase 4:     organizations: true (full), leaderboard routes enabled
Phase 5:     Embeddings, micro-model, verification, coach packs (conditional)
Dev-only:    demoMode: true (development environment only, never production)
Cross-prod:  nutritionAi → Runner App (not AI Form Coach)
```

### Critical File: `src/lib/mvp/featureRegistry.ts`

Every phase transition requires modifying feature flags in this file:

```typescript
// Current Beta 1 state:
export const MVP_FEATURE_FLAGS: Record<MvpFeatureFlag, boolean> = {
  liveCoaching: true,        // Active since Phase 0
  recordedVoicePack: true,   // Active since Phase 0
  tutorialSamples: true,     // Active since Phase 0
  community: false,          // → true at Phase 3
  nutritionAi: false,        // → NEVER (cross-product to Runner App)
  planGeneration: false,     // → true at Phase 3
  readiness: false,          // → true at Phase 3
  healthIntegrations: false, // → true (partial) at Phase 2
  organizations: false,      // → true (partial) at Phase 3, full at Phase 4
  demoMode: false,           // → true in dev environment only
  monetization: false,       // → true at Phase 2
};
```

---

## Cross-Product Strategy

### Nutrition & Food Scan AI → Runner App

**Why Runner App is the best fit:**

| App | Fit | Rationale |
|-----|-----|-----------|
| **Runner App** | **Best** | Runners actively track macros, hydration, race fuel. Food scanning pairs naturally with training load. Strong market precedent: MyFitnessPal + Strava is #1 requested integration. |
| Yoga App | Medium | Mindful eating aligns culturally but less performance-driven. |
| Heatwave Sauna | Weak | Saunas are recovery/detox — nutrition is tangential. |

**Existing code to migrate from AI Form Coach:**
- `src/legacy-disabled/app/nutrition/` — UI components
- `src/legacy-disabled/api/nutrition/` — API routes
- `src/legacy-disabled/api/ai/analyze-food/route.ts` — Food analysis AI endpoint
- `src/legacy-disabled/api/ai/generate-food-image/route.ts` — Food image generation

**Cross-product bundle opportunity (Phase 5+):**
- Runner App (nutrition + running) + AI Form Coach (form coaching) = holistic fitness suite
- Unified $19.99/mo premium bundle across all wellness apps
- Shared auth/profile infrastructure via Supabase

---

## Revenue Trajectory

```
Month 0-2    Free beta/launch             $0 MRR
Month 2-4    Freemium paywall live         $500-800 MRR
Month 4-9    Pro + Premium scaling         $3,000-5,000 MRR
Month 9-18   B2B + Wellhub added           $8,000-12,000 MRR
Month 18-24  Platform maturity             $15,000-25,000 MRR
```

**Time to first dollar:** Month 2 post-launch
**Time to self-sustaining ($10K MRR / $120K ARR):** Month 9-12

### Financial Milestones

| MRR | What It Unlocks |
|-----|-----------------|
| $500 | Covers infra: Supabase Pro ($25) + Vercel Pro ($20) + Sentry ($26) + Rewardful ($49). First profitable month. |
| $1,000 | Paid content creation (video, audio). First marketing budget. |
| $3,000 | Part-time contractor (content, design). Begin HIPAA compliance. |
| $5,000 | Paid acquisition testing. First part-time engineer for B2B. |
| $10,000 | Full-time equivalent salary ($120K/yr). First full-time hire. |
| $25,000 | Series Seed territory if desired. |

---

## 4-Moat Architecture

| Moat | When Built | 12-Month Target |
|------|-----------|-----------------|
| **Distribution** (SEO + social + Wellhub) | Month 0-6 | 50+ articles, 150+ videos, Wellhub listed |
| **Data** (session/rep/cue dataset) | Month 3-12 | 200K+ sessions, enables ML personalization |
| **Brand** (first-mover recognition) | Month 0-12 | "AI form coaching" = AI Form Coach in searches |
| **Switching Cost** (history + streaks + trends) | Month 2-6 | 500+ users with 30+ sessions (can't migrate) |

### Competitive Context

ALL direct competitors have exited:
- **Kemtai** → Pivoted to B2B healthcare
- **Kaia Health** → Acquired by Sword ($285M, Jan 2026)
- **Peloton Guide** → Discontinued July 2025
- **Tempo Studio** → Bankrupt Oct 2025
- **Mirror/Lulu** → $500M write-down to $0

**The market didn't reject AI form coaching. It rejected overengineered, overpriced, hardware-dependent delivery.**

AI Form Coach enters with: browser-native PWA, zero hardware, on-device inference, solo-developer cost structure. 12-24 month window before anyone else can build distribution + data moats.

---

## Verification Per Phase

| Phase | Verification Method |
|-------|-------------------|
| Phase 0 | `npm run test:release` + physical device runbook passes |
| Phase 1 | Daily metric monitoring (telemetry), weekly beta survey |
| Phase 2 | Stripe test mode exhaustive testing, A/B test pricing, conversion funnel |
| Phase 3 | HIPAA compliance audit, PT pilot feedback calls, affiliate tracking |
| Phase 4 | B2B contract validation, Wellhub integration testing, MRR tracking |
| Phase 5 | Clinical study protocol review, API load testing |

---

_Maintained by War Room Team. Phase unlock decisions require written review against stated success metrics. This is a living document — reviewed monthly during active development, quarterly thereafter._

_Cross-references: [MVP_TRUTH_BASELINE.md](technical/MVP_TRUTH_BASELINE.md) | [MVP_RELEASE_SCORECARD.md](technical/MVP_RELEASE_SCORECARD.md) | [MVP_IMPLEMENTATION_STATUS_MATRIX.md](technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md) | [war-room-v2/07_ROADMAP.md](war-room-v2/07_ROADMAP.md) | [war-room-v2/08_REVENUE_MODEL.md](war-room-v2/08_REVENUE_MODEL.md)_

# MVP Implementation Status Matrix

Updated: March 20, 2026

## Purpose

This document is the single source of truth for distinguishing:
- what is active in the public Beta 1 MVP
- what was implemented previously but is currently blocked or restricted
- what remains historical, exploratory, or planning-only
- what should feed Beta 2 planning

Use this file together with:
- [MVP_TRUTH_BASELINE.md](./MVP_TRUTH_BASELINE.md)
- [MVP_RELEASE_CHECKLIST.md](./MVP_RELEASE_CHECKLIST.md)
- [MVP_RELEASE_SCORECARD.md](./MVP_RELEASE_SCORECARD.md)

## Status Definitions

- `Active in Beta 1`: public MVP behavior that is currently exposed and supported
- `Implemented but blocked in Beta 1`: code or routes exist or existed, but are intentionally disabled from the public MVP
- `Historical or reference-only`: documentation, experiments, or old implementation notes that are not current release truth
- `Beta 2 planning candidate`: an area that may be reconsidered after Beta 1 validation, but is not committed for the current release

## Active In Beta 1

| Capability | Status | Evidence |
| ---------- | ------ | -------- |
| Coach-first public web app | Active in Beta 1 | `src/app/page.tsx`, `src/app/coach/page.tsx`, `src/lib/mvp/featureRegistry.ts` |
| Launch exercises: squat, pushup, plank | Active in Beta 1 | `src/lib/mvp/featureRegistry.ts`, coach tests and pose pipeline |
| Fitness skeleton pose overlay | Active in Beta 1 | `src/components/PoseOverlay.tsx`, `src/lib/pose/contracts.ts` |
| Exercise-specific framing and mobile stage protection | Active in Beta 1 | `src/lib/coach/framing.ts`, `src/components/coach/CoachExperienceView.tsx` |
| Pause, resume, save, feedback, history, session detail | Active in Beta 1 | `src/app/coach/page.tsx`, `src/app/history/page.tsx`, `src/app/session/[id]/page.tsx` |
| Auth flows with redirect preservation and callback recovery | Active in Beta 1 | `src/app/signin/page.tsx`, `src/app/signup/page.tsx`, `src/app/reset-password/page.tsx`, `src/app/auth/callback/route.tsx`, `src/app/auth/auth-code-error/page.tsx`, `middleware.ts` |
| Automated MVP release gate | Active in Beta 1 | `npm run test:release`, current technical docs |
| Manual device validation gate | Active in Beta 1 | `docs/technical/DEVICE_VALIDATION_RUNBOOK.md` |

## Implemented But Blocked In Beta 1

These areas are important because they may influence future planning, but they are intentionally excluded from the public Beta 1 release.

| Area | Current Beta 1 Decision | Evidence |
| ---- | ----------------------- | -------- |
| Nutrition and food scan | Implemented previously, blocked from public Beta 1 | `src/legacy-disabled/app/nutrition`, `src/legacy-disabled/api/nutrition/*`, `src/legacy-disabled/api/ai/analyze-food/route.ts`, `src/legacy-disabled/api/ai/generate-food-image/route.ts` |
| Workout plan generation and programs | Implemented previously, blocked from public Beta 1 | `src/legacy-disabled/app/plans`, `src/legacy-disabled/app/programs`, `src/legacy-disabled/api/plans/*`, `src/legacy-disabled/api/programs/route.ts` |
| Readiness and health-related systems | Implemented previously, blocked from public Beta 1 | `src/legacy-disabled/app/health`, `src/legacy-disabled/api/readiness/route.ts`, `docs/systems/*` |
| Organizations and B2B dashboards | Implemented previously, blocked from public Beta 1 | `src/legacy-disabled/app/org`, `src/legacy-disabled/api/organizations/*`, `docs/features/ORGANIZATION_DASHBOARD.md` |
| Leaderboards, challenges, activity, competition | Implemented previously, blocked from public Beta 1 | `src/legacy-disabled/app/leaderboards`, `src/legacy-disabled/app/challenges`, `src/legacy-disabled/api/leaderboards/route.ts`, `src/legacy-disabled/api/challenges/*`, `src/legacy-disabled/api/activity/*`, `src/legacy-disabled/api/competition/leaderboard/route.ts` |
| Coach packs and creator packs | Implemented previously, blocked from public Beta 1 | `src/legacy-disabled/app/coach-packs`, `src/legacy-disabled/app/creator-packs`, `src/legacy-disabled/api/coach-packs/*`, `src/legacy-disabled/api/creator-packs/*` |
| Monetization and Stripe flows | Implemented previously, blocked from public Beta 1 | `src/legacy-disabled/app/pricing/success`, `src/legacy-disabled/app/pricing/cancel`, `src/legacy-disabled/api/checkout/route.ts`, `src/legacy-disabled/api/subscription/status/route.ts`, `src/legacy-disabled/api/stripe-webhook/route.ts` |
| Analytics, monitoring, advanced metrics | Implemented previously, blocked from public Beta 1 public surface | `src/legacy-disabled/api/analytics/*`, `src/legacy-disabled/api/monitoring/*`, `docs/features/METRICS_GUARDRAILS.md`, `docs/technical/METRICS_GUARDRAILS_*` |
| Embeddings, micro-model, advanced verification/reporting | Implemented previously or explored, blocked from public Beta 1 | `src/legacy-disabled/api/embeddings/*`, `src/legacy-disabled/api/verification/*`, `docs/technical/MICRO_MODEL.md`, `docs/technical/MOVEMENT_EMBEDDINGS.md`, `docs/features/ASYNC_FORM_REPORT.md` |
| Demo, calibration, internal and test-only pages | Implemented previously, blocked from public Beta 1 | `src/legacy-disabled/app/demo`, `src/legacy-disabled/app/calibrate`, `src/legacy-disabled/app/internal`, `src/legacy-disabled/app/test*` |

## Historical Or Reference-Only Documentation

These folders remain useful, but they are not Beta 1 release truth by default:
- `docs/marketing/`
- `docs/features/`
- `docs/systems/`
- `docs/verification/`
- `docs/CHANGELOG.md`

These locations now include folder-level warnings so they can be used safely as reference.

## Beta 2 Planning Baseline

`docs/war-room-v2/` is kept intentionally.

Its role is:
- initial planning baseline for Beta 2
- architecture and roadmap reference
- cross-functional war room material for post-Beta-1 expansion

Its limits are:
- it is not Beta 1 release truth
- it does not override the current MVP technical docs
- it must be revalidated against real Beta 1 outcomes before any Beta 2 commitment

## War Room Planning Rule

When the team plans Beta 2:
1. Start from Beta 1 evidence in the current MVP technical docs.
2. Use this matrix to identify what is already implemented but intentionally blocked.
3. Use `docs/war-room-v2/` as the initial planning baseline, not as a shipped-status report.
4. Promote only the features that fit Beta 1 learnings, device validation results, and release priorities.

## Current Recommendation

For Beta 1:
- keep the public scope narrow
- enhance only the core coaching, auth, history, and device-quality paths
- do not reactivate blocked feature areas without an explicit war room decision

For Beta 2 planning:
- evaluate blocked features only after Beta 1 validation
- prioritize reactivation candidates based on actual user behavior, not on older broader-platform assumptions

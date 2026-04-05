# AI Form Coach Documentation Index

Updated: March 21, 2026

## Read This First

Current MVP truth lives here:
- [technical/MVP_TRUTH_BASELINE.md](./technical/MVP_TRUTH_BASELINE.md)
- [technical/MVP_RELEASE_CHECKLIST.md](./technical/MVP_RELEASE_CHECKLIST.md)
- [technical/MVP_RELEASE_SCORECARD.md](./technical/MVP_RELEASE_SCORECARD.md)
- [technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md](./technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md)

These files define the live release surface, the implemented MVP, the restricted areas, the formal release gate, and the explicit Beta 1 versus Beta 2 boundary.

## Current MVP Snapshot

### Public surface
- `/`
- `/signin`
- `/signup`
- `/reset-password`
- `/auth/auth-code-error`
- `/coach`
- `/history`
- `/session/[id]`
- `/settings`
- `/pricing`
- `/privacy`
- `/terms`

### Implemented now
- Live motion coaching for `squat`, `pushup`, and `plank`
- Fitness-skeleton pose overlay
- Exercise-specific framing guidance
- Pre-permission camera card (U5)
- Skeleton loading screens on history page (U6)
- Pause, resume, save, and session review
- Auth flows with callback recovery
- Account deletion flow (GDPR)
- Error boundaries (global + route-level) with Sentry reporting
- Offline sync banner in coach experience
- iOS safe area support (viewport-fit=cover)
- Release automation for auth, coach, visual regression, and performance smoke

### Restricted in public beta
- Nutrition and food scan
- Workout plan generation
- Readiness and health integrations
- Organizations and community features
- Leaderboards, challenges, creator packs, and monetization flows

## Deployment & Configuration

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Environment variables, Vercel setup, Supabase auth config, analytics

## Design System

| Document | What it covers |
| --- | --- |
| [Design System Spec](design/DESIGN_SYSTEM.md) | Colors, typography, spacing, radii, shadows, z-index, interaction states |
| [Component Spec](design/COMPONENT_SPEC.md) | Visual spec for Button, Badge, Card, Input, Stage Shell |
| [Responsive Strategy](design/RESPONSIVE_STRATEGY.md) | Viewport targets, breakpoint rationale, layout per device class |

## Architecture Decision Records

| # | Decision |
| --- | --- |
| [001](adr/001-supabase-pkce-client-side-callback.md) | Supabase PKCE: client-side auth callback |
| [002](adr/002-10-joint-fitness-skeleton.md) | 10-joint fitness skeleton (not 33 landmarks) |
| [003](adr/003-browser-only-pose-no-cloud-llm.md) | Browser-only pose, no cloud LLM in live loop |
| [004](adr/004-css-vars-plus-tailwind-tokens.md) | CSS vars + Tailwind v4 CSS-first design tokens |
| [005](adr/005-mobile-first-camera-hero.md) | Mobile-first camera hero layout |
| [006](adr/006-git-branching-strategy.md) | Git branching: feature → dev → main |

## Canonical Technical Docs

- [technical/MVP_TRUTH_BASELINE.md](./technical/MVP_TRUTH_BASELINE.md)
- [technical/MVP_RELEASE_CHECKLIST.md](./technical/MVP_RELEASE_CHECKLIST.md)
- [technical/MVP_RELEASE_SCORECARD.md](./technical/MVP_RELEASE_SCORECARD.md)
- [technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md](./technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md)
- [technical/DEVICE_VALIDATION_RUNBOOK.md](./technical/DEVICE_VALIDATION_RUNBOOK.md)
- [technical/COACH_VISUAL_REGRESSION.md](./technical/COACH_VISUAL_REGRESSION.md)
- [technical/COACH_PERFORMANCE_SMOKE.md](./technical/COACH_PERFORMANCE_SMOKE.md)
- [technical/MVP_AUTOMATION_MATRIX.md](./technical/MVP_AUTOMATION_MATRIX.md)
- [technical/SESSION_LIFECYCLE.md](./technical/SESSION_LIFECYCLE.md)
- [technical/ARCHITECTURE_AUDIT.md](./technical/ARCHITECTURE_AUDIT.md)

## Design Specs

- [superpowers/specs/2026-03-20-account-deletion-design.md](./superpowers/specs/2026-03-20-account-deletion-design.md)

## War Room V2 (Architecture Reference)

- [war-room-v2/01_PRODUCT_REQUIREMENTS.md](./war-room-v2/01_PRODUCT_REQUIREMENTS.md)
- [war-room-v2/02_SYSTEM_DESIGN.md](./war-room-v2/02_SYSTEM_DESIGN.md)
- [war-room-v2/03_AI_ML_ARCHITECTURE.md](./war-room-v2/03_AI_ML_ARCHITECTURE.md)
- [war-room-v2/04_CANONICAL_API.md](./war-room-v2/04_CANONICAL_API.md)
- [war-room-v2/05_TECH_STACK.md](./war-room-v2/05_TECH_STACK.md)
- [war-room-v2/06_UI_UX_GOALS.md](./war-room-v2/06_UI_UX_GOALS.md)
- [war-room-v2/07_ROADMAP.md](./war-room-v2/07_ROADMAP.md)
- [war-room-v2/08_REVENUE_MODEL.md](./war-room-v2/08_REVENUE_MODEL.md)
- [war-room-v2/09_GTM_STRATEGY.md](./war-room-v2/09_GTM_STRATEGY.md)
- [war-room-v2/10_COMPETITIVE_DEFENSIBILITY.md](./war-room-v2/10_COMPETITIVE_DEFENSIBILITY.md)

## Supporting Technical Reference

These docs can still be useful for implementation detail:
- [pose/README.md](./pose/README.md)
- [pose/QUICK_REFERENCE.md](./pose/QUICK_REFERENCE.md)
- [pose/performance/README.md](./pose/performance/README.md)
- [development/VALIDATION_CHECKLIST.md](./development/VALIDATION_CHECKLIST.md)
- [technical/PHASE_DETECTION.md](./technical/PHASE_DETECTION.md)
- [technical/CROSS_PRODUCT_STRATEGY.md](./technical/CROSS_PRODUCT_STRATEGY.md)
- [technical/CX_JOURNEY_MAP.md](./technical/CX_JOURNEY_MAP.md)

## Historical Or Broader-Scope Docs

The folders below include useful historical work, exploratory design, or broader platform plans. They should not be treated as current MVP release truth unless a canonical MVP technical doc explicitly references them.
- `features/`
- `marketing/`
- `systems/`
- `verification/`

## Documentation Best-Practice Status

### What is good now
- The MVP technical docs are current and concrete.
- The release gate is documented with actual commands.
- The manual launch gate is explicit.
- Implemented and restricted areas are clearly separated in the canonical docs.
- Beta 1 active scope and implemented-but-blocked legacy areas are explicitly separated.
- Session lifecycle state machine is fully documented.
- War Room V2 docs are synced with code reality (March 2026 audit).

### What to avoid
- Treating archival docs as launch truth
- Using old platform-wide claims in README or marketing copy
- Keeping mojibake or stale timestamps in top-level entry docs
- Describing de-scoped features without labeling them historical or restricted

## Maintenance Rule

When MVP scope changes, update these first:
1. `technical/MVP_TRUTH_BASELINE.md`
2. `technical/MVP_RELEASE_CHECKLIST.md`
3. `technical/MVP_RELEASE_SCORECARD.md`
4. `technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md`
5. this index and `docs/README.md` only if navigation or status framing changed

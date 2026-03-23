# Cross-Product Strategy: Wellness App Portfolio

> **Version:** 1.0
> **Date:** 2026-03-20
> **Author:** Solo developer — portfolio strategy for wellness apps

## Portfolio Overview

Four wellness apps forming a comprehensive health & fitness ecosystem:

| App | Tagline | Core Technology | Status |
|---|---|---|---|
| **AI Form Coach** | AI-powered exercise form coaching | MediaPipe pose detection, on-device ML | Beta 1 in progress |
| **DRIFT** | Recovery tracking for endurance athletes | Recovery metrics, training load analysis | Idea stage |
| **STILL** | AI Yoga Flow Builder | Pose detection for yoga, flow generation | Idea stage |
| **Heatwave Sauna** | Sauna session companion | Session tracking, health metrics | Info pending |

---

## Product Definitions

### AI Form Coach
**Browser-based, on-device AI form coaching for strength exercises**

- **Core value:** Real-time form feedback without a personal trainer
- **Tech stack:** Next.js 16, React 19, MediaPipe Pose, Zustand, Supabase, Stripe
- **Revenue:** Freemium SaaS (Free / Pro $9.99 / Premium $14.99) + B2B PT clinics
- **MVP exercises:** Squat, pushup, plank
- **Differentiators:** On-device processing (privacy), browser-based (no install), real-time AI coaching

### DRIFT — Recovery Tracking for Endurance Athletes
**Recovery-first training companion for runners, cyclists, and endurance athletes**

- **Core value:** Optimize recovery to train harder and reduce injury risk
- **Target users:** Endurance athletes (runners, cyclists, triathletes)
- **Key features (planned):**
  - Recovery score based on training load, sleep, HRV
  - Training load tracking and periodization
  - Nutrition tracking and recovery nutrition recommendations
  - Integration with running watches (Garmin, COROS, Apple Watch)
- **Why nutrition fits here:** Endurance athletes have specific nutrition needs (carb loading, electrolyte timing, recovery protein). Nutrition AI is a natural extension of recovery tracking.

### STILL — AI Yoga Flow Builder
**AI-powered yoga practice builder with real-time pose guidance**

- **Core value:** Personalized yoga flows with AI form guidance
- **Target users:** Home yoga practitioners, yoga studios
- **Key features (planned):**
  - AI-generated yoga flows based on goals (flexibility, strength, relaxation)
  - Real-time pose detection and alignment feedback
  - Guided breathing integration
  - Flow difficulty progression
- **Market research findings:**
  - TAM: $17B+ global yoga market
  - Key competitors: Alo Moves, Glo, Down Dog
  - Differentiation: AI pose feedback (competitors use video-only instruction)
- **Shared tech with AI Form Coach:** MediaPipe pose detection, smoothing filters, skeleton overlay

### Heatwave Sauna
**Sauna session companion app**

- **Status:** Details pending from developer
- **Placeholder:** Will integrate into portfolio when information is provided

---

## Feature Allocation Strategy

### Principle: Each app owns its domain

Features are allocated to the app where they create the most user value and fit the product narrative. Features should NOT be duplicated across apps.

### Nutrition AI Allocation → DRIFT

| Consideration | Reasoning |
|---|---|
| **User need** | Endurance athletes have the strongest nutrition-to-performance correlation |
| **Product fit** | Recovery tracking naturally extends to recovery nutrition |
| **Technical scope** | Food scanning, macro tracking, meal planning — large scope, needs dedicated focus |
| **Revenue impact** | Nutrition is a premium feature that drives upgrades in a recovery app |
| **AI Form Coach impact** | Removing nutrition from Form Coach keeps it focused on form coaching (its core value) |

### Feature Boundary Map

| Feature Domain | AI Form Coach | DRIFT | STILL | Heatwave |
|---|---|---|---|---|
| Pose detection | ✅ Strength exercises | ❌ | ✅ Yoga poses | ❌ |
| Form scoring | ✅ Rep-based | ❌ | ✅ Hold-based | ❌ |
| Nutrition AI | ❌ | ✅ Primary | ❌ | ❌ |
| Recovery tracking | ❌ | ✅ Primary | ❌ | ❌ |
| Workout plans | ✅ Strength plans | ✅ Training plans | ✅ Yoga flows | ❌ |
| Voice coaching | ✅ Form cues | ❌ | ✅ Flow guidance | ❌ |
| Session tracking | ✅ Exercise sessions | ✅ Training sessions | ✅ Yoga sessions | ✅ Sauna sessions |
| Community | ✅ Phase 2+ | ✅ Planned | ✅ Planned | TBD |
| B2B | ✅ PT clinics | ✅ Coaching platforms | ✅ Yoga studios | TBD |

---

## Shared Technology

### Reusable Across Apps

| Technology | Used In | Sharing Strategy |
|---|---|---|
| MediaPipe Pose Landmarker | AI Form Coach, STILL | Extract to shared npm package (Phase 3+) |
| Pose smoothing (EMA/One Euro) | AI Form Coach, STILL | One Euro Filter critical for STILL (hold detection) |
| Skeleton overlay (Canvas 2D) | AI Form Coach, STILL | Shared rendering lib |
| Supabase (Auth, DB, Storage) | All apps | Shared Supabase project or linked projects |
| Stripe Checkout (server-side) | All apps | Shared payment patterns |
| Zustand state management | All apps | Shared patterns, not shared code |
| Next.js App Router | All apps | Shared deployment patterns |
| Design system (DS.tsx) | All apps | Extract to shared component library (Phase 4+) |

### Key Technical Decision: One Euro Filter

- **AI Form Coach:** EMA (alpha=0.65) is sufficient for dynamic rep-based exercises
- **STILL:** Will need One Euro Filter for yoga holds — adaptive smoothing reduces visible jitter at rest while staying responsive during transitions
- **Shared benefit:** Implementing One Euro Filter for STILL can backport to Form Coach for plank holds

---

## Cross-Product User Journey

```
New User → Discovers AI Form Coach → Improves form → Wants recovery help → DRIFT
                                                   → Wants yoga/flexibility → STILL
                                                   → Sauna enthusiast → Heatwave
```

### Cross-Sell Opportunities

1. **Form Coach → DRIFT:** "Your recovery affects your form. Track recovery with DRIFT."
2. **Form Coach → STILL:** "Improve flexibility for better squat depth. Try STILL."
3. **DRIFT → Form Coach:** "Ready to train? Check your form with AI Form Coach."
4. **DRIFT → STILL:** "Active recovery day? Try a yoga flow with STILL."
5. **STILL → Form Coach:** "Build strength to hold harder poses. Try AI Form Coach."

### Bundle Strategy (Phase 5+)

| Bundle | Apps | Price | Discount |
|---|---|---|---|
| **Wellness Duo** | Any 2 apps | $14.99/mo | ~25% off individual |
| **Wellness Complete** | All apps | $19.99/mo | ~40% off individual |

---

## Development Priority & Timeline

### Current Focus: AI Form Coach
- Beta 1 → Beta 2 → Phase 1 (Public Launch)
- All other apps are idea stage — no active development

### Suggested Sequence
1. **AI Form Coach** — Build, launch, validate revenue model
2. **STILL** — Shares most technology with Form Coach (pose detection, overlay)
3. **DRIFT** — Different tech domain (recovery metrics, device integrations)
4. **Heatwave** — TBD based on available info

### Rationale
- STILL reuses ~60% of Form Coach's technical stack
- Building STILL second validates the shared technology extraction
- DRIFT requires new integrations (Garmin API, Apple HealthKit) — larger learning curve
- Starting DRIFT after STILL means the shared infrastructure (auth, payments, design system) is already proven

---

## Portfolio Revenue Model

### Phase 1: Single Product
- AI Form Coach generates initial revenue
- Validate freemium model, conversion rates, churn

### Phase 2: Two Products
- Launch STILL leveraging shared tech
- Begin cross-sell between apps
- Shared user accounts (Supabase)

### Phase 3: Full Portfolio
- DRIFT + Heatwave
- Bundle pricing available
- Cross-product analytics dashboard

### Conservative Year 1 Projection (AI Form Coach Only)
| Metric | Month 3 | Month 6 | Month 12 |
|---|---|---|---|
| Free users | 500 | 2,000 | 5,000 |
| Paid users | 25 | 150 | 500 |
| MRR | $250 | $1,500 | $5,000 |

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Spreading too thin (solo dev) | Focus 100% on AI Form Coach until Phase 1 launch |
| Technology divergence between apps | Extract shared packages early (Phase 3) |
| Different user bases don't cross-sell | Validate overlap through surveys before building bundles |
| Nutrition AI scope creep in Form Coach | Hard boundary: nutrition lives in DRIFT only |
| STILL competes with Form Coach | Clear product boundary: STILL = yoga/holds, Form Coach = strength/reps |

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-03-20 | Nutrition AI allocated to DRIFT | Endurance athletes have strongest nutrition-performance link |
| 2026-03-20 | STILL builds second after Form Coach | ~60% shared tech stack, validates extraction |
| 2026-03-20 | Coach packs conditional Phase 5+ | May not materialize; depends on user demand |
| 2026-03-20 | No cross-product code sharing until Phase 3+ | Premature extraction adds complexity for solo dev |

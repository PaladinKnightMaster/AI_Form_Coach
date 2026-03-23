# Architecture Audit: Documentation vs Code Reality

> **Audit Date:** 2026-03-20
> **Auditor:** AI-assisted review
> **Scope:** War-room-v2 docs vs actual codebase implementation
> **Status:** 33 mismatches identified, recommendations provided

## Executive Summary

A comprehensive audit comparing war-room-v2 documentation against the actual codebase revealed 33 mismatches across architecture, tech stack, UI/UX, and customer experience. **19 items** require doc updates (code is correct), **10 items** need documentation added for undocumented features, **3 items** are planned for Phase 1+ migration, and **1 item** requires immediate code change (WCAG compliance).

## Findings by Category

### A: Architecture & Engine (A1–A9)

#### A1: Pose Smoothing — One Euro Filter vs EMA
| | Documentation | Code Reality |
|---|---|---|
| **Filter** | One Euro Filter | EMA (alpha=0.65) in `src/lib/pose/engine.ts` |

- **Verdict:** Update docs to match code
- **Rationale:** EMA is simpler (~0.1ms vs ~0.3ms/frame), sufficient for dynamic exercises. One Euro Filter matters more for hold-based exercises (yoga, isometrics) where adaptive smoothing reduces visible jitter at rest.
- **Future:** Evaluate One Euro Filter when building STILL (yoga) or adding plank hold detection
- **Benchmark:** EMA at alpha=0.65 provides good responsiveness with acceptable jitter for squat/pushup rep counting

#### A2: Pose Normalization — Torso-Length vs Hip-to-Ankle
| | Documentation | Code Reality |
|---|---|---|
| **Method** | Torso-length (shoulder→hip) | Hip-to-ankle in `src/lib/pose/normalize.ts` |

- **Verdict:** Update docs to match code
- **Rationale:** Hip-to-ankle normalization is superior for lower-body exercises because it scales with the measured body segment. Torso-length normalization breaks when users lean forward (squat bottom position visually shortens torso)
- **Industry note:** Academic papers favor torso-length, but consumer fitness apps optimize for the exercise type

#### A3: MediaPipe Processing Mode — LIVE_STREAM vs VIDEO
| | Documentation | Code Reality |
|---|---|---|
| **Mode** | LIVE_STREAM | VIDEO in `src/lib/pose/engine.ts` |

- **Verdict:** Update docs to say VIDEO for Beta 1; plan LIVE_STREAM migration for Phase 1
- **Rationale:** VIDEO mode processes synchronously (blocks until result). LIVE_STREAM drops frames under pressure instead of queuing — better for low-end devices. Current VIDEO mode works because `requestAnimationFrame` naturally throttles.
- **Phase 1 migration:** Switch to LIVE_STREAM with async callback for better low-end device support

#### A4: Coaching Cue Cooldown Timing
| | Documentation | Code Reality |
|---|---|---|
| **Cooldown** | Not documented | DEFAULT=3000ms, safety=2000ms in `src/lib/coach/mentor.ts` |

- **Verdict:** Add to docs
- **Rationale:** <2s feels nagging, >5s feels unresponsive. 3s default with 2s safety floor matches Peloton (~4s) and PT session frequency (~3-5s). Well-calibrated values.

#### A5: Rep State Machine Thresholds
| | Documentation | Code Reality |
|---|---|---|
| **Detail** | Conceptual mention | READY→DOWN→UP→READY with angle thresholds |

- **Verdict:** Add to docs
- **Rationale:** The state machine and hysteresis bands are critical for contributors to understand. Document threshold values and transition conditions per exercise.

#### A6: Form Score Weight Distribution
| | Documentation | Code Reality |
|---|---|---|
| **Scoring** | Generic mention | Weighted: kneeDepth, kneeTracking, backAngle, symmetry |

- **Verdict:** Add to docs
- **Rationale:** Weights encode exercise-specific injury risk prioritization (e.g., kneeTracking weighted high for squats due to valgus collapse risk). Must be documented.

#### A7: Skeleton Rendering — Full 33 vs Simplified 10-Joint
| | Documentation | Code Reality |
|---|---|---|
| **Skeleton** | Implies full 33-landmark | 10-joint simplified fitness skeleton in `src/components/PoseOverlay.tsx` |

- **Verdict:** Update docs to match code
- **Rationale:** 10-joint skeleton (shoulders, elbows, wrists, hips, knees, ankles) shows exactly what matters for form coaching. Full 33-landmark rendering is noisy and confusing for users. Industry standard for consumer fitness apps.

#### A8: Zustand State Management — Undocumented
| | Documentation | Code Reality |
|---|---|---|
| **State** | Not mentioned | Zustand 5.0.8 for high-frequency pose state |

- **Verdict:** Must add to 02_SYSTEM_ARCHITECTURE.md and 05_TECH_STACK_DECISIONS.md
- **Rationale:** Zustand handles ~30fps pose updates without triggering React re-renders. This is a critical performance architecture decision. Zustand outperforms React Context for high-frequency updates (no provider re-render cascade).

#### A9: Naming Conventions — Inconsistent Documentation
| | Documentation | Code Reality |
|---|---|---|
| **Convention** | Mixed in docs | Consistent camelCase in TypeScript |

- **Verdict:** Clarify in docs
- **Standard:** TypeScript code = camelCase, React components/types = PascalCase, database columns = snake_case, analytics events = snake_case

---

### T: Tech Stack (T1–T9)

#### T1: PWA — No Service Worker Installed
| | Documentation | Code Reality |
|---|---|---|
| **PWA** | next-pwa referenced | No service worker; only IndexedDB offline queue |

- **Verdict:** Update docs to reference Serwist; schedule Phase 1 implementation
- **Rationale:** next-pwa is abandoned (last update 2023). Serwist is the active replacement for Next.js 14+. Service worker required for install prompt, offline shell, and "Add to Home Screen." IndexedDB queue handles data persistence but not asset caching.
- **Phase 1 deliverable:** Install Serwist, configure asset caching strategy, enable install banner

#### T2: Animation Library — Framer Motion vs CSS Transitions
| | Documentation | Code Reality |
|---|---|---|
| **Animation** | Framer Motion | CSS transitions only |

- **Verdict:** Update docs to match code (CSS transitions)
- **Rationale:** Framer Motion adds ~32KB gzipped. CSS transitions handle 90%+ of UI needs. Only case for Framer Motion is exit animations (AnimatePresence) — not needed for coaching app. If ever needed, use LazyMotion with domAnimation (~5KB tree-shaken).

#### T3: Typography — Inter + JetBrains Mono vs System Fonts
| | Documentation | Code Reality |
|---|---|---|
| **Fonts** | Inter + JetBrains Mono | System font stack in `src/app/layout.tsx` |

- **Verdict:** Update docs to match code
- **Rationale:** System fonts = 0KB load, instant render, native feel. Inter ~100KB serves no purpose in a coaching app where users are exercising, not reading long-form. Optional brand upgrade in Phase 2+ via `next/font` with `display: swap`.

#### T4: Stripe Integration — Client SDK vs Server-Only
| | Documentation | Code Reality |
|---|---|---|
| **Stripe** | @stripe/stripe-js implied | Server-side only (stripe 16.6.0) |

- **Verdict:** Update docs to match code
- **Rationale:** Hosted Checkout redirects to Stripe's page. No client SDK needed. @stripe/stripe-js only required for embedded Elements. Server-only approach is simpler, more secure, and PCI-compliant by default.

#### T5: Zod Validation — Undocumented
| | Documentation | Code Reality |
|---|---|---|
| **Validation** | Not specified | Zod schema validation in use |

- **Verdict:** Add to tech stack docs
- **Rationale:** Zod is the TypeScript validation standard. Already in codebase, must be documented.

#### T6: idb Library — Undocumented
| | Documentation | Code Reality |
|---|---|---|
| **IndexedDB** | Generic "IndexedDB" mention | `idb` library in `src/lib/storage/offlineQueue.ts` |

- **Verdict:** Add to tech stack docs
- **Rationale:** `idb` is a thin Promise wrapper over the callback-based IndexedDB API. Correct library choice.

#### T7: Rendering — Canvas 2D
| | Documentation | Code Reality |
|---|---|---|
| **Overlay** | Not specified | Canvas 2D in `src/components/PoseOverlay.tsx` |

- **Verdict:** Add to architecture docs
- **Rationale:** 10 joints + ~12 lines at 30fps is trivial for Canvas 2D. WebGL would add complexity for zero performance benefit at this scale.

#### T8: Voice Coaching — Web Speech API
| | Documentation | Code Reality |
|---|---|---|
| **TTS** | Generic mention | Browser SpeechSynthesis in `src/lib/coach/coachVoice.ts` |

- **Verdict:** Document current implementation
- **Rationale:** Free, zero-latency, works offline. Quality varies by device/browser. Pre-recorded human audio packs planned for Phase 2+ (already in roadmap).

#### T9: Next.js Version Specifics
| | Documentation | Code Reality |
|---|---|---|
| **Framework** | "Next.js" generic | Next.js 16.0.7, App Router, React 19.1.0, TypeScript 5 |

- **Verdict:** Update docs with version specifics
- **Rationale:** Next.js 16 App Router patterns differ significantly from Pages Router. Version-specific documentation prevents pattern confusion.

---

### U: UI/UX Design (U1–U8)

#### U1: Exercise Selection — Card Grid Pattern
- **Verdict:** Document card-based grid with visual preview
- **Rationale:** Card-based selection with exercise images has 40% higher engagement than dropdowns. 3-card grid is ideal for Beta 1 (3 exercises). Scales to 6-8 before needing categories.

#### U2: Camera Aspect Ratio — Native Portrait
- **Verdict:** Document native aspect ratio in portrait
- **Rationale:** Forcing 16:9 letterboxes on most phones. Native aspect maximizes visible body area. Portrait mode correct for full-body exercise viewing.

#### U3: Coaching Cue Display — Fade-in Pattern
- **Verdict:** Document subtle fade-in (150-200ms) at fixed position
- **Rationale:** During exercise, attention is on body. Cues should appear smoothly without distraction at top-center or bottom-center with high contrast. Slide/bounce animations are distracting.

#### U4: Color System — Blue Primary
- **Verdict:** Verify CSS custom properties match docs
- **Rationale:** Blue conveys trust/authority in health/fitness. Dominant color in fitness apps (MyFitnessPal, Fitbit, Samsung Health). Green for success states. Avoid red for primary actions.

#### U5: Pre-Permission Camera Card
- **Verdict:** Document pattern; implement for Beta 1
- **Rationale:** Pre-permission explanations increase camera grant rates by 81%. Pattern: explain why → "video never leaves your device" → trigger browser permission. Beta 1 P0 requirement.

#### U6: History Page — Skeleton Screens
- **Verdict:** Document skeleton screen pattern
- **Rationale:** Skeleton screens feel 35% faster than spinners. Prevent layout shift. Standard loading pattern for data-heavy pages.

#### U7: Design Tokens — Single Source of Truth
- **Verdict:** Audit and align globals.css with docs
- **Rationale:** CSS custom properties in `src/app/globals.css` must be the single source of truth. Docs reference values, not define separate ones.

#### U8: Mobile Safe Areas
- **Verdict:** Verify `env(safe-area-inset-*)` implementation
- **Rationale:** Required for notch/Dynamic Island phones. Without it, UI elements hide behind hardware features. Critical iOS usability requirement.

---

### C: Customer Experience (C1–C7)

#### C1: Error Boundary Strategy — Layered
- **Verdict:** Document three-layer strategy
- **Layers:**
  1. **Global** — catches crashes with recovery option
  2. **Route-level** — preserves navigation on page errors
  3. **Component-level** — camera/pose failures with specific recovery actions
- **Pattern:** Each error shows: what happened → why → what to do next

#### C2: prefers-reduced-motion — WCAG Compliance ⚠️
- **Verdict:** **IMMEDIATE CODE CHANGE REQUIRED**
- **Rationale:** All CSS transitions/animations must be wrapped in `@media (prefers-reduced-motion: no-preference)`. This is a WCAG 2.1 AA requirement and a legal obligation in many jurisdictions.
- **Priority:** Beta 1 blocker

#### C3: Auth Page — Unified Pattern
- **Verdict:** Document unified auth page with tab toggle
- **Rationale:** Single page with Sign In / Sign Up toggle reduces friction. Standard pattern used by Auth0, Clerk, Supabase Auth UI.

#### C4: Profile Creation — Lazy Pattern
- **Verdict:** Document lazy profile creation
- **Rationale:** Don't force profile completion before first session. Minimal profile on signup (email + ID), prompt for details after first session or at paywall. Reduces signup-to-value friction.

#### C5: Offline Sync UX — User Awareness
- **Verdict:** Document offline indicator pattern
- **Rationale:** Users must know when offline. Show subtle banner ("Offline — sessions sync when reconnected") and sync indicator. IndexedDB queue handles data; users need state awareness.

#### C6: Session Lifecycle — State Machine
- **Verdict:** Document actual session states and transitions
- **States:** idle → camera setup → calibrating → coaching → paused → complete → saving → saved
- **Rationale:** Explicit state documentation prevents edge-case bugs and helps contributors understand the flow.

#### C7: Accessibility Audit — Beta 1 Minimum
- **Verdict:** Add a11y checklist to release checklist
- **Beta 1 scope:**
  - Color contrast ≥4.5:1 text, ≥3:1 large text
  - All interactive elements keyboard-accessible
  - Touch targets ≥44×44px
  - prefers-reduced-motion respected
  - Screen reader labels on coach controls
- **Full WCAG audit:** Phase 1

---

## Action Summary

| Action Type | Count | Items |
|---|---|---|
| Update docs to match code | 19 | A1, A2, A3, A7, A9, T2, T3, T4, T9, U1-U8, C3, C4, C6 |
| Add undocumented to docs | 10 | A4, A5, A6, A8, T5, T6, T7, T8, C1, C5 |
| Phase 1+ migration | 3 | A3 (LIVE_STREAM), T1 (Serwist), T3 (Inter font optional) |
| Immediate code change | 1 | C2 (prefers-reduced-motion) |

## Next Steps

1. **Immediate:** Fix C2 (prefers-reduced-motion) — Beta 1 blocker
2. **Before Beta 1:** Update all 19 doc mismatches and add 10 undocumented items
3. **Phase 1 planning:** LIVE_STREAM migration, Serwist PWA, optional Inter font
4. **Phase 1 delivery:** Full WCAG 2.1 AA audit (C7)

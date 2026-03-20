# AI Form Coach — Product Requirements Document
**Version:** 1.0 | **Status:** War Room Active | **Date:** March 2026
**Owner:** Product Manager | **Approved by:** Tech Lead

---

## 1. Product Vision & Strategic Context

AI Form Coach is the **first accessible, browser-based AI fitness form coaching product** in an unambiguously vacant market. Every direct competitor using camera-based form correction at the consumer level has exited, pivoted to B2B healthcare, or been buried inside expensive hardware (all of which failed). The product ships as a Web/PWA with on-device MediaPipe inference — no app store, no hardware dependency, no cloud AI in the live coaching path.

**Core Promise:** _"Know your form is right, every rep."_

**GTM Wedge (Research-validated):** Consumer DTC first targeting beginner/intermediate home workout users with form anxiety, with a B2B pipeline (PT clinics, corporate wellness) opening at Month 6–9.

**MVP Release Posture:** Free beta → freemium launch. No paid gate on day one of beta.

---

## 2. Target Users

### Primary (MVP)
**The Form-Anxious Home Exerciser**
- Age: 22–40, exercises 3–5x/week at home or without gym access
- Exercises alone; no trainer, no spotter, no feedback loop
- Motivated to improve but uncertain whether technique is correct
- Has experienced or fears injury from bad form
- Devices: iPhone (Safari) and Android (Chrome) — laptop/desktop as secondary
- **Insight:** 50–65% of exercisers cite form anxiety as a workout barrier. 564,845 exercise-related ER visits in the US in 2024 (up 17% YoY)

### Secondary (MVP)
**The Returning Exerciser**
- Rejoining fitness after injury, pregnancy, or extended break
- Needs confidence and guided feedback, not programming complexity

### Tertiary (Post-MVP, Month 6+)
**PT Clinics / Corporate Wellness Buyers**
- PT: Licensed therapist or front-desk admin needing patient HEP compliance tool
- Corporate: HR/Benefits Manager at 50–500 person company seeking AI fitness benefit

---

## 3. MVP Scope (Locked)

### 3.1 Supported Exercises (Launch)
- Squat
- Pushup
- Plank

No other exercises ship in MVP. All coaching logic, cue packs, and tutorial content are scoped to these three.

### 3.2 Public Routes
| Route | Description | Auth Required |
|---|---|---|
| `/` | Landing page | No |
| `/auth/signin` | Sign in | No |
| `/auth/signup` | Create account | No |
| `/coach` | Live coaching session | Yes |
| `/history` | Session history | Yes |
| `/pricing` | Beta pricing info | No |
| `/privacy` | Privacy policy | No |
| `/terms` | Terms of service | No |

All other routes (nutrition, food scan, readiness, organizations, leaderboards, challenges, creator packs, embeddings, demo/test/internal) are **de-scoped from MVP** and hidden from nav, sitemap, and onboarding via FeatureRegistry.

### 3.3 Core User Flow (MVP Critical Path)
```
Landing → Sign Up / Sign In → Exercise Select → Frame Body → Start Session
→ Live Coaching (reps + real-time cues) → Pause / Resume → End Session
→ Post-Session Feedback → Save → Session History
```

### 3.4 Coaching Session Requirements
- **Exercise selection:** Squat, Pushup, Plank (UI picker, single selection per session)
- **Framing guidance:** On-screen overlay guides user to correct distance/angle before session starts
- **Countdown:** 3-second countdown before session begins
- **Live overlay:** Minimal skeleton (FitnessSkeleton17 + DerivedJoints) rendered on Canvas2D atop camera feed. No facial landmarks visible publicly.
- **Cue delivery:** Voice + on-screen text. Human-authored cue library. Human-recorded audio for top cues. Browser `speechSynthesis` as fallback.
- **Rep counting:** State machine per exercise (READY → DOWN → UP → READY with hysteresis)
- **Session controls:** Pause, Resume, End Session
- **Post-session:** Summary (reps completed, session duration, cue feedback prompt), Save button
- **Save outcome:** Persisted to session history. Must succeed >99% of the time.

### 3.5 Session History Requirements
- Shows real persisted sessions — no demo/placeholder fallback
- Displays: date, exercise, rep count, duration
- Sessions persist across devices (Supabase-backed)
- Basic offline queue with eventual sync

### 3.6 Device Support Matrix (MVP)
| Platform | Browser | Status |
|---|---|---|
| iPhone (iOS 16+) | Safari | ✅ Required |
| Android (12+) | Chrome | ✅ Required |
| Desktop | Chrome | ✅ Required |
| Desktop | Firefox | 🔜 Post-MVP |
| iPad | Safari | 🔜 Post-MVP |

---

## 4. MVP Feature Requirements

### 4.1 Authentication
- Email/password signup and signin
- Session persistence across page reloads
- Password reset flow
- No OAuth providers required at MVP (can be added post-launch)

### 4.2 Onboarding
- Minimal friction: account creation → direct to `/coach`
- Camera permission request with clear explanation of on-device processing
- First-session framing guide (exercise-specific body positioning instructions)
- No mandatory profile creation gating the coaching flow

### 4.3 Live Coach Page (`/coach`)
**Stage 1: Exercise Selection**
- Visual picker: Squat | Pushup | Plank
- Each with exercise thumbnail, name, difficulty indicator
- Selection triggers camera initialization

**Stage 2: Camera Framing**
- Live camera preview
- Overlay guide showing ideal body positioning for selected exercise
- Readiness indicator ("You're in frame — looks good" / "Step back" / "Move closer")
- Device readiness checks: camera permission, frame rate, lighting guidance
- Ready state must be confirmed before countdown

**Stage 3: Active Session**
- Live camera feed with skeleton overlay
- Rep counter (large, top of screen)
- Form score indicator (per-rep quality signal)
- Voice cues triggered by cue engine (calmer cadence — not every frame)
- On-screen text cue (matches voice, remains for 3 seconds)
- Session timer
- Pause/Resume button always accessible

**Stage 4: Post-Session**
- Summary card: exercise, reps, duration, avg form score
- Cue feedback prompt ("Was the coaching helpful?" — binary, optional)
- Save Session button (primary CTA)
- Start Again / Switch Exercise (secondary)

### 4.4 Session History (`/history`)
- Chronological list of saved sessions
- Each card: exercise icon, date/time, reps, duration, form score
- Empty state: clear first-session CTA
- No pagination needed at MVP (last 30 sessions max)

### 4.5 Pricing Page (`/pricing`)
- Beta state messaging: free during beta
- Future tier preview (teaser only — no Stripe integration at MVP beta)
- Email capture for upgrade notifications

### 4.6 Privacy & Data
- Clear copy: motion analysis is on-device, video is never uploaded or stored
- GDPR-compliant data handling for session metadata
- Account deletion flow must exist and work
- No analytics SDKs that capture video or biometric data

---

## 5. Non-Functional Requirements

### 5.1 Performance (Hard Release Gates)
| Metric | Target | Measurement |
|---|---|---|
| Detector median latency | ≤25ms/frame | Playwright performance harness on target devices |
| Overlay render budget | ≤4ms/frame | requestAnimationFrame timing |
| End-to-end cue latency | p95 ≤300ms | From landmark detection to voice onset |
| Frame drop rate (60s session) | <10% | Automated smoke suite |
| Session save success | >99% | Integration test + retry logic |

### 5.2 Build Gates (Required to Merge to Release Branch)
- `npm run build` — passes with zero errors
- `npm run lint` — passes with zero ESLint/Next config errors
- `npm run test` — MVP test suite green (non-MVP suites in `test:extended`)
- `npm run test:e2e:coach` — Playwright matrix green (Chromium, Android Chrome)
- `npm run test:e2e:coach:iphone` — iPhone Safari green
- Pose performance smoke suite — latency/frame-drop budgets met on real devices (pending)

### 5.3 Availability & Reliability
- Target uptime: 99.5% (excluding Supabase planned maintenance)
- Offline graceful degradation: coaching session functions without internet; save queued
- No public route depends on placeholder AI or demo data

### 5.4 Accessibility
- WCAG 2.1 AA for all non-camera surfaces (landing, auth, history, pricing)
- Camera/coaching overlay: reasonable contrast and readable text (≥16px)
- Voice cue system is the primary accessibility accommodation for the live coaching surface

### 5.5 Privacy & Security
- Video stream never leaves the device — strictly client-side MediaPipe inference
- No cloud AI in the live coaching path
- HTTPS everywhere
- Auth tokens handled via Supabase secure cookie pattern
- Rate limiting on auth endpoints

---

## 6. Content Requirements

### 6.1 Human-Authored Cue Library (MVP)
Must ship with locked, wellness-consultant-reviewed cues for:
- **Squat:** Depth, knee tracking, back angle, chest up, weight distribution
- **Pushup:** Core engagement, hand position, elbow angle, neck neutral
- **Plank:** Hip height, shoulder stack, core bracing, breathing

Cue wording: action-oriented, positive-framing, ≤10 words per cue, safe/non-clinical language.

### 6.2 Human-Recorded Audio Pack
- Minimum 15 cues per exercise in human-recorded audio
- Sample session start/countdown audio
- Browser `speechSynthesis` handles all cues not covered by audio pack

### 6.3 Tutorials and Demo Movements
- Real human-captured demo movements for each exercise (not AI-generated)
- Used in: exercise selection thumbnail, framing guide, onboarding

### 6.4 Marketing Copy Rules
- No "100% accurate" or "production ready" claims until verified
- No unsupported health device claims ("medical grade", "clinically validated")
- Accurate beta-state messaging on all public pages
- Form coaching is positioned as supportive guidance, not clinical diagnosis

---

## 7. Post-MVP Feature Roadmap

### Phase 2 (Month 2–4 post-launch, ~Q3 2026)
**Goal:** Improve retention and shareable moments

| Feature | Priority | Rationale |
|---|---|---|
| Shareable Form Score cards | P1 | Viral acquisition — zero cost channel |
| Streak system | P1 | Duolingo-proven retention mechanic |
| Exercise library expansion (lunge, deadlift, row) | P1 | Unlock more use cases |
| Environment calibration onboarding | P1 | Fixes #1 user complaint (tracking failures) |
| Wearable integration (Apple Watch, Garmin — HRV/recovery overlay) | P2 | Table stakes for premium tier |
| Freemium paywall activation + Stripe billing | P1 | Revenue enablement |

### Phase 3 (Month 4–8 post-launch, ~Q4 2026)
**Goal:** Revenue growth + B2B pipeline open

| Feature | Priority | Rationale |
|---|---|---|
| Pro tier ($9.99/mo or $69.99/yr) | P1 | Core monetization |
| Premium tier ($14.99/mo or $99.99/yr) | P2 | Advanced analytics + progressive programming |
| Fitness Age Score | P2 | Premium hook — unique, high engagement |
| Social Accountability Pods (3–6 people) | P2 | Gen Z gym anxiety solution |
| Voice AI Coach (conversational in-session) | P2 | Hands-free premium feature |
| PT Clinic MVP — basic reporting dashboard | P2 | B2B pipeline opener |
| HIPAA compliance infrastructure | P1 (B2B gate) | Required for any healthcare client |

### Phase 4 (Month 8–16 post-launch, ~Q1–Q2 2027)
**Goal:** B2B revenue + premium consumer scale

| Feature | Priority | Rationale |
|---|---|---|
| B2B Admin Dashboard (HR/clinic portal) | P1 | Enterprise sales enablement |
| Wellhub Partner Integration | P1 | 15,000 corporate clients, 3M members, zero cost to join |
| White-label option | P2 | $50K+ ACV contracts |
| HSA/FSA integration | P2 | Price sensitivity reduction |
| Industry Leaderboards | P2 | Status signaling for premium users |
| Healthspan Dashboard | P2 | Longevity trend — premium justification |
| Multi-angle fusion (front + side camera) | P3 | Technical accuracy improvement |

### Phase 5 (Month 16–24, ~2027)
**Goal:** Platform / bundling

| Feature | Priority | Rationale |
|---|---|---|
| Recovery Protocol Engine | P2 | Holistic wellness expansion |
| Injury Prevention Alerts | P1 | Long-term data moat |
| AI-generated progressive workout plans | P2 | Retention improvement |
| Heatwave Sauna unified subscription bundle | P2 | Cross-product premium tier |
| Native mobile apps (React Native) | P2 | Distribution expansion, App Store reach |

---

## 8. Out of Scope (Permanently for MVP, Revisit Post-Phase 2)
- Nutrition tracking, food scan, meal planning
- Sleep tracking or readiness scores
- Organization/team/leaderboard features
- Creator packs or content marketplace
- NFT achievements or Web3 elements
- Telehealth or clinical diagnosis features
- Multi-person simultaneous pose detection
- 3D depth-rich rendering in live coaching path
- Hardware integrations (beyond wearable data reads)

---

## 9. Success Metrics (Beta Gate → Launch Decision)

| Metric | Beta Gate | Launch Confidence |
|---|---|---|
| Session completion rate (start to save) | ≥60% | ≥70% |
| Repeat session rate (D7) | ≥20% | ≥30% |
| Cue usefulness rating (% positive) | ≥65% | ≥75% |
| Save success rate | ≥99% | ≥99% |
| Frame drop rate in 60s session | <10% | <5% |
| NPS (beta cohort survey) | ≥20 | ≥40 |

---

## 10. Assumptions & Dependencies

- MediaPipe Pose Landmarker Lite/Full performs within latency budgets on target devices (pending real-device validation)
- Supabase free/pro tier handles beta-scale load without custom infrastructure
- Wellness consultant reviews and locks all cue content before launch
- Human-recorded audio pack (15+ cues × 3 exercises) is produced before controlled beta
- Real human demo movement videos are shot before controlled beta (can use contractor)
- iOS Safari camera permission reset behavior is handled in the SPA routing layer

---

_Document maintained by Product Manager. All scope changes require Tech Lead + Product Manager approval and must be logged in the decision log._

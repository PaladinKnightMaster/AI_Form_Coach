> Beta 2 planning note: this document is part of the initial Beta 2 planning baseline. It does not represent shipped Beta 1 status by itself. Re-check it against [../technical/MVP_TRUTH_BASELINE.md](../technical/MVP_TRUTH_BASELINE.md), [../technical/MVP_RELEASE_SCORECARD.md](../technical/MVP_RELEASE_SCORECARD.md), and [../technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md](../technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md) before using it for roadmap or release decisions.
# AI Form Coach — UI/UX Goals
**Version:** 1.0 | **Status:** War Room Active | **Date:** March 2026
**Owner:** Principal UI/UX Designer | **Reviewed by:** Product Manager + Wellness Consultant

---

## 1. Design Philosophy

AI Form Coach exists to solve a specific anxiety: **"Am I doing this right?"** Every design decision must serve that mission — reduce uncertainty, deliver clear feedback, and get out of the way of the workout.

### The Three Laws of Coaching UX

**1. The camera is the product.** The coaching surface is not a dashboard, a settings panel, or a content feed. It is a camera with intelligence. The UI wraps the camera — it never competes with it.

**2. Coaching cues must feel like a calm PT, not a buzzing notification.** Feedback is restrained, purposeful, and positive-first. No red alerts for minor form issues. No cue every 2 seconds. A single clear instruction, delivered with confidence, at the right moment.

**3. Everything outside the session should be invisible until needed.** Navigation, settings, and history are accessible but never interrupt the workflow from "open app → start coaching."

---

## 2. Visual Identity

### 2.1 Color System

The coaching surface is **dark-mode first** — the camera feed is the light source. All UI chrome recedes into dark surfaces.

```
Brand Primary:    #2563EB   (coaching blue — interactive elements, CTAs)
Brand Accent:     #10B981   (form score green — positive feedback, good reps)
Brand Warning:    #F59E0B   (correction amber — active cues, mid-range form)
Brand Danger:     #EF4444   (safety red — safety cues only, rare)
Brand Surface:    #0F172A   (dark background — coaching screen)
Brand Overlay:    #1E293B   (panel/card surface)
Brand Border:     #334155   (subtle dividers)
Brand Text:       #F8FAFC   (primary text on dark)
Brand TextMuted:  #94A3B8   (secondary text, labels)
```

Non-coaching surfaces (landing, pricing, history) use a **light/dark auto mode** following system preference. The coach page is always dark.

### 2.2 Typography

```
All text:            System font stack (0KB load, instant render, native feel)
                     system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Rep Counter:         System monospace (700) — tabular figures, no reflow on count changes
Form Score:          System monospace (600)
                     ui-monospace, 'SF Mono', Monaco, 'Cascadia Mono', monospace
Cue Text:            System sans-serif (500, 18px minimum on mobile)
```

> **Note:** Inter + JetBrains Mono were originally planned but not implemented.
> System fonts are used instead — 0KB vs ~100KB load. For a coaching app where
> users are exercising, load speed matters more than typography differentiation.
> Optional brand upgrade via `next/font` in Phase 2+ if needed.

**Type scale (coaching surface — optimized for glanceability at arm's length):**
| Element | Size | Weight | Notes |
|---|---|---|---|
| Rep counter | 72px | 700 mono | Readable at 1.5m arm's length |
| Form score | 36px | 600 mono | |
| Exercise name | 20px | 600 | |
| Cue text | 18px | 500 | 3s display, bottom of screen |
| Timer | 16px | 500 mono | |
| Button labels | 16px | 600 | |

### 2.3 Skeleton Overlay Visual Language

The skeleton overlay follows a **Sword Health-inspired restrained aesthetic** — clinical, minimal, purposeful. This is a UX reference only, not a business model reference.

```
Default skeleton:       2px stroke, white (#FFFFFF), 40% opacity
Active joint/segment:   4px stroke, correction color (amber or red)
Good form indicator:    Accent green (#10B981)
Low visibility joint:   Dashed stroke, 20% opacity
Head indicator:         Single dot, 6px radius — no facial landmarks
```

**Anti-patterns to avoid:**
- No rainbow-colored skeleton (gimmicky, distracting)
- No pulsing/glowing joints (battery drain, distraction)
- No 3D depth shading on skeleton lines
- No debug overlays (angles, vectors) visible in production
- No skeleton rendering when landmark visibility <0.3 (draw nothing, not bad data)

---

## 3. Screen Flows

### 3.1 Primary Flow (Happy Path)

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Landing   │───▶│  Sign Up /   │───▶│  Exercise    │───▶│   Framing    │
│   Page      │    │  Sign In     │    │  Select      │    │   Guide      │
└─────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                   │
                        ┌──────────────────────────────────────────▼
                        │
                   ┌────▼─────────┐    ┌──────────────┐    ┌──────────────┐
                   │  Countdown   │───▶│  Active      │───▶│   End /      │
                   │  3...2...1   │    │  Session     │    │   Save       │
                   └─────────────-┘    └──────┬───────┘    └──────┬───────┘
                                              │                   │
                                       ┌──────▼───────┐    ┌──────▼───────┐
                                       │   Paused     │    │   History    │
                                       │   State      │    │   Page       │
                                       └──────────────┘    └──────────────┘
```

**Flow rules:**
- Every screen except Landing and auth has a back/cancel affordance
- The path from "open app (logged in)" to "session started" is **≤3 taps**: Exercise Select → Framing Ready → Countdown → Start
- No modals or interstitials interrupt this path
- Session save is a single button — never multi-step

### 3.2 First-Time User Flow

```
Sign Up (lazy profile — email + ID only) →
Exercise Select (card grid, "tap an exercise to start" tooltip, one-time) →
Pre-Permission Camera Card (branded explanation, NOT the browser prompt) →
Browser Camera Permission Prompt →
Framing Guide (more verbose first time — shows positioning diagram) →
Session Start
```

**Pre-Permission Camera Card (Critical — Beta 1 P0):**

Research shows pre-permission explanations increase camera grant rates by **81%**.
The pre-permission card appears BEFORE the browser's native permission prompt:

```
┌─────────────────────────────────┐
│                                 │
│  📷  Camera Access Needed       │
│                                 │
│  AI Form Coach uses your camera │
│  to see your exercise form and  │
│  give real-time feedback.       │
│                                 │
│  🔒 Your video is processed     │
│     on your device and NEVER    │
│     uploaded or stored.         │
│                                 │
│  [Preview: skeleton overlay     │
│   on example body image]        │
│                                 │
│  ┌───────────────────────────┐  │
│  │   Allow Camera Access →   │  │  ← THEN triggers browser prompt
│  └───────────────────────────┘  │
│                                 │
│  Why do you need my camera? →   │  ← Expandable FAQ
│                                 │
└─────────────────────────────────┘
```

The first-time experience adds exactly **two additional screens** (pre-permission card + camera card) and one **one-time tooltip**. No mandatory profile setup. No onboarding carousel. No survey.

---

## 4. Screen-by-Screen Specifications

### 4.1 Landing Page (`/`)

**Goal:** Convert a skeptical first-time visitor to sign up or start trial in under 30 seconds.

**Above the fold (mobile):**
```
┌─────────────────────────────────┐
│  [Logo]               [Sign In] │
├─────────────────────────────────┤
│                                 │
│  Know your form is right.       │  ← H1, 32px, high contrast
│  Every rep.                     │
│                                 │
│  AI form coaching in your       │  ← Subtitle, 18px, muted
│  browser. No hardware.          │
│  No subscription on day one.    │
│                                 │
│  ┌─────────────────────────┐    │
│  │   Start for Free →      │    │  ← Primary CTA, brand blue
│  └─────────────────────────┘    │
│                                 │
│  [Demo loop: form overlay GIF]  │  ← 5-second autoplay, no sound
│                                 │
└─────────────────────────────────┘
```

**Key rules:**
- Demo loop starts muted, autoplays — shows the core product immediately
- No pricing on landing (reduces friction, beta = free)
- Social proof (if any) is real: "Used by X people in beta" — never fabricated counts
- Privacy statement: "Your camera never leaves your device" — above the fold on mobile
- One CTA above fold. No secondary CTA until below fold.

**Below the fold:**
- 3 feature cards: Form Correction | Rep Counting | Session History
- "How it works" — 3-step visual (Frame → Coach → Improve)
- Exercise previews (squat, pushup, plank thumbnails with form score overlay)
- Footer: Privacy, Terms, GitHub (if open source eventually)

### 4.2 Authentication (`/auth` — Unified Page)

**Minimal friction design — single unified auth page with tab toggle:**
```
┌─────────────────────────────┐
│  [← Back]                  │
│                             │
│  [Sign In]  [Sign Up]      │  ← Tab toggle (modern standard)
│  ─────────  ──────────     │
│                             │
│  [Email input]              │
│  [Password input]           │
│                             │
│  [Continue]                 │  ← Single CTA
│                             │
│  By signing up you agree    │  ← Legal, small, below fold
│  to our Terms & Privacy.    │
└─────────────────────────────┘
```

**Rules:**
- **Unified auth page** — single page with Sign In / Sign Up toggle. No separate routes.
  Reduces friction — users don't have to find the "other" page. Standard pattern (Auth0, Clerk, Supabase Auth UI).
- **Lazy profile creation** — minimal profile on signup (email + ID only). Don't ask for
  height/weight/goals until after first session. Prompt for additional info at paywall.
- No social OAuth at MVP (adds complexity, not needed at beta scale)
- Password requirements: 8+ characters minimum (no complexity theater)
- Error states: inline, field-level ("Email already in use" — not a modal)
- Redirect after sign up: directly to `/coach` (no post-signup survey)

### 4.3 Exercise Select (`/coach` — Stage 1)

```
┌────────────────────────────────────┐
│  [← Back]           AI Form Coach │
├────────────────────────────────────┤
│                                    │
│  What are you working on today?    │
│                                    │
│  ┌──────────┐ ┌──────────┐ ┌─────┐│
│  │  [Squat] │ │[Pushup]  │ │[Plnk││
│  │          │ │          │ │     ││
│  │  Squat   │ │  Pushup  │ │Plank││
│  │  ●●●○○   │ │  ●●○○○   │ │●●○○○││
│  │ Beginner │ │ Beginner │ │Begin││
│  └──────────┘ └──────────┘ └─────┘│
│                                    │
│  [Recent: Squat — 12 reps, 4h ago] │  ← personalized, after 1st session
│                                    │
└────────────────────────────────────┘
```

**Rules:**
- Exercise cards show: thumbnail (human demo movement frame), name, difficulty dots
- Tapping a card immediately initiates camera — no confirmation step
- Recent session hint shows after first completed session
- Difficulty indicators are 5-dot scale — pre-filled based on exercise, not user performance

### 4.4 Framing Guide (`/coach` — Stage 2)

```
┌────────────────────────────────────┐
│                              [✕]   │  ← Exit to exercise select
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │  LIVE CAMERA PREVIEW         │  │  ← Full-width, aspect-ratio locked
│  │                              │  │
│  │    [Body position overlay]   │  │  ← Silhouette guide (where to stand)
│  │                              │  │
│  │  ┌──────────────────────┐    │  │
│  │  │ Step back a little   │    │  │  ← Real-time framing feedback
│  │  └──────────────────────┘    │  │
│  └──────────────────────────────┘  │
│                                    │
│  Squat — Stand facing the camera  │  ← Exercise-specific instruction
│  Feet shoulder-width visible       │
│                                    │
│  ┌────────────────────────────┐    │
│  │  ✓ You're in frame. Ready! │    │  ← Turns green when framing OK
│  └────────────────────────────┘    │
│  [Start Session]                   │  ← Only enabled when ready
└────────────────────────────────────┘
```

**Rules:**
- Camera starts immediately when this stage loads — no separate "enable camera" button
- Start Session button is **disabled** until: camera is active + body is detected + framing score passes
- Silhouette guide is exercise-specific (squat: full body front-facing; pushup: landscape/side)
- Framing feedback updates in real time (<500ms latency from movement to feedback text change)
- No countdown here — countdown only plays after Start Session is tapped

### 4.5 Countdown (`/coach` — Stage 2.5)

```
Full-screen dark overlay on camera feed:

         3
         2
         1
         GO
```

3-second animated countdown, full screen, large numeral. Audio countdown (human-recorded "3... 2... 1... Go"). Countdown cannot be cancelled after it starts — this is intentional (prevents false starts, creates mental readiness).

### 4.6 Active Session (`/coach` — Stage 3)

```
┌────────────────────────────────────┐
│ Squat           0:42   [⏸ Pause]  │  ← Minimal top bar
├────────────────────────────────────┤
│                                    │
│  ╔══════════════════════════════╗  │
│  ║                              ║  │
│  ║   LIVE CAMERA + SKELETON     ║  │  ← Camera dominates the screen
│  ║                              ║  │
│  ║                              ║  │
│  ║                              ║  │
│  ╚══════════════════════════════╝  │
│                                    │
│      ┌──────────┐  ┌──────────┐   │
│      │    12    │  │   87     │   │  ← Rep count | Form score
│      │   REPS   │  │  SCORE   │   │
│      └──────────┘  └──────────┘   │
│                                    │
│  ┌─────────────────────────────┐   │
│  │  "Push your knees out"      │   │  ← Cue text (3s, then fades)
│  └─────────────────────────────┘   │
└────────────────────────────────────┘
```

**Active session rules:**
- Camera feed fills as much screen as possible — minimum 60% of viewport height
- Top bar: exercise name, timer, pause button. Nothing else.
- Rep counter: large mono font, bottom-left. Updates on rep completion (not continuously).
- Form score: large mono font, bottom-right. Updates per-rep, not per-frame (avoids flickering).
- Cue text: appears at bottom center on cue trigger. Fades after 3 seconds. Max 1 cue visible at a time.
- Pause button: always accessible, one tap. Does not require confirmation.
- **No settings, no navigation, no back button during active session.** Exit via Pause → End Session.

**Cue text visual behavior:**
```
Trigger → Subtle fade-in at fixed position (150–200ms CSS transition ease-out)
Display for 3000ms
Fade out (200ms)

Position: bottom-center of screen (fixed, not animated from edge)
Rationale: During exercise, users' attention is on their body. Slide/bounce
           animations from edges are distracting. Fade-in at a fixed position
           with high contrast is optimal for glanceability.

Highlight: the skeleton segment(s) related to the cue change to correction amber
           simultaneously with the text cue appearing.
```

### 4.7 Paused State (`/coach` — Stage 3B)

```
┌────────────────────────────────────┐
│  [⬅ Exercise Select]              │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │  Blurred / dimmed camera     │  │  ← Camera continues but blurred
│  └──────────────────────────────┘  │
│                                    │
│  Paused — 12 reps in 0:42          │
│                                    │
│  ┌────────────────────────────┐    │
│  │       Resume               │    │  ← Primary CTA
│  └────────────────────────────┘    │
│  ┌────────────────────────────┐    │
│  │   End Session & Save       │    │  ← Secondary (destructive pattern)
│  └────────────────────────────┘    │
└────────────────────────────────────┘
```

**Rules:**
- Camera stream continues (to avoid permission re-request on resume)
- Camera preview is blurred/dimmed — user is resting, not being analyzed
- Timer pauses
- Resume starts a 2-second silent countdown before re-entering active state

### 4.8 Post-Session / Save (`/coach` — Stage 4)

```
┌────────────────────────────────────┐
│  Session Complete! 🎯              │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Squat  ·  March 9, 2026     │  │
│  │                              │  │
│  │    18 reps    ·    1:24      │  │
│  │    Form Score:  84 / 100     │  │
│  └──────────────────────────────┘  │
│                                    │
│  Was the coaching helpful?         │
│  [ 👍 Yes ]       [ 👎 Not really ] │  ← Binary, optional
│                                    │
│  ┌────────────────────────────┐    │
│  │   Save Session             │    │  ← Primary CTA, brand blue
│  └────────────────────────────┘    │
│                                    │
│  [ Start Again ]  [ Switch Exercise│
│                                    │
└────────────────────────────────────┘
```

**Rules:**
- Cue feedback is optional — no blocking prompt, just passive buttons
- Save is the primary action — tapping it persists to Supabase (and queues if offline)
- Save shows a loading state for up to 2 seconds, then success confirmation or error with retry
- "Start Again" reloads the same exercise at framing stage
- "Switch Exercise" returns to exercise select

### 4.9 Session History (`/history`)

```
┌────────────────────────────────────┐
│  [← Back]          Your History   │
├────────────────────────────────────┤
│                                    │
│  7 sessions this week  ▓▓▓▓▓▓▓○○  │  ← Activity ring (post-MVP full)
│                                    │
├────────────────────────────────────┤
│  Today                             │
│  ┌──────────────────────────────┐  │
│  │ 🏋️  Squat    18 reps  1:24   │  │
│  │     Form: 84    9:32 AM      │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 💪  Pushup   12 reps  0:58   │  │
│  │     Form: 71    7:15 AM      │  │
│  └──────────────────────────────┘  │
│  Yesterday                         │
│  ┌──────────────────────────────┐  │
│  │ 🏋️  Squat    15 reps  1:10   │  │
│  │     Form: 79   6:45 PM       │  │
│  └──────────────────────────────┘  │
│                                    │
│  [+ Start New Session]             │  ← Persistent FAB
└────────────────────────────────────┘
```

**Rules:**
- No empty history shame — empty state shows encouraging first-session CTA with exercise previews
- Sessions grouped by date, reverse chronological
- Form score uses color coding: green ≥80, amber 60–79, red <60
- Tapping a session card shows a detail modal (rep breakdown — post-MVP; summary only at MVP)
- Floating action button "Start New Session" is always visible — history is a dead-end otherwise

---

## 5. Interaction Patterns

### 5.1 Loading States

| Context | Pattern |
|---|---|
| MediaPipe initializing | Full-screen skeleton animation (branded, not generic spinner) |
| Camera permissions request | Branded permission card (before browser prompt fires) |
| Session saving | Button loading state + subtle progress ring |
| History loading | Skeleton screens (gray card-shaped placeholders) — never blank. Skeleton screens feel 35% faster than spinners in user perception studies. |
| API error | Inline error with retry button — never navigate away |

### 5.2 Error States

Every error has three properties: **what happened**, **why it matters**, and **what to do next**.

| Error | Message Pattern |
|---|---|
| Camera permission denied | "Camera access is needed for form coaching. [How to enable →]" |
| Poor lighting detected | "It's a bit dark — try moving near a window or turning on a light." |
| Body not in frame | "Step back until your full body is visible." |
| Session save failed (offline) | "Saved locally — will sync when you're back online." |
| Session save failed (server) | "Save failed. [Retry] Your session isn't lost." |
| MediaPipe failed to load | "Form analysis couldn't start. [Try again] or [Check connection]" |

**No modals for errors.** All error states are inline, contextual, and non-blocking where possible.

### 5.3 Haptics

```typescript
// Trigger device haptic on rep completion (where supported)
if ('vibrate' in navigator) {
  navigator.vibrate(50);  // 50ms pulse — subtle, not jarring
}
```

Haptic on: rep completion, session start, session save success.
No haptic on: cue delivery, errors (too intrusive during exercise).

### 5.4 Transitions

| Transition | Pattern | Duration |
|---|---|---|
| Stage 1 → 2 (exercise select → framing) | Slide left (300ms ease-out) | 300ms |
| Stage 2 → 3 (countdown → active) | Countdown fade → reveal | ~3.5s |
| Stage 3 → 3B (active → pause) | Blur camera + darken (200ms) | 200ms |
| Stage 3B → 3 (resume) | Un-blur + countdown (2s silent) | 2s |
| Stage 3 → 4 (end → post-session) | Slide up from bottom | 350ms |
| Route transitions (history, pricing) | Fade | 200ms |

All transitions use CSS transitions. Framer Motion is not installed (saves ~32KB gzip). CSS transitions handle 90%+ of UI needs. If exit animations (AnimatePresence) are ever needed, evaluate `LazyMotion` with `domAnimation` (~5KB tree-shaken).

---

## 6. Accessibility

### 6.1 Non-Camera Surfaces (WCAG 2.1 AA Required)
- All text: minimum 4.5:1 contrast ratio
- All interactive elements: minimum 44×44px touch target
- All form inputs: visible labels (not placeholder-only)
- All buttons: descriptive accessible names (not "Button" or "Submit")
- Keyboard navigation: all flows completable without mouse
- Screen reader: ARIA roles on custom components (Radix handles most of this)
- Focus management: visible focus rings on all interactive elements

### 6.2 Camera/Coaching Surface (Best Effort)
- Cue text: minimum 18px, high-contrast on dark overlay
- Rep counter: high-contrast, minimum 72px, visible over any camera feed
- Voice cues are the primary accessibility accommodation for the live surface
- Sessions completable with audio cues only (no vision required for rep feedback)
- Pause button: large touch target (minimum 48×48px), always visible

### 6.3 Reduced Motion ⚠️ (WCAG 2.1 AA Required — Beta 1 Blocker)

**All CSS transitions and animations MUST be wrapped in a motion preference check.**
This is a legal requirement in many jurisdictions and an accessibility necessity.

```css
/* All decorative animations gated behind motion preference */
@media (prefers-reduced-motion: no-preference) {
  .cue-text { transition: opacity 200ms ease-out; }
  .stage-transition { transition: transform 300ms ease-out; }
}

@media (prefers-reduced-motion: reduce) {
  /* All transitions: instant (no animation) */
  /* Camera overlay still renders (functional, not decorative) */
  /* Cue text appears immediately without fade */
  /* Skeleton overlay animation disabled */
}
```

**Audit scope for Beta 1:**
- All CSS transitions in `globals.css` and component styles
- All programmatic animations (if any)
- Verify with browser devtools: enable `prefers-reduced-motion: reduce`

---

## 7. Responsive Behavior

| Breakpoint | Primary Use | Camera Orientation |
|---|---|---|
| 375–430px (mobile portrait) | Primary target — iPhone/Android | Portrait |
| 430–768px (large mobile) | Secondary | Portrait |
| 768–1024px (tablet) | Post-MVP | Landscape preferred |
| 1024px+ (desktop) | Secondary target — laptop | Landscape |

**Portrait mobile is the primary design target.** Every component is designed mobile-first. Desktop is additive — the coaching surface scales up gracefully but is not the launch priority.

**Camera aspect ratio:**
```typescript
// Use native camera aspect ratio — do NOT force 4:3 or 16:9
// Rationale: Forcing a specific ratio letterboxes on most phones.
// Native aspect maximizes visible body area for form coaching.
const constraints: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
    // aspectRatio not constrained — let the device choose native
  }
};
```

**Mobile safe areas (required for iOS):**
```css
/* Required for notch/Dynamic Island phones */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```
Without `env(safe-area-inset-*)`, UI elements hide behind the notch/Dynamic Island on modern iPhones. This must be applied to the coaching surface and all full-screen views.

---

## 8. Design Anti-Patterns to Avoid

| Anti-Pattern | Why It's Wrong Here |
|---|---|
| Onboarding carousel (3–5 slides) | Delays time to first value; users skip it anyway |
| Mandatory profile photo / fitness level quiz | Friction before first session; violates "3 taps to coaching" rule |
| Pop-up rating requests mid-session | Destroys the coaching moment; iOS/Android best practice violations |
| Gamification badges on every screen | Premature; build the core loop first |
| "Are you sure?" confirmation on End Session | One extra tap per session × every user × every session = pain |
| Social feed on history page | Cold-start problem; creates empty screens; post-Phase 3 minimum |
| Form score as a letter grade | Invites shame ("C-" is demotivating); numerical score is neutral |
| Permanent top navigation | Wastes vertical space on mobile; the camera needs all pixels |

---

## 9. Design System Deliverables (UI/UX Designer Scope)

Before beta launch, these must be finalized and design-reviewed:

- [ ] Landing page (mobile + desktop variants)
- [ ] Exercise select screen (all 3 exercises, empty/loading states)
- [ ] Framing guide (per exercise: squat, pushup, plank)
- [ ] Active session screen (all states: normal, cue active, paused)
- [ ] Post-session summary card
- [ ] Session history (populated + empty state)
- [ ] Auth screens (sign up + sign in + password reset)
- [ ] Error states (all 6 documented in §5.2)
- [ ] Skeleton overlay visual style guide (joint colors, stroke weights, active states)
- [ ] Cue text animation spec (timing, easing, position)
- [ ] Component library: Button, Input, Card, Modal, Badge, SkeletonLoader

Figma source of truth. Handoff to Frontend Engineer via Figma Dev Mode.

---

_Maintained by Principal UI/UX Designer. All visual changes to the coaching surface require wellness consultant review before implementation. User-facing copy changes require product manager sign-off._


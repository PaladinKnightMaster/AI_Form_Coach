# Customer Experience Journey Map

> **Version:** 1.0
> **Date:** 2026-03-20
> **Product:** AI Form Coach — Browser-based, on-device AI form coaching
> **Model:** Freemium SaaS (Free / Pro $9.99 / Premium $14.99)

## Journey Overview

```
Discovery → Landing → Signup → Onboarding → First Session → Habit Loop → Upgrade → Advocacy
```

---

## Stage 1: Discovery

### Touchpoints
- Organic search ("AI form checker", "squat form app")
- Social media (fitness communities, Reddit r/fitness, YouTube)
- Word of mouth from existing users
- PT/gym referral (B2B channel)

### User Mindset
> "I want to make sure my form is correct but can't afford a personal trainer"

### Key Metrics
- Organic traffic, referral sources, bounce rate

### Opportunities
- SEO content targeting "how to check squat form"
- Short-form video demos showing real-time feedback
- "No download required — works in your browser" messaging

---

## Stage 2: Landing Page

### Touchpoints
- Hero section with live demo preview
- Value proposition: "AI-powered form coaching, right in your browser"
- Privacy callout: "Video never leaves your device"
- Exercise preview cards (squat, pushup, plank)

### User Emotions
- **Curious** → "This looks interesting"
- **Skeptical** → "Does this actually work?"
- **Concerned** → "Is my video being recorded?"

### Pain Points
- If page loads slowly, trust drops immediately
- Generic fitness app messaging won't differentiate
- Camera permission fear without explanation

### Key Metrics
- Time on page, CTA click rate, bounce rate

### Opportunities
- Animated skeleton overlay demo (no camera needed)
- "Try it free — no account required" for tutorial samples
- Trust badges: on-device processing, no cloud upload

---

## Stage 3: Signup

### Flow
```
Email/Password or OAuth → Minimal profile (email + ID) → Redirect to dashboard
```

### Design Decisions
- **Unified auth page** with Sign In / Sign Up tab toggle
- **Lazy profile creation** — don't ask for height/weight/goals until after first session
- **No email verification gate** — let users try the product immediately, verify later

### User Emotions
- **Impatient** → wants to try the product NOW
- **Protective** → minimal info sharing preferred

### Pain Points
- Forced profile completion before first session = drop-off
- Email verification gate before value = high abandonment
- OAuth failures on mobile browsers

### Key Metrics
- Signup completion rate, time to first session, OAuth vs email split

### Opportunities
- Guest mode with tutorial samples (no signup required)
- Progressive profiling after first completed session

---

## Stage 4: Onboarding

### Flow
```
Welcome screen → Exercise selection (3-card grid) → Camera permission card → Camera setup → Calibration
```

### Critical Moment: Camera Permission
1. Show pre-permission card explaining WHY camera is needed
2. Emphasize: "Your video is processed on your device and never uploaded"
3. Show visual of what the coaching overlay looks like
4. THEN trigger browser permission prompt

**Research:** Pre-permission explanations increase grant rates by 81%

### Camera Setup
- Auto-detect front/rear camera
- Show body positioning guide (silhouette overlay)
- Confirm full body is visible before starting
- Native camera aspect ratio in portrait mode

### Calibration
- 3-second countdown with body position check
- Confirm pose detection is working (skeleton visible)
- "You're all set!" confirmation before first rep

### User Emotions
- **Excited** → "Let's try this"
- **Anxious** → "Is my camera working? Can it see me?"
- **Confused** → "Where should I stand?"

### Pain Points
- Camera permission denied → dead end without recovery
- Poor lighting → pose detection fails silently
- Too close/far from camera → can't see full body
- Slow pose model initialization on first load

### Key Metrics
- Camera permission grant rate, calibration success rate, time to first rep

### Opportunities
- Lighting quality indicator during setup
- Distance guide ("Step back 2 feet")
- Pose model preload on landing page

---

## Stage 5: First Session (Critical — Make or Break)

### Flow
```
Exercise start → Real-time pose overlay → Form cues → Rep counting → Session complete → Results
```

### Real-Time Coaching
- Canvas 2D skeleton overlay on camera feed
- Form cues appear via fade-in (150-200ms) at fixed position
- Voice coaching via Web Speech API (browser TTS)
- Rep counter with form score per rep

### Cue System
- DEFAULT_COOLDOWN: 3000ms between cues
- Safety minimum: 2000ms (never nag)
- Priority: safety cues > form cues > encouragement
- Pattern: what's wrong → how to fix it
- Example: "Knees caving in — push knees out over toes"

### Form Scoring
- Weighted calculation per rep: kneeDepth, kneeTracking, backAngle, symmetry
- Overall session score: average across all reps
- Visual feedback: color-coded (green/yellow/red) per metric

### User Emotions
- **Amazed** → "It actually sees me and gives feedback!" (peak positive moment)
- **Frustrated** → "It keeps telling me the same thing" (if cue cooldown too short)
- **Confused** → "What does this score mean?"

### Pain Points
- Pose detection lag on low-end devices
- Browser TTS voice quality varies wildly across devices
- Score feels arbitrary without explanation
- Session can't be paused mid-exercise

### Key Metrics
- First session completion rate, average reps, form score distribution, immediate return rate

### Opportunities
- Post-rep micro-feedback (brief color flash on skeleton)
- "What this score means" expandable tooltip
- Pause/resume functionality
- Post-session summary with specific improvement tips

---

## Stage 6: Post-Session & Results

### Flow
```
Session complete → Summary screen → Score breakdown → Improvement tips → Save to history
```

### Summary Screen
- Total reps completed
- Overall form score (0-100)
- Per-metric breakdown with visual chart
- Top 2-3 specific improvement suggestions
- "Best rep" highlight

### Data Persistence
- Online: saved to Supabase immediately
- Offline: queued in IndexedDB via `idb`, synced when online
- Offline indicator: banner "Session saved offline — will sync when reconnected"

### User Emotions
- **Satisfied** → "I can see exactly what to improve"
- **Motivated** → "I want to beat my score next time"
- **Disappointed** → "I thought my form was good" (opportunity: frame positively)

### Key Metrics
- Sessions per user per week, score improvement over time, history page visits

---

## Stage 7: Habit Loop (Days 2-30)

### Triggers
- Push notification (PWA, Phase 1): "Ready for today's session?"
- Email digest: weekly progress summary
- In-app: streak counter, personal best badges

### Retention Mechanics
- Session history with trend visualization (skeleton screens for loading)
- Form score progression chart
- Exercise variety (3 exercises in Beta 1, expanding per phase)
- Consistent improvement visibility

### Free Tier Limitations
- 3 exercises (squat, pushup, plank)
- Basic form feedback
- 7-day history retention
- No workout plans

### Pain Points
- Limited exercise variety leads to boredom
- No social/community features (Phase 2)
- No workout planning (Phase 2)
- History page loads slowly without skeleton screens

### Key Metrics
- D1/D7/D30 retention, sessions per week, feature engagement

---

## Stage 8: Upgrade Decision

### Triggers
- Hit free tier limit (exercise variety, history retention)
- Desire for workout plans
- Want advanced analytics
- Social proof from other users

### Upgrade Flow (Stripe Hosted Checkout)
```
Upgrade CTA → Pricing page → Select plan → Redirect to Stripe Checkout → Payment → Redirect back → Upgraded
```

### Pricing
| Tier | Price | Key Features |
|---|---|---|
| Free | $0 | 3 exercises, basic feedback, 7-day history |
| Pro | $9.99/mo | All exercises, voice packs, 90-day history, workout plans |
| Premium | $14.99/mo | Everything + advanced analytics, priority support |

### Implementation
- Server-side Stripe only (no client SDK)
- Hosted Checkout (redirect to Stripe's page)
- Webhook-based fulfillment (checkout.session.completed)
- No @stripe/stripe-js needed

### User Emotions
- **Calculating** → "Is $9.99/mo worth it vs a PT at $60/session?"
- **Hesitant** → "Can I cancel anytime?"

### Pain Points
- Unclear what Pro unlocks vs Free
- No trial period for Pro features
- Payment failure with no retry

### Key Metrics
- Free-to-paid conversion rate, time to upgrade, churn rate, LTV

### Opportunities
- 7-day Pro trial triggered after 5th session
- Side-by-side feature comparison
- "You've improved 23% — Pro unlocks X" contextual upsell

---

## Stage 9: Advocacy & Expansion

### Triggers
- Visible form improvement over time
- Positive session experience
- Social sharing prompts

### Channels
- Share session results (screenshot/link)
- Refer a friend
- App store review (future native app)
- Social media fitness communities

### B2B Expansion
- PT discovers tool → clinic adoption
- PT Clinic Starter ($49/mo) or Pro ($99/mo)
- Corporate wellness programs ($2-5 PEPM)

---

## Error & Recovery Paths

### Camera Permission Denied
```
Denied → Show explanation card with instructions to enable in browser settings → Link to exercise tutorial videos as fallback
```

### Pose Detection Failure
```
No pose detected → "Can't see your full body" → Distance/lighting suggestions → Manual retry button
```

### Offline During Session
```
Connection lost → Banner: "Offline mode" → Session continues normally → Data queued in IndexedDB → Auto-sync on reconnect
```

### Payment Failure
```
Stripe error → Clear error message → Retry button → Alternative payment method suggestion → Support contact
```

### Session Crash
```
Component error → Error boundary catches → "Something went wrong with your session" → Recovery: restart session (reps preserved if possible)
```

---

## Accessibility Requirements (Beta 1 Minimum)

- Color contrast ≥4.5:1 for text, ≥3:1 for large text
- All interactive elements keyboard-accessible
- Touch targets ≥44×44px
- `prefers-reduced-motion` respected for all animations
- Screen reader labels on all coach controls
- Voice coaching provides non-visual feedback path

---

## Metrics Dashboard (Recommended)

| Stage | Primary Metric | Target |
|---|---|---|
| Landing | Bounce rate | <40% |
| Signup | Completion rate | >70% |
| Onboarding | Camera permission grant | >80% |
| First Session | Completion rate | >60% |
| Habit (D7) | Return rate | >40% |
| Habit (D30) | Return rate | >20% |
| Upgrade | Free→Paid conversion | >5% |
| Retention | Monthly churn | <8% |

# AI Form Coach — Product Roadmap
**Version:** 1.0 | **Status:** War Room Active | **Date:** March 2026
**Owner:** Product Manager | **Reviewed by:** Tech Lead + Business Lead

---

## 1. Roadmap Philosophy

This roadmap is built on one constraint: **solo developer, no funding, revenue must appear before complexity compounds.**

Every phase has a clear unlock condition — the prior phase must hit its success metric before the next phase begins. Features are never prioritized by how exciting they are. They are prioritized by: (1) does this retain users we already have, (2) does this acquire new users, or (3) does this generate revenue. In that order.

**Timeline anchor:** War room completion → controlled beta → public launch in Q2 2026.

---

## 2. Phase Overview

```
Phase 0  ──── MVP Hardening & Real-Device Validation
              Now → Beta Launch (Q2 2026)
              
Phase 1  ──── Controlled Beta → Public Launch
              Month 0–2 post-launch
              
Phase 2  ──── Retention Engine + Freemium Paywall
              Month 2–4 post-launch
              
Phase 3  ──── Revenue Growth + B2B Pipeline Open
              Month 4–9 post-launch
              
Phase 4  ──── B2B Revenue + Premium Consumer Scale
              Month 9–18 post-launch
              
Phase 5  ──── Platform / Bundling
              Month 18–24 post-launch
```

---

## 3. Phase 0 — MVP Hardening & Real-Device Validation
**Timeline:** Now → Beta Launch (target: Q2 2026)
**Goal:** Ship a product that works reliably on real devices and doesn't embarrass.

### Completion Criteria (All Required to Proceed)

| Gate | Criterion | Status |
|---|---|---|
| Build | `npm run build` passes zero errors | ✅ Done |
| Lint | `npm run lint` passes zero errors | ✅ Done |
| Unit tests | `npm run test` MVP suite green | ✅ Done |
| E2E — Chromium + Android | `npm run test:e2e:coach` green | ✅ Done |
| E2E — iPhone Safari | `npm run test:e2e:coach:iphone` green | ✅ Done |
| Real device — Android Chrome | DEVICE_VALIDATION_RUNBOOK.md pass | ⏳ Pending |
| Real device — iPhone Safari | DEVICE_VALIDATION_RUNBOOK.md pass | ⏳ Pending |
| Performance | Median detector ≤25ms, frame drop <10%, cue latency p95 ≤300ms | ⏳ Pending real-device data |
| Sessions | End-to-end save success >99% in manual testing | ⏳ Pending |
| Content | All cues wellness-consultant-reviewed and locked | ⏳ Pending |
| Audio | Human-recorded audio pack (15+ cues × 3 exercises) shipped | ⏳ Pending |
| Copy | No placeholder text, fake data, or demo fallbacks on any public route | ⏳ Pending audit |
| Non-MVP routes | All gated behind FeatureRegistry, hidden from sitemap/nav | ⏳ Pending |
| Privacy | Account deletion flow works end-to-end | ⏳ Pending |
| Monitoring | Sentry live, Better Uptime live, telemetry ingesting | ⏳ Pending |

### Immediate Priority Task Queue

**Week 1: Real-Device Validation**
- [ ] Run full DEVICE_VALIDATION_RUNBOOK.md on Android Chrome (physical Pixel or Samsung)
- [ ] Run full DEVICE_VALIDATION_RUNBOOK.md on iPhone Safari (physical device — iOS 16+)
- [ ] Triage any failures; fix or document as known limitations
- [ ] Validate camera stream persistence across route transitions on iOS Safari

**Week 1–2: Content & Audio**
- [ ] Finalize all cue text for squat, pushup, plank with wellness consultant
- [ ] Record human audio pack (15+ priority cues × 3 exercises; studio not required — clean room mic)
- [ ] Shoot or source real human demo movement videos for exercise select + framing guides
- [ ] Audit all public-facing copy for placeholder text

**Week 2: Final Hardening**
- [ ] Audit FeatureRegistry — confirm all non-MVP routes return 404 or redirect
- [ ] Implement and test account deletion (GDPR compliance)
- [ ] Set up Sentry + Better Uptime + telemetry pipeline
- [ ] Fix non-blocking Next.js warning in `src/app/og-image/route.tsx` (edge runtime)
- [ ] Supabase Pro plan activated before beta invite goes out

**Week 2–3: Controlled Beta Prep**
- [ ] Deploy to production Vercel environment
- [ ] Create landing page with beta waitlist / early access sign-up
- [ ] Recruit 20–50 beta users (friends, Reddit fitness communities, Twitter/X DMs)
- [ ] Set up beta feedback channel (Discord or simple Tally form)

---

## 4. Phase 1 — Controlled Beta → Public Launch
**Timeline:** Month 0–2 post-beta-launch
**Goal:** Validate product-market fit signal, fix critical UX issues before full public launch.

### What Launches in Beta
Everything in the MVP scope from `01_PRODUCT_REQUIREMENTS.md`. Free, no paywall, 3 exercises.

### Beta Success Metrics (Decision Gate for Public Launch)

| Metric | Gate | Measurement |
|---|---|---|
| Session completion rate | ≥60% | Sessions ended+saved / sessions started |
| D7 repeat session rate | ≥20% | Users with ≥2 sessions in first 7 days |
| Cue usefulness (positive) | ≥65% | Cue feedback button taps: positive / total |
| Save success rate | ≥99% | Saves succeeded / saves attempted |
| Frame drop rate | <10% | Telemetry: drop events / total frames (p50) |
| NPS (beta survey, n≥30) | ≥20 | Net Promoter Score |
| Critical bugs in 48h | 0 | No P0 bugs (session loss, camera crash, auth lockout) |

**If gate is not met:** Fix the failing metric, wait one additional week of beta data, re-evaluate. Do not public launch until gates pass.

### Phase 1 Feature Work

**While beta runs (parallel, ship before public launch):**

| Feature | Priority | Rationale |
|---|---|---|
| Landing page SEO metadata (title, description, OG image) | P1 | Organic traffic from day 1 of public launch |
| `sitemap.xml` (public routes only) | P1 | Google indexing |
| `robots.txt` (block non-MVP routes) | P1 | SEO hygiene |
| Pricing page — beta messaging → launch messaging | P1 | Needed before paywall decision |
| Password reset flow | P1 | Auth completeness — blocks real user recovery |
| Session history pagination (if >30 sessions edge case) | P2 | Beta users won't hit this; ship for launch |
| Basic analytics dashboard (internal Supabase query) | P1 | Need visibility into beta metrics |

**Public launch moment:**
- Remove beta gating (invite code or waitlist)
- Product Hunt launch (draft post during beta, submit day 1 of public launch)
- Show HN post
- Reddit posts: r/fitness, r/bodyweightfitness, r/homegym — genuine, not spammy
- First TikTok/Reel: real form correction in action (not an ad — a demo)

---

## 5. Phase 2 — Retention Engine + Freemium Paywall
**Timeline:** Month 2–4 post-launch
**Unlock condition:** Public launch complete + D7 repeat rate ≥25% from organic users

### Goal
Improve the reason to come back. Introduce the first paid tier.

### Feature Roadmap

| Feature | Priority | Estimated Effort | Rationale |
|---|---|---|---|
| **Streak system** | P1 | 3 days | Duolingo-proven. Highest-ROI retention mechanic. Even a 3-day streak meaningfully improves D30 retention. |
| **Shareable Form Score card** | P1 | 4 days | OG image generated at `/api/share/form-score/:sessionId`. Zero-cost viral acquisition. User shares their score on Instagram/TikTok. |
| **Exercise library expansion** | P1 | 5 days/exercise | Lunge, Deadlift, Bent-over Row. Each new exercise is 3–4 days: cue pack + angle map + rep state machine + framing guide + audio. |
| **Environment calibration onboarding** | P1 | 3 days | Guided setup flow for first session: camera height, lighting test, distance calibration. Fixes #1 predicted user complaint (tracking failures in suboptimal environments). |
| **Freemium paywall + Stripe billing** | P1 | 5 days | Stripe Checkout integration. Free tier: 3 sessions/week, squat only. Pro ($9.99/mo or $69.99/yr): unlimited sessions, all exercises, history. Premium ($14.99/mo): + advanced analytics, streak shields. |
| **Email sequences (transactional)** | P2 | 2 days | Streak at-risk reminder. Session milestone ("You've done 10 sessions!"). Inactivity nudge at D3, D7. Use Resend or Postmark. |
| **Wearable data overlay (read-only)** | P2 | 4 days | Read Apple Health / Google Fit HRV + recovery score. Display alongside form score in post-session card. Premium hook. No write-back needed. |

### Phase 2 Revenue Target
- 200 free users → 30+ paying users (15% trial conversion, within Tier-1 benchmark range)
- $9.99/mo × 30 = ~$300 MRR
- $69.99/yr × 10 = ~$700/yr (~$58/mo amortized)
- **Phase 2 exit target: $500–800 MRR**

---

## 6. Phase 3 — Revenue Growth + B2B Pipeline Open
**Timeline:** Month 4–9 post-launch
**Unlock condition:** Phase 2 complete + $500 MRR + D30 retention ≥25%

### Goal
Scale DTC revenue. Begin B2B conversations. Build infrastructure for healthcare-adjacent use.

### Feature Roadmap

| Feature | Priority | Estimated Effort | Rationale |
|---|---|---|---|
| **Social Accountability Pods (3–6 users)** | P2 | 8 days | Groups share weekly rep counts and form scores. No real-time interaction. Async accountability. Premium-only. Addresses gym anxiety / solo exercise barrier. |
| **Progressive programming (AI-generated plans)** | P2 | 5 days | Weekly plan generator (e.g., "3 squat sessions, increase depth target each session"). Uses Claude API or OpenAI API in server-side only — not in live coaching path. Premium-only. |
| **Fitness Age Score** | P2 | 5 days | Proprietary metric: form quality + consistency + progression over time = "your movement age." Premium hook. Highly shareable. Benchmark: Whoop's recovery score. |
| **Voice AI Coach (conversational)** | P2 | 6 days | Hands-free pre-session setup via voice. "Hey Coach, I want to do 3 sets of squats." Uses Web Speech API for input, Claude API for response, TTS for output. Premium-only. |
| **HIPAA compliance infrastructure** | P1 | 10 days | Required gate for any B2B healthcare conversation. Supabase HIPAA-eligible plan + BAA. Audit logging. Data encryption at rest (Supabase default) + in transit. No PHI in telemetry. |
| **PT Clinic MVP — basic reporting** | P2 | 8 days | Minimal org dashboard: invite patients, see their session history (aggregate, not video). Patient HEP compliance report. Target: $49/clinic/month. |
| **Affiliate program** | P1 | 2 days | 20–30% recurring commission via Rewardful or PartnerStack. Target: fitness micro-influencers, PT practitioners, personal trainers. Zero upfront cost. |
| **Wellhub partner listing** | P1 | 3 days | Wellhub (formerly Gympass) has 15,000 corporate clients, 3M members. Partnership is free to apply. Distributes Pro access as a workplace benefit. Target: list by Month 9. |

### B2B Pipeline Strategy (Month 6+ parallel track)

**Target: 3 PT clinic pilots by Month 9. Zero-cost sales approach.**

Inbound approach (no cold outreach):
1. Publish "AI Form Coaching in PT Practice" content on LinkedIn + Medium
2. APTA (American Physical Therapy Association) state chapter Facebook groups — genuine participation
3. PT clinic owners in beta user base — identify from profile/email domains, reach out personally
4. Soft pitch: "Would you pilot this with 3 patients for free?" — no money, just feedback

Pilot terms:
- 90-day free pilot, up to 10 patients
- In exchange: 30-min recorded feedback call, testimonial if positive
- Conversion target: $49/mo after pilot (per clinic)

**Do not pursue:**
- Cold email blasts to PT clinics
- Healthcare conferences (too expensive for solo stage)
- Enterprise healthcare systems (Hinge Health territory — do not compete directly)

### Phase 3 Revenue Target
- **DTC:** $2,500–5,000 MRR from Pro/Premium subscriptions
- **B2B pilots:** 3 clinics × $0 (pilot) — set up paid conversion for Phase 4
- **Phase 3 exit target: $3,000–5,000 MRR**

---

## 7. Phase 4 — B2B Revenue + Premium Consumer Scale
**Timeline:** Month 9–18 post-launch
**Unlock condition:** Phase 3 complete + $3,000 MRR + 3 PT clinic pilots completed with positive NPS

### Goal
Convert B2B pilots to revenue. Scale corporate wellness distribution. Reach $10,000 MRR.

### Feature Roadmap

| Feature | Priority | Estimated Effort | Rationale |
|---|---|---|---|
| **B2B Admin Dashboard (HR/clinic portal)** | P1 | 15 days | Full org admin: user management, usage reports, billing. Gate for any corporate wellness contract. HIPAA-compliant. |
| **White-label option** | P2 | 10 days | Custom branding + domain for PT networks or corporate wellness platforms. Target: $500–2,000/mo or $5,000–20,000/yr per account. |
| **HSA/FSA integration** | P2 | 5 days | Accept HSA/FSA cards via Stripe (supported natively). Removes price sensitivity for US users. Many PT-adjacent purchases are HSA-eligible. |
| **Wellhub billing integration** | P1 | 8 days | Once listed, handle Wellhub's check-in API and billing passthrough. Corporate clients pay Wellhub; Wellhub pays us per active user ($2–5 PEPM). |
| **Injury Prevention Alerts** | P1 | 8 days | ML flag: "Your left knee valgus has worsened over 3 sessions. Consider a check-in with a PT." Data moat feature. Requires 90+ days of user data to train. Premium + B2B. |
| **Industry Leaderboards** | P2 | 5 days | Opt-in global/regional leaderboards by exercise. Drives status signaling and organic social sharing. Premium-only. |
| **Healthspan Dashboard** | P2 | 7 days | Aggregate view: movement quality trends, form progression, streaks, fitness age over time. Premium retention anchor. |
| **Recovery Protocol Engine** | P2 | 8 days | Post-session guided stretches/mobility work. Uses pose detection in a slower, static-hold mode. Premium. |

### Phase 4 Revenue Target
- **DTC:** $5,000–8,000 MRR
- **B2B (clinics):** 10 clinics × $49/mo = $490 MRR
- **Corporate wellness (Wellhub + direct):** 5 accounts × $200/mo avg = $1,000 MRR
- **Phase 4 exit target: $8,000–12,000 MRR (~$100–144K ARR)**

---

## 8. Phase 5 — Platform / Bundling
**Timeline:** Month 18–24 post-launch
**Unlock condition:** $10,000 MRR + B2B pipeline generating >$2,000 MRR

### Goal
Compound the moat. Explore unified product strategy with Heatwave Sauna. Evaluate native mobile.

### Feature Roadmap

| Feature | Priority | Rationale |
|---|---|---|
| **AI-generated progressive workout plans** | P1 | Full training program generation, not just weekly suggestions. Requires significant session history as context. |
| **Multi-angle fusion (front + side camera)** | P2 | Use two devices simultaneously for depth-rich angle calculation. Solves knee valgus ambiguity. Technically complex — only justified if accuracy complaints are a top retention driver. |
| **Heatwave Sauna unified premium bundle** | P2 | Single $19.99/mo subscription: AI Form Coach Pro + Heatwave Premium. Cross-product subscriber base. Requires Heatwave to have launched and have its own paying users. |
| **Native mobile apps (React Native)** | P2 | App Store + Play Store distribution. Solves iOS Safari camera permission UX issue permanently. Estimated 3–4 months solo dev effort. Justifiable only if PWA conversion rate is meaningfully lower than projected. |
| **Clinical validation study** | P1 | Partner with a university kinesiology department for a peer-reviewed accuracy study. Cost: ~$5–15K. Outcome: "Clinically validated" claim unlocks healthcare B2B at 10x higher ACV. |
| **API/SDK for third-party integration** | P2 | Expose the form correction engine as an API for gym management software, fitness apps. Positions AI Form Coach as infrastructure. White-label at scale. |

### Phase 5 Revenue Target
- **DTC:** $10,000–15,000 MRR
- **B2B:** $3,000–5,000 MRR
- **Bundle / cross-product:** $1,000–2,000 MRR
- **Phase 5 exit target: $15,000–25,000 MRR (~$180–300K ARR)**

---

## 9. Monetization Timeline

```
Month 0–2    Free beta — zero revenue (validate product)
Month 2–4    Freemium paywall live — target $500–800 MRR
Month 4–9    Pro/Premium scaling — target $3,000–5,000 MRR
Month 9–18   B2B + Wellhub — target $8,000–12,000 MRR
Month 18–24  Platform maturity — target $15,000–25,000 MRR
```

**Time to first dollar:** Month 2 post-launch (≤5 months from today if beta launches Q2 2026)
**Time to $1,000 MRR:** Month 3–4 post-launch
**Time to $10,000 MRR:** Month 9–12 post-launch (conservative) / Month 7–9 (optimistic)

---

## 10. Distribution Milestones

| Milestone | Target Month | Metric |
|---|---|---|
| Beta waitlist opens | Phase 0 | 200+ signups before launch |
| Product Hunt launch | Month 0 (public launch) | Top 5 Product of the Day |
| Show HN post | Month 0 | 50+ upvotes, genuine engagement |
| Reddit seeding (r/fitness etc.) | Month 0–1 | 500+ free signups from Reddit |
| First TikTok form correction video | Month 0–1 | Target 10K+ organic views |
| SEO blog content (10 articles) | Month 1–3 | "squat form mistakes", "pushup technique" etc. |
| Micro-influencer seeding (5 fitness creators) | Month 2–3 | Free Pro in exchange for authentic content |
| Affiliate program live | Month 3–4 | 10+ active affiliates |
| Wellhub partner listing application | Month 6 | Listed by Month 9 |
| APTA conference presence (virtual/digital) | Month 8–9 | 3 PT clinic pilot leads |

---

## 11. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Real-device validation reveals performance blocker | Medium | High | Start Android real-device test immediately. Lite model fallback. |
| MediaPipe accuracy too low in home environments | Medium | High | Environment calibration onboarding (Phase 2) + known limitations in marketing copy |
| User churn is higher than 50% annual benchmark | Medium | High | Streak system + social pods + progressive plans (all Phase 2/3) attack churn directly |
| B2B sales cycle longer than projected (>9 months) | Medium | Medium | B2B is additive; DTC revenue de-risks this. Never depend on B2B for survival. |
| Competitor re-enters consumer space | Low | High | Competitive moat is distribution (SEO + social) + data + switching cost. Build these fast. |
| Stripe freemium paywall converts poorly (<5%) | Low | Medium | A/B test pricing at launch; annual plan anchor improves conversion dramatically |
| App Store required for iOS distribution | Low | High | PWA handles camera access on iOS. Native app is Phase 5 only if justified by data. |
| Heatwave Sauna launch delayed | Low | Low | Independent products; bundle is Phase 5 bonus only |
| Solo developer burnout | Medium | Critical | Strict MVP scope freeze. No feature creep before $5,000 MRR. Revenue enables hiring. |

---

## 12. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| Mar 2026 | MVP scoped to 3 exercises (squat, pushup, plank) | Fastest path to real user data. Additional exercises are Phase 2. |
| Mar 2026 | DTC-first GTM (not B2B first) | B2B cycles too long; HIPAA compliance burden too high pre-revenue |
| Mar 2026 | Web3 "Proof-of-Workout" elements removed | Move-to-earn token collapse; regulatory risk; no user demand signal |
| Mar 2026 | MediaPipe Lite over Full for launch | Latency budget easier to meet; switch to Full only if benchmark data demands it |
| Mar 2026 | PWA over native mobile app | No App Store tax; no 30% cut; camera access works on iOS 16+; Phase 5 only if justified |
| Mar 2026 | Freemium paywall at Month 2 (not Day 1) | Need PMF signal before charging; beta must be free to attract honest feedback |

---

_Maintained by Product Manager. Phase unlock decisions require a written review against the stated success metrics. Roadmap is a living document — reviewed monthly during active development, quarterly thereafter._

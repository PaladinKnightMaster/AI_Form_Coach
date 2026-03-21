# AI Form Coach — Revenue Model
**Version:** 1.0 | **Status:** War Room Active | **Date:** March 2026
**Owner:** Business Lead | **Reviewed by:** Product Manager + Tech Lead

---

## 1. Revenue Model Philosophy

AI Form Coach monetizes via **freemium SaaS with a B2B upsell layer** — the same structural model that produced GymStreak's $2.5M/year as a solo developer, Strava's $300M ARR, and every defensible fitness app that survived past year two.

The freemium layer acquires users at zero CAC through organic channels. The subscription converts the motivated minority who want more. The B2B layer extracts disproportionate value from organizations that have already proven demand.

**One rule above all others:** Do not gate the core value loop behind a paywall at launch. Users must experience real coaching before they see a pricing decision. Conversion follows experienced value — it does not precede it.

---

## 2. Pricing Architecture

### 2.1 Consumer Tiers

| Tier | Price | Target User | Core Limits |
|---|---|---|---|
| **Free** | $0 forever | Evaluators, casual users | 3 sessions/week, squat only, 30-session history |
| **Pro** | $9.99/mo or $69.99/yr | Regular home exercisers | Unlimited sessions, all exercises, full history, streaks, shareable cards |
| **Premium** | $14.99/mo or $99.99/yr | Serious athletes, biohackers | Everything in Pro + advanced analytics, Fitness Age Score, wearable overlay, progressive programming, Voice AI Coach, streak shields |

**Pricing rationale:**
- $9.99/mo is the established fitness app sweet spot — below the psychological $10 barrier, above commodity pricing
- Annual plan ($69.99 = 5.83/mo, saving 42%) drives 68% of health & fitness app revenue per industry benchmarks; reduces annual churn by ~51% vs monthly
- Premium tier at $14.99/mo is positioned as an accessible alternative to a single PT session ($75–150); justification requires wearable data + progressive plans to land
- Free tier is genuinely useful (squat is the king of exercises) — not a crippled demo

### 2.2 B2B Tiers

| Tier | Price | Target Buyer | Scope |
|---|---|---|---|
| **PT Clinic Starter** | $49/mo per clinic | Small PT practice (1–3 therapists) | Up to 25 active patients, compliance reports, HEP tracking |
| **PT Clinic Pro** | $99/mo per clinic | Mid-size PT practice (4–10 therapists) | Up to 100 patients, white-label option, priority support |
| **Corporate Wellness** | $2–5 PEPM | HR/Benefits Manager, 50–500 employees | Per Employee Per Month via Wellhub or direct; usage reports, admin portal |
| **Enterprise / White-label** | $500–2,000/mo | Fitness platforms, gym chains, PT networks | Custom branding, custom domain, API access, SLA |

**B2B pricing rationale:**
- PT clinic software benchmarks: $200–400/provider/month for full EMR; HEP add-ons $39–99/clinic. AI Form Coach at $49–99 is positioned as an accessible add-on, not a replacement system.
- $2–5 PEPM is below Wellhub's listed partner range and below Hinge Health's $15–20 PEPM — aggressive entry pricing to win early pilots
- Enterprise white-label at $500–2,000/mo represents 10–40x DTC ARPU; even one account = $6–24K ARR

---

## 3. Free Tier Design

The free tier is designed with one goal: **maximize the number of users who experience a complete, satisfying coaching session before seeing any paywall.**

### 3.1 What's Free (Forever)

- Squat coaching: unlimited within weekly session limit
- 3 sessions per week (Sunday reset)
- Up to 30 sessions in history (oldest sessions archived, not deleted)
- Rep counting + form score
- Voice cues
- Post-session summary
- Account creation and data portability

### 3.2 What Requires Pro

- Pushup and Plank coaching
- Unlimited sessions per week
- Full session history (unlimited)
- Streak tracking
- Shareable Form Score cards
- Email support

### 3.3 What Requires Premium

- Advanced analytics (form trend charts, angle progression)
- Fitness Age Score
- Wearable data overlay (Apple Health, Google Fit)
- Progressive programming (AI-generated weekly plans)
- Voice AI Coach
- Streak shields (bank up to 2 "rest day" streak credits)
- Social Accountability Pods

### 3.4 Free Tier Conversion Triggers

The paywall appears at three high-intent moments — never during a session:

| Trigger | Paywall Prompt |
|---|---|
| User tries to start pushup or plank | "Pushup coaching is available on Pro. Your squat sessions are always free." |
| User hits 3-session limit for the week | "You've had a great week — 3 sessions! Pro removes the weekly limit." |
| User views history beyond 30 sessions | "You're building a real habit. Pro keeps your full history forever." |
| User tries to share a form score card | "Share your progress with Pro — your form score card, branded and shareable." |

**Anti-pattern to avoid:** No countdown timers, no urgency copy ("Only 2 free sessions left this month!"), no dark patterns. The prompt is informational, not pressurized. Users who feel manipulated churn immediately and leave App Store reviews.

---

## 4. Unit Economics

### 4.1 Customer Acquisition Cost (CAC)

Target CAC for organic DTC: **$0** (content, SEO, Reddit, Product Hunt — zero paid spend at launch)

Blended CAC assumption with affiliate program active (Month 3+):
- Affiliate commission: 25% recurring
- Pro monthly: $9.99 × 25% = $2.50/mo commission
- Break-even at month 1 (affiliate earns commission forever, but so does the subscriber)
- Effective CAC for affiliate-sourced Pro subscriber: ~$2.50 (first month revenue = $9.99, first month commission = $2.50, net = $7.49)

Paid acquisition: **Not planned at MVP.** Fitness app CPIs on Meta/Google average $3–8 for health & fitness. This is viable post-$5K MRR when LTV is proven, not before.

### 4.2 Lifetime Value (LTV)

Industry benchmarks for health & fitness apps:
- Average subscription duration: 8–14 months
- Median annual churn: 40–55% (monthly billing), 20–30% (annual billing)
- D60 revenue per install: $0.63 (highest of any app category)

AI Form Coach LTV estimates:

| Tier | Monthly Price | Avg Duration | LTV |
|---|---|---|---|
| Pro Monthly | $9.99 | 10 months | ~$100 |
| Pro Annual | $69.99 | 18 months | ~$105 |
| Premium Monthly | $14.99 | 10 months | ~$150 |
| Premium Annual | $99.99 | 18 months | ~$150 |
| PT Clinic | $49–99/mo | 24 months | ~$1,200–2,400 |
| Corporate Wellness | $200–500/mo | 36 months | ~$7,200–18,000 |

**LTV:CAC ratio target:** ≥3:1 before any paid acquisition spend. At $0 organic CAC, this ratio is essentially infinite — the focus is on maximizing LTV through retention, not reducing CAC.

### 4.3 PWA Structural Advantage

Avoiding App Store distribution saves **$3.77/subscriber/month** at the Pro Monthly price point:
- App Store takes 30% of in-app subscriptions = $2.99/mo on $9.99
- After year 1, reduces to 15% = $1.50/mo (but churn means most subscribers don't reach year 2)
- Blended effective rate: ~$2.50/mo saved per subscriber vs App Store distribution
- At 200 subscribers: $500/mo saved. At 1,000 subscribers: $2,500/mo saved.

PWA limitation: no App Store organic discovery. Offset by SEO, social, Wellhub listing, and affiliate. The saved margin more than compensates for the lost discovery channel at this scale.

---

## 5. Revenue Projections

### 5.1 Conservative Scenario

Assumptions: Organic-only growth, 10% free-to-paid conversion, 50% annual churn on monthly subscribers, 20% on annual.

| Month | Free Users | Paying Users | MRR | ARR Run Rate |
|---|---|---|---|---|
| 0 (beta) | 50 | 0 | $0 | — |
| 1 (public launch) | 300 | 0 | $0 | — |
| 2 (paywall live) | 800 | 40 | $350 | $4,200 |
| 3 | 1,200 | 80 | $720 | $8,640 |
| 4 | 1,800 | 120 | $1,100 | $13,200 |
| 6 | 3,000 | 220 | $2,000 | $24,000 |
| 9 | 5,000 | 380 | $3,500 | $42,000 |
| 12 | 8,000 | 600 | $5,600 | $67,200 |
| 18 | 15,000 | 1,200 | $11,500 | $138,000 |
| 24 | 25,000 | 2,000 | $19,000 | $228,000 |

### 5.2 Realistic Scenario

Assumptions: 1 viral content hit (TikTok/Reddit) at Month 2–3, 15% free-to-paid conversion, one Wellhub listing by Month 9 adding corporate wellness revenue.

| Month | Free Users | Paying Users | B2B MRR | Total MRR |
|---|---|---|---|---|
| 2 (paywall live) | 1,500 | 80 | $0 | $720 |
| 3 | 3,500 | 200 | $0 | $1,800 |
| 6 | 8,000 | 500 | $0 | $4,500 |
| 9 | 15,000 | 900 | $500 | $8,600 |
| 12 | 25,000 | 1,500 | $1,500 | $15,000 |
| 18 | 50,000 | 3,000 | $4,000 | $31,000 |
| 24 | 80,000 | 5,000 | $8,000 | $53,000 |

### 5.3 GymStreak Benchmark Calibration

GymStreak (solo dev, no funding, workout tracker):
- 2021: ~$300K revenue
- 2022: ~$2.5M revenue (8x growth)
- Growth driver: TikTok/Instagram content engine

AI Form Coach advantage over GymStreak benchmark: **zero competitive incumbents** in the exact niche, PWA distribution (no App Store cut), and a functionally novel product (camera-based coaching vs. logging). The GymStreak trajectory is achievable if content distribution is executed consistently.

---

## 6. Stripe Integration Plan

### 6.1 Implementation Approach

**Stripe Checkout (hosted, not Elements)** for all payment flows. Server-side only — no `@stripe/stripe-js` client SDK needed. The user is redirected to Stripe's hosted page for payment. PCI compliance handled entirely by Stripe. No custom card UI.

**Implementation:** `stripe` package v16.6.x (server-side only). No client-side Stripe SDK loaded.

```
User clicks "Upgrade to Pro"
  → POST /api/v1/subscriptions/checkout (creates Stripe Checkout session, server-side)
  → Redirect to Stripe-hosted checkout page (user leaves our app briefly)
  → User completes payment on Stripe's page
  → Stripe fires checkout.session.completed webhook
  → POST /api/v1/webhooks/stripe (updates user.subscription_tier in DB)
  → User redirected back to /coach with Pro features unlocked
```

**Why no client-side Stripe SDK:** `@stripe/stripe-js` is only needed for Stripe Elements (embedded card forms). Hosted Checkout doesn't require it. This keeps the client bundle smaller and avoids PCI scope complexity.

### 6.2 Products and Price IDs to Configure in Stripe

```
Products:
  AI Form Coach Pro
    - price_pro_monthly:   $9.99/mo (USD)
    - price_pro_annual:    $69.99/yr (USD)
  
  AI Form Coach Premium
    - price_premium_monthly:  $14.99/mo (USD)
    - price_premium_annual:   $99.99/yr (USD)

  PT Clinic Starter (B2B — Phase 3)
    - price_clinic_starter:   $49/mo (USD)
  
  PT Clinic Pro (B2B — Phase 3)
    - price_clinic_pro:       $99/mo (USD)
```

### 6.3 Webhook Events to Handle

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `subscription_tier` + `subscription_id` + `subscription_status = active` in profiles |
| `customer.subscription.updated` | Update tier if plan changed (upgrade/downgrade) |
| `customer.subscription.deleted` | Set `subscription_status = cancelled`, `subscription_tier = free` after grace period |
| `invoice.payment_failed` | Set `subscription_status = past_due`; email user; 3-day grace period before downgrade |
| `invoice.payment_succeeded` | Set `subscription_status = active`; extend subscription period |

### 6.4 DB Schema Additions (Phase 2)

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT 
  NOT NULL DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'pro', 'premium'));
ALTER TABLE profiles ADD COLUMN subscription_status TEXT 
  DEFAULT NULL 
  CHECK (subscription_status IN ('active', 'past_due', 'cancelled', NULL));
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT UNIQUE DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN subscription_current_period_end TIMESTAMPTZ DEFAULT NULL;
```

---

## 7. Wellhub (Corporate Wellness) Revenue Model

### 7.1 What Wellhub Is

Wellhub (formerly Gympass) is a corporate wellness aggregator with 15,000+ corporate clients and 3M+ members. Companies pay Wellhub a per-employee fee; Wellhub distributes that to partner apps and gyms based on member usage. Partner listing is free; Wellhub handles billing.

### 7.2 Revenue Mechanics

- Wellhub pays partners $2–5 PEPM (Per Employee Per Month) for active users
- "Active" = user checks in / uses the app at least once per month via Wellhub
- No upfront cost or minimum commitment to list
- Revenue is variable: more corporate clients using AI Form Coach = more PEPM

**Conservative Wellhub projection (Month 12–18):**
- 1,000 active corporate users via Wellhub × $2.50 PEPM = $2,500/mo
- 5,000 active corporate users via Wellhub × $2.50 PEPM = $12,500/mo

### 7.3 Wellhub Listing Requirements

- Functional web app or mobile app (PWA qualifies)
- HTTPS, privacy policy, terms of service
- Usage data reporting API (Wellhub spec — 2–3 days of integration work)
- Customer support email
- No criminal/illegal content policy

HIPAA compliance is not required for Wellhub listing (wellness, not clinical). Required only for direct PT/healthcare B2B contracts.

---

## 8. Affiliate Program Design

### 8.1 Structure

- Platform: Rewardful ($49/mo) or PartnerStack (revenue share model)
- Commission: 25% recurring for the lifetime of the referred subscription
- Cookie window: 60 days
- Minimum payout: $50
- Payment method: PayPal or bank transfer (monthly)

### 8.2 Target Affiliate Profiles

| Profile | Channel | Approach |
|---|---|---|
| Fitness micro-influencers (10K–100K followers) | TikTok, Instagram, YouTube | Free Pro account + affiliate link; no upfront payment |
| Personal trainers (individual) | Instagram, YouTube | Genuine fit — they care about client form |
| PT practitioners | LinkedIn, PT Facebook groups | Professional positioning; HIPAA compliance story |
| Fitness bloggers / SEO sites | Google organic | Comparison articles, "best form coaching app" |
| Reddit power users (r/fitness, r/bodyweightfitness) | Reddit | Authentic participation; affiliate link in bio only |

### 8.3 Affiliate Economics

At 200 referred Pro Monthly subscribers via affiliates:
- Revenue: 200 × $9.99 = $1,998/mo
- Commission: 200 × $2.50 = $500/mo
- Net: $1,498/mo from affiliate channel
- Marginal cost (Rewardful SaaS): $49/mo
- Net-net: $1,449/mo from $49/mo infrastructure investment

---

## 9. Revenue Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Free-to-paid conversion <5% | Medium | High | A/B test free tier limits (2 sessions/week vs 3); test annual plan as default offer |
| Annual plan adoption <30% | Medium | Medium | Lead with annual plan in pricing page; monthly as secondary option |
| Churn >60% annually on monthly | Medium | High | Streak system + pods + progressive plans attack churn; annual plan converts churners |
| Wellhub delays listing (>6 months) | Medium | Low | DTC revenue doesn't depend on Wellhub; it's upside, not base case |
| B2B sales cycle >12 months | Medium | Low | B2B is additive; DTC is the business at this stage |
| Stripe fee erosion | Low | Low | Stripe takes 2.9% + $0.30/transaction; manageable at this scale |
| App Store pressure to go native | Low | Medium | PWA is the correct call until $10K MRR; native is Phase 5 only |

---

## 10. Financial Milestones & Decision Points

| MRR Milestone | What It Unlocks |
|---|---|
| $500 MRR | Covers Supabase Pro ($25) + Vercel Pro ($20) + Sentry ($26) + Rewardful ($49) = ~$120/mo infra. First profitable month. |
| $1,000 MRR | Enables paid content creation (video editing, audio recording). First real marketing budget. |
| $3,000 MRR | Enables part-time contractor (content writer, designer). Begin HIPAA compliance work. |
| $5,000 MRR | Enables paid acquisition testing (small Meta/TikTok budget). Hire first part-time engineer for B2B dashboard. |
| $10,000 MRR | Full-time equivalent salary equivalent ($120K/yr). Hire first full-time employee (growth or engineering). |
| $25,000 MRR | Series Seed territory if desired. Can grow organically or take small strategic round. |

---

_Maintained by Business Lead. Pricing changes require product manager sign-off. Any B2B contract above $1,000 ACV requires business lead review._

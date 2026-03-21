# AI Form Coach — Tech Stack
**Version:** 1.0 | **Status:** War Room Active | **Date:** March 2026
**Owner:** Tech Lead | **Reviewed by:** Principal Frontend + Backend Engineers

---

## 1. Stack Philosophy

The stack is chosen for **one developer at maximum speed with near-zero operational overhead**. Every choice optimizes for: (1) ship velocity, (2) zero infra management, (3) PWA-first camera access, (4) on-device ML feasibility, and (5) clear upgrade paths when revenue justifies complexity.

The golden rule: **never add a technology whose operational cost exceeds its delivered value at current scale.**

---

## 2. Full Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                       │
│  Next.js 16 (App Router) · React 19 · TypeScript 5            │
│  Tailwind CSS 4 · CSS transitions · Radix UI primitives        │
├─────────────────────────────────────────────────────────────────┤
│  AI / ML (Client-Side Only)                                     │
│  MediaPipe Pose Landmarker (@mediapipe/tasks-vision)           │
│  EMA smoothing (alpha=0.65) · Canvas 2D (native browser)       │
│  Web Speech API + human-recorded audio (WAV/MP3)               │
├─────────────────────────────────────────────────────────────────┤
│  STATE MANAGEMENT                                               │
│  Zustand 5.x (high-frequency pose state, ~30fps updates)      │
├─────────────────────────────────────────────────────────────────┤
│  PWA / OFFLINE                                                  │
│  idb (IndexedDB wrapper) · Serwist (Phase 1, replaces next-pwa)│
├─────────────────────────────────────────────────────────────────┤
│  BACKEND / API                                                  │
│  Next.js App Router Route Handlers (Node.js runtime)           │
│  Zod (schema validation) · @supabase/ssr                       │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE / AUTH / STORAGE                                      │
│  Supabase (Postgres + Row-Level Security + Auth + Storage)     │
├─────────────────────────────────────────────────────────────────┤
│  PAYMENTS (Post-MVP)                                            │
│  Stripe (Checkout + Webhooks + Customer Portal)                │
├─────────────────────────────────────────────────────────────────┤
│  DEPLOYMENT / INFRA                                             │
│  Vercel · GitHub Actions · Sentry · Better Uptime              │
├─────────────────────────────────────────────────────────────────┤
│  TESTING                                                        │
│  Vitest (unit + integration) · Playwright (E2E + device matrix)│
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer-by-Layer Decisions

### 3.1 Framework: Next.js 16 (App Router)

| Attribute | Detail |
|---|---|
| Version | 16.0.7 (current) |
| Router | App Router (React Server Components) |
| Rendering | Static + SSR hybrid — landing/pricing static, coach/history SSR |
| Runtime | Node.js (API routes) + Edge (OG image only) |

**Why Next.js App Router:**
- Server Components reduce client JS bundle on non-coaching pages
- Built-in image optimization for demo/tutorial video thumbnails
- `@supabase/ssr` is optimized for Next.js App Router cookie handling
- Vercel deployment is frictionless and free at MVP scale
- SEO-critical pages (landing, pricing) render server-side — essential for organic SEO strategy

**Why not Remix / SvelteKit / plain Vite:**
- Next.js is the existing codebase. Switching frameworks has zero upside and high migration cost.
- Remix has no meaningful advantage for this use case at this scale
- SvelteKit has smaller ecosystem for Supabase/MediaPipe integration patterns

**Known constraint:** Next.js App Router adds complexity to client-side state that spans layout boundaries (e.g., camera stream). The coaching session is a single deep-nested Client Component — this is intentional and correct. Do not attempt to use Server Components inside the camera loop.

---

### 3.2 Language: TypeScript 5 (Strict Mode)

```json
// tsconfig.json — required settings
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Why strict + extras:** The pose pipeline has dozens of array indexing operations (landmark[11], landmark[25], etc.). `noUncheckedIndexedAccess` forces explicit null handling at every landmark access — which directly prevents runtime crashes when MediaPipe returns fewer landmarks than expected (occlusion, out-of-frame). This is a safety decision, not just style.

**Type generation:** Supabase CLI generates types from the DB schema automatically:
```bash
npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
```
Run this after every DB migration. Commit the generated types.

---

### 3.3 Styling: Tailwind CSS 4 + Radix UI

| Layer | Technology | Purpose |
|---|---|---|
| Utility CSS | Tailwind CSS 4 | All layout, spacing, color, responsive |
| Component primitives | Radix UI (headless) | Accessible dialogs, dropdowns, tooltips |
| Animation | CSS transitions | All UI animations; no Framer Motion (saves ~32KB gzip) |
| Design tokens | CSS custom properties in `globals.css` | Brand colors, spacing — single source of truth |

**Design tokens (CSS custom properties — `src/app/globals.css`):**
```css
/* globals.css — source of truth for all design tokens */
:root {
  --brand-primary:   #2563EB;  /* coaching blue */
  --brand-accent:    #10B981;  /* form score green */
  --brand-warning:   #F59E0B;  /* correction amber */
  --brand-danger:    #EF4444;  /* safety red */
  --brand-surface:   #0F172A;  /* dark coaching background */
  --brand-overlay:   #1E293B;  /* card/panel on dark */
}
```

**Typography: System font stack (not Inter/JetBrains Mono)**
```css
/* System fonts — 0KB load, instant render, native feel on every platform */
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
/* Mono: for rep counter and form scores */
font-family: ui-monospace, 'SF Mono', Monaco, 'Cascadia Mono', monospace;
```
**Rationale:** System fonts load instantly (0KB vs ~100KB for Inter). For a coaching app where users are exercising, typography polish matters far less than load speed. Optional brand upgrade via `next/font` in Phase 2+ if differentiation is needed.
```

**Why Radix UI (not shadcn/ui):** Radix is the underlying primitive layer. Shadcn/ui wraps Radix with opinionated styling — acceptable, but the coaching surface requires fully custom component behavior (camera overlay, rep counter) that benefits from primitive-level control. Use shadcn/ui patterns as reference only.

---

### 3.4 ML / Computer Vision: MediaPipe Tasks Vision

```json
// package.json
"@mediapipe/tasks-vision": "^0.10.x"
```

| Attribute | Detail |
|---|---|
| Model | Pose Landmarker Lite (MVP), Full (post-benchmark) |
| Inference mode | `VIDEO` (synchronous; LIVE_STREAM migration planned Phase 1) |
| Acceleration | WebGL delegate (auto-fallback to CPU) |
| Model hosting | `/public/models/` (versioned filenames, cached by Service Worker) |
| WASM bundles | Loaded from jsDelivr CDN (SRI hash verified) |

**Model versioning strategy:**
```
/public/models/
  pose_landmarker_lite_v1.0.0.task   ← current
  pose_landmarker_full_v1.0.0.task   ← available if benchmarks require
```
Service Worker `CacheFirst` strategy with version-keyed filenames. Model updates require a new filename — never overwrite in place.

**CDN fallback for WASM:**
```typescript
// Primary: jsDelivr (fast, SRI-verified)
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.x/wasm';
// Fallback: unpkg (if jsDelivr outage)
const WASM_CDN_FALLBACK = 'https://unpkg.com/@mediapipe/tasks-vision@0.10.x/wasm';
```

---

### 3.5 Overlay Rendering: Canvas 2D (Native Browser API)

**No additional library needed.** `CanvasRenderingContext2D` with `requestAnimationFrame` handles the overlay at ≤1ms draw time for a 10-joint fitness skeleton. WebGL is explicitly rejected for overlay rendering — it would add shader compilation complexity and fragility for zero measurable improvement.

The coaching surface renders two elements:
1. `<video>` element (camera feed, z-index 0)
2. `<canvas>` element (skeleton overlay, z-index 1, `position: absolute`, same dimensions as video)

Canvas is sized dynamically to match video stream dimensions on mount and on viewport resize.

---

### 3.6 Voice: Web Speech API + Audio API

**Tier 1: Pre-recorded human audio (primary)**
```typescript
// src/lib/coach/voiceSynthesizer.ts
const audioCache = new Map<string, AudioBuffer>();

async function playAudioCue(cueId: string): Promise<void> {
  const audioCtx = getAudioContext();  // singleton AudioContext
  let buffer = audioCache.get(cueId);

  if (!buffer) {
    const response = await fetch(`/audio/cues/${cueId}.mp3`);
    const arrayBuffer = await response.arrayBuffer();
    buffer = await audioCtx.decodeAudioData(arrayBuffer);
    audioCache.set(cueId, buffer);
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
}
```

Audio files cached by Service Worker at install time. Total audio pack target: <10MB.

**Tier 2: Web Speech API (fallback for cues without recorded audio)**
```typescript
function speakCue(text: string): void {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  // Prefer a calm, neutral voice if available
  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang === 'en-US' && v.localService);
  if (preferred) utterance.voice = preferred;
  speechSynthesis.speak(utterance);
}
```

**iOS Safari AudioContext gotcha:** AudioContext must be created or resumed inside a user gesture handler (button tap). Initialize it at the "Start Session" button click — not on page mount.

---

### 3.7 Offline / PWA: `idb` + Serwist (Phase 1)

**Current state (Beta 1):** No service worker. Offline data persistence uses `idb` (IndexedDB). Service worker planned for Phase 1 using Serwist.

**`idb`** (IndexedDB Promise wrapper):
```json
"idb": "^8.x"
```
`idb` provides a thin Promise-based API over the callback-based IndexedDB API. Used in `src/lib/storage/offlineQueue.ts` for: offline session queue, sync status tracking.

**Why `idb` over Dexie.js:** Lighter weight, sufficient for the offline queue pattern. Dexie.js adds schema migrations and more features than needed at MVP.

**Serwist** (Phase 1 — replaces next-pwa):
```
Status: Not yet installed. Planned Phase 1 implementation.
Reason: next-pwa is abandoned (last update 2023). Serwist is the active
        replacement built for Next.js 14+ App Router.

Planned cache strategy:
  - Static assets: CacheFirst (long TTL)
  - API routes: NetworkFirst with IndexedDB fallback
  - MediaPipe WASM bundles: CacheFirst (version-keyed)
  - Audio pack files: CacheFirst
  - Camera stream: Never cached (live only)
```
Service worker enables: install prompt, offline page shell, "Add to Home Screen", asset caching.

---

### 3.8 Database / Auth: Supabase

```json
"@supabase/supabase-js": "^2.x",
"@supabase/ssr": "^0.x"
```

| Feature | Supabase Offering | Notes |
|---|---|---|
| Database | Postgres 15 | Managed, daily backups on Pro |
| Auth | GoTrue (JWT + cookie) | Email/password at MVP; magic link post-MVP |
| Row-Level Security | Built into Postgres | All tables require RLS — see `02_SYSTEM_DESIGN.md` |
| Storage | S3-compatible object store | Tutorial videos + audio pack hosting |
| Realtime | WebSocket subscriptions | Post-MVP (social pods, org dashboards) |
| Edge Functions | Deno runtime | Post-MVP (Stripe webhook handling) |

**Supabase plan progression:**
| Stage | Plan | Monthly Cost | Key Limits |
|---|---|---|---|
| Beta (<500 users) | Free | $0 | 500MB DB, 2GB bandwidth, 50MB file storage |
| Launch (500–10K users) | Pro | $25 | 8GB DB, 250GB bandwidth, 100GB storage |
| Scale (10K+ users) | Pro + add-ons | $25–100 | Connection pooling, read replicas |

**`@supabase/ssr` usage pattern (App Router):**
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  );
}
```

---

### 3.9 API Validation: Zod

```json
"zod": "^3.x"
```

Every API route handler validates request bodies with Zod schemas before processing. This is non-negotiable — it prevents malformed data from reaching Supabase.

```typescript
// Example: POST /api/v1/sessions
import { z } from 'zod';

const CreateSessionSchema = z.object({
  exercise: z.enum(['squat', 'pushup', 'plank']),
  started_at: z.string().datetime(),
  device_type: z.enum(['iphone_safari', 'android_chrome', 'desktop', 'unknown']),
  app_version: z.string().max(20),
});

// In the route handler:
const parsed = CreateSessionSchema.safeParse(await request.json());
if (!parsed.success) {
  return Response.json(
    { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
    { status: 400 }
  );
}
```

---

### 3.10 Testing: Vitest + Playwright

**Unit / Integration: Vitest**
```json
"vitest": "^1.x",
"@vitest/coverage-v8": "^1.x",
"@testing-library/react": "^14.x",
"jsdom": "^24.x"
```

Test scope for MVP (`npm run test`):
- Pose pipeline: normalization, angle calculation, state machine
- Cue engine: rule evaluation, suppression logic
- Form score: calculation accuracy against known angle inputs
- API routes: happy path + validation error cases
- Session persistence: save/load cycle

Non-MVP tests live in `src/__tests__/extended/` and run via `npm run test:extended` only.

**E2E / Device Matrix: Playwright**
```json
"@playwright/test": "^1.4x"
```

Browser matrix (from `playwright.config.ts`):
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'android-chrome', use: { ...devices['Pixel 7'] } },
  { name: 'iphone-safari', use: { ...devices['iPhone 14'] } },
]
```

E2E test targets for MVP gate:
- `npm run test:e2e:coach` — full coaching flow on Chromium + Android Chrome
- `npm run test:e2e:coach:iphone` — iPhone Safari flow

Real device tests are manual, tracked in `DEVICE_VALIDATION_RUNBOOK.md`.

---

### 3.11 Error Tracking: Sentry

```json
"@sentry/nextjs": "^8.x"
```

Configured for client + server errors. Critical events to capture:
- MediaPipe initialization failure
- Session save failure (after retries)
- Camera permission denied
- Unhandled promise rejections in coaching loop

```typescript
// Sentry.init configuration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,          // 10% of transactions
  environment: process.env.NEXT_PUBLIC_FEATURE_ENV,
  // Never capture video frames or biometric data
  beforeSend(event) {
    // Strip any accidentally included media/blob URLs
    return event;
  },
});
```

---

### 3.12 Payments: Stripe (Post-MVP Phase 2)

```json
"stripe": "^16.6.x"                   // server-side ONLY
// @stripe/stripe-js is NOT needed — Hosted Checkout redirects to Stripe's page
```

Implementation pattern: **Stripe Checkout (hosted payment page)** — not Elements. The user is redirected to Stripe's hosted page for payment. No client-side Stripe SDK is loaded. This is simpler, more secure, and PCI-compliant by default. No custom card form needed.

**Pricing objects to create in Stripe:**
| Product | Price ID | Amount | Interval |
|---|---|---|---|
| Pro Monthly | `price_pro_monthly` | $9.99 | month |
| Pro Annual | `price_pro_annual` | $69.99 | year |
| Premium Monthly | `price_premium_monthly` | $14.99 | month |
| Premium Annual | `price_premium_annual` | $99.99 | year |

**Webhook events to handle:**
- `checkout.session.completed` → activate subscription
- `customer.subscription.updated` → update tier
- `customer.subscription.deleted` → downgrade to free
- `invoice.payment_failed` → grace period (3 days), then downgrade

---

## 4. Dependency Decision Matrix

### 4.1 What's Explicitly In

| Package | Version | Justification |
|---|---|---|
| `next` | 16.x | Framework (existing) |
| `react` | 19.x | UI (existing) |
| `typescript` | 5.x | Type safety (existing) |
| `tailwindcss` | 4.x | Styling (existing) |
| `@mediapipe/tasks-vision` | 0.10.x | Pose detection (existing + integrated) |
| `@supabase/supabase-js` | 2.x | Database client (existing) |
| `@supabase/ssr` | 0.x | Auth for App Router (existing) |
| `idb` | 8.x | IndexedDB Promise wrapper for offline queue |
| `zustand` | 5.x | High-frequency pose state management |
| `zod` | 3.x | API input validation |
| `@radix-ui/*` | latest | Accessible UI primitives |
| `vitest` | 1.x | Unit + integration testing |
| `@playwright/test` | 1.4x | E2E + device matrix |
| `@sentry/nextjs` | 8.x | Error tracking |

### 4.2 What's Explicitly Out (MVP)

| Package | Why Excluded |
|---|---|
| `react-query` / `tanstack-query` | Supabase client handles data fetching; unnecessary abstraction layer at MVP |
| `jotai` | Zustand chosen instead — better ecosystem for high-frequency external state |
| `prisma` / `drizzle` | Supabase's auto-generated types + raw SQL migrations are simpler |
| `socket.io` | Supabase Realtime handles WebSocket post-MVP |
| Any LLM SDK (`openai`, `anthropic`) | No cloud AI in MVP coaching path |
| `tensorflow` / `onnxruntime-web` | MediaPipe bundles its own WASM inference; separate TF runtime is redundant |
| `react-native` / `expo` | PWA is the MVP distribution strategy; native app is Phase 5 |
| Any analytics SDK (Mixpanel, Amplitude, PostHog) | Custom telemetry table in Supabase is sufficient and more private |

### 4.3 Evaluate for Post-MVP

| Package | When to Add | Use Case |
|---|---|---|
| `powersync` | If offline sync reliability is a top user complaint post-beta | Robust Postgres↔SQLite sync |
| `serwist` | Phase 1 (PWA service worker) | Asset caching, install prompt, offline shell |
| `@aws-sdk/client-s3` | If Supabase Storage becomes a bottleneck | Large video assets |
| `onnxruntime-web` | If post-MVP custom model needed (injury prediction) | Custom ONNX inference |
| `react-native` | Phase 5 (native mobile) | App Store distribution |

---

## 5. Build & Scripts Reference

```json
// package.json scripts
{
  "dev":                 "next dev",
  "build":              "next build",
  "start":              "next start",
  "lint":               "next lint && tsc --noEmit",
  "test":               "vitest run --project mvp",
  "test:watch":         "vitest --project mvp",
  "test:extended":      "vitest run --project extended",
  "test:coverage":      "vitest run --coverage --project mvp",
  "test:e2e:coach":     "playwright test tests/e2e/coach.smoke.spec.ts --project=chromium --project=android-chrome",
  "test:e2e:coach:iphone": "playwright test tests/e2e/coach.smoke.spec.ts --project=iphone-safari",
  "test:e2e:all":       "playwright test",
  "db:types":           "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/supabase.ts",
  "db:migrate":         "supabase db push",
  "analyze":            "ANALYZE=true next build"
}
```

**Release gate (CI):**
```
lint → test → build → test:e2e:coach
```
All four must pass before any merge to `main`. Real-device validation (`test:e2e:coach:iphone` on physical iPhone) is manual per `DEVICE_VALIDATION_RUNBOOK.md`.

---

## 6. Bundle Size Targets

| Bundle | Target | Primary Contributors |
|---|---|---|
| First Load JS (landing) | <80KB | Next.js runtime, minimal React |
| First Load JS (coach page) | <250KB | React, MediaPipe dynamic import |
| MediaPipe WASM bundle | ~5MB (cached) | Served from CDN, CacheFirst |
| ML model | ~5MB (cached) | `/public/models/`, CacheFirst |
| Audio pack | <10MB (cached) | Pre-recorded cues, CacheFirst |
| **Total first-visit payload** | **<350KB** | Excluding cached ML/audio |
| **Total with cold Service Worker** | **~20MB** | ML + audio pre-cached at install |

MediaPipe and the model are loaded via dynamic import inside the coach route only — they are never part of the landing page or history page bundle.

```typescript
// Lazy-load MediaPipe only when coach page mounts
const { initPoseLandmarker } = await import('@/lib/coach/posePipeline');
```

---

## 7. Environment & Configuration Management

| Variable | Where Set | Exposed to Client? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel env + `.env.local` | Yes (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env + `.env.local` | Yes (safe — RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env only (server) | **Never** |
| `NEXT_PUBLIC_APP_VERSION` | Vercel build env | Yes |
| `NEXT_PUBLIC_FEATURE_ENV` | Vercel env | Yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel env | Yes (public DSN is safe) |
| `SENTRY_AUTH_TOKEN` | GitHub Actions secrets | **Never** |
| `STRIPE_SECRET_KEY` | Vercel env (Phase 2) | **Never** |
| `STRIPE_WEBHOOK_SECRET` | Vercel env (Phase 2) | **Never** |
| ~~`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`~~ | Not needed — Hosted Checkout | N/A — no client SDK |

---

_Maintained by Tech Lead. Any dependency additions require PR with documented justification. Dependencies that require native modules or break PWA camera access are automatically rejected._

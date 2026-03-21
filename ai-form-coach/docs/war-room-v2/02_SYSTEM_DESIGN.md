# AI Form Coach — System Design
**Version:** 1.0 | **Status:** War Room Active | **Date:** March 2026
**Owner:** Tech Lead + Principal Backend Engineer

---

## 1. Architecture Overview

AI Form Coach is a **single-region, Supabase-backed Next.js 16 PWA** with strictly on-device ML inference. There is no server-side AI, no video upload pipeline, and no cloud compute in the live coaching path. The architecture is deliberately minimal — optimized for a solo developer, zero-cost ML inference, and fast iteration.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser / PWA)                    │
│                                                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Next.js 16  │  │ MediaPipe Pose  │  │  Canvas 2D    │  │
│  │  App Router  │  │ Landmarker WASM │  │  Overlay      │  │
│  │  (React 19)  │  │  (WebGL/WASM)   │  │  Renderer     │  │
│  └──────┬───────┘  └────────┬────────┘  └───────────────┘  │
│         │                   │                               │
│  ┌──────▼───────────────────▼──────────────────────────┐    │
│  │              Coaching Engine (Client)               │    │
│  │  PosePipeline → MotionFeatures → CueEngine →       │    │
│  │  VoiceSynthesis → SessionPersistence               │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                              │                               │
│  ┌───────────────────────────▼─────────────────────────┐    │
│  │          Offline Queue (IndexedDB / PWA)            │    │
│  └───────────────────────────┬─────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS / WebSocket
┌──────────────────────────────▼──────────────────────────────┐
│                      SUPABASE (BaaS)                        │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │  Auth        │  │  Postgres DB  │  │  Realtime       │  │
│  │  (JWT/Cookie)│  │  (Row-Level   │  │  (WebSocket,    │  │
│  │              │  │   Security)   │  │   post-MVP)     │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  DEPLOYMENT (Vercel / Netlify)              │
│  Next.js Edge Runtime for static + API routes               │
│  Service Worker (PWA offline caching)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Client Architecture

### 2.1 Live Coaching Pipeline (The Core Product Loop)

The live coaching loop is a **single-direction data pipeline** running per animation frame. Each stage is a pure function or stateful module with clearly defined inputs and outputs. No async network calls occur in this path.

```
Camera Stream (getUserMedia)
        │
        ▼
┌───────────────────┐
│  PosePipeline     │  MediaPipe Pose Landmarker (WASM)
│  • detect()       │  → RawPose33 (33 3D landmarks + visibility scores)
│  • smooth()       │  → EMA filter (alpha=0.65) applied per landmark
└────────┬──────────┘
         │ RawPose33 (smoothed)
         ▼
┌───────────────────┐
│  PoseNormalizer   │  Scale-invariant, hip-to-ankle normalization
│  • normalize()    │  → coordinates in [0,1] range
│  • deriveJoints() │  → neck (shoulder midpoint), pelvis_center, torso_center
└────────┬──────────┘
         │ FitnessSkeleton10 + DerivedJoints
         ▼
┌───────────────────┐
│  MotionFeatures   │  Joint angle calculation (law of cosines)
│  • angles()       │  → ROM, tempo, symmetry, visibility scores, cue state
│  • repState()     │  State machine: READY → DOWN → UP → READY
└────────┬──────────┘
         │ MotionFeatures + RepState
         ▼
┌───────────────────┐
│  CueEngine        │  Rule-based cue selector (calmer cadence)
│  • evaluate()     │  Cooldown: 3000ms default, 2000ms safety minimum
│  • selectCue()    │  Priority: safety > correction > encouragement
└────────┬──────────┘
         │ CueTrigger (optional)
         ├──────────────────────────────────┐
         ▼                                  ▼
┌───────────────────┐              ┌─────────────────────┐
│  OverlayRenderer  │              │  VoiceSynthesizer   │
│  (Canvas 2D)      │              │  AudioPack → Speech │
│  ≤4ms/frame       │              │  Synthesis fallback │
└───────────────────┘              └─────────────────────┘
         │
         ▼
┌───────────────────┐
│  SessionRecorder  │  Accumulates rep events + cue events
│  • recordRep()    │  In-memory during session
│  • save()         │  → flush to IndexedDB + Supabase on session end
└───────────────────┘
```

### 2.2 Module Contracts

```typescript
// Core pose types
type RawPose33 = {
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>;
  worldLandmarks: Array<{ x: number; y: number; z: number; visibility: number }>;
  timestamp: number;
};

type FitnessSkeleton10 = {
  // Simplified 10-joint fitness skeleton (shoulders, elbows, wrists, hips, knees, ankles)
  // Full 33 MediaPipe landmarks reduced to the joints relevant for form coaching
  joints: Record<FitnessJointName, Joint>;
  timestamp: number;
};

type DerivedJoints = {
  neck: Joint;           // midpoint of left_shoulder + right_shoulder
  pelvis_center: Joint;  // midpoint of left_hip + right_hip
  torso_center: Joint;   // midpoint of neck + pelvis_center
};

type MotionFeatures = {
  angles: Record<AngleName, number>;   // degrees
  repState: RepState;
  repCount: number;
  tempo: number;                       // reps/min
  symmetry: number;                    // 0–1 left/right balance
  visibility: Record<string, number>;  // per joint visibility
  formScore: number;                   // 0–100 per frame
  cueState: CueState;
};

type RepState = 'READY' | 'DOWN' | 'UP';

type CueTrigger = {
  cueId: string;
  audioUrl?: string;          // if human-recorded version exists
  text: string;               // always set, shown on-screen
  ttsFallback: string;        // browser speechSynthesis string
  priority: 'safety' | 'correction' | 'encouragement';
};
```

### 2.3 FeatureRegistry

All routes, nav items, and features are gated through a central `FeatureRegistry`:

```typescript
// src/lib/features/registry.ts
const FEATURE_FLAGS = {
  // MVP PUBLIC
  coachPage: true,
  historyPage: true,
  pricingPage: true,

  // POST-MVP (hidden from nav, sitemap, onboarding)
  nutritionTracking: false,
  foodScan: false,
  readinessDashboard: false,
  organizationAdmin: false,
  leaderboards: false,
  challenges: false,
  creatorPacks: false,
  socialPods: false,
  wearableSync: false,
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}
```

---

## 3. Data Models

### 3.1 Core Tables (Supabase / Postgres)

```sql
-- Users (managed by Supabase Auth)
-- auth.users table — Supabase native

-- User profiles (public metadata)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE,
  display_name    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (core data entity)
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise        TEXT NOT NULL CHECK (exercise IN ('squat', 'pushup', 'plank')),
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ,
  duration_ms     INTEGER,
  rep_count       INTEGER DEFAULT 0,
  avg_form_score  NUMERIC(5,2),
  cue_feedback    BOOLEAN,          -- null = not answered, true = helpful, false = not
  device_type     TEXT,             -- 'iphone_safari' | 'android_chrome' | 'desktop'
  app_version     TEXT,
  synced_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Reps (granular rep-level data — enables future analytics)
CREATE TABLE reps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  rep_number      INTEGER NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ NOT NULL,
  duration_ms     INTEGER,
  form_score      NUMERIC(5,2),
  max_angle       NUMERIC(6,3),    -- exercise-specific (e.g., knee angle at squat depth)
  min_angle       NUMERIC(6,3),
  cues_triggered  TEXT[]           -- array of cue IDs triggered during this rep
);

-- Telemetry events (client-side telemetry from telemetry.ts)
CREATE TABLE telemetry_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,
  properties      JSONB,
  client_ts       TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Row-Level Security (RLS) Policies

```sql
-- All tables use RLS. Users can only access their own data.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE reps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own reps" ON reps
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM sessions WHERE id = reps.session_id)
  );

ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own telemetry" ON telemetry_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Telemetry reads for analytics are done via service role key (server-only)
```

### 3.3 Local-First Offline Schema (IndexedDB via `idb`)

```typescript
// src/lib/storage/offlineQueue.ts — idb (Promise-based IndexedDB wrapper)
// Note: Using `idb` library (not Dexie.js) for lightweight Promise-based IndexedDB access
class AIFormCoachDB extends Dexie {
  sessions!: Table<LocalSession>;
  reps!: Table<LocalRep>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('ai-form-coach');
    this.version(1).stores({
      sessions: '++localId, id, userId, exercise, startedAt, syncStatus',
      reps:     '++localId, id, sessionId, repNumber',
      syncQueue:'++localId, entityType, entityId, operation, retries, createdAt',
    });
  }
}

type SyncStatus = 'pending' | 'synced' | 'failed';
type SyncQueueItem = {
  localId?: number;
  entityType: 'session' | 'rep';
  entityId: string;
  operation: 'upsert' | 'delete';
  payload: object;
  retries: number;
  createdAt: Date;
};
```

### 3.4 Content Models

```typescript
// Versioned cue pack
type VoiceCuePack = {
  version: string;       // "1.0.0"
  exercise: 'squat' | 'pushup' | 'plank';
  cues: VoiceCue[];
};

type VoiceCue = {
  id: string;            // e.g., "squat_depth_low"
  trigger: string;       // condition key from CueEngine
  text: string;          // on-screen display text
  tts: string;           // browser speechSynthesis string
  audioFile?: string;    // path to human-recorded .mp3 (optional)
  priority: 'safety' | 'correction' | 'encouragement';
  suppressWindowMs: number; // minimum ms before same cue repeats
};

// Tutorial sample session
type TutorialSampleSession = {
  exercise: 'squat' | 'pushup' | 'plank';
  version: string;
  videoUrl: string;      // human-captured demo movement
  keyframes: TutorialKeyframe[];
};
```

---

## 4. Service Boundaries

### 4.1 Client-Side Services (No server involvement)
| Service | Responsibility |
|---|---|
| `PosePipeline` | MediaPipe initialization, frame detection, landmark smoothing |
| `PoseNormalizer` | Scale normalization, DerivedJoints calculation |
| `MotionFeatureExtractor` | Joint angles, rep state machine, form score |
| `CueEngine` | Cue selection, suppression, priority logic |
| `OverlayRenderer` | Canvas2D skeleton drawing, cue text overlay |
| `VoiceSynthesizer` | Audio pack playback + speechSynthesis fallback |
| `SessionRecorder` | In-memory accumulation, IndexedDB flush |
| `ZustandPoseStore` | High-frequency pose state management (~30fps updates without React re-renders) |
| `SyncQueue` | Offline-first Supabase sync with retry logic |
| `DeviceReadiness` | Camera checks, frame rate validation, lighting guidance |
| `Telemetry` | Event logging (batched, fire-and-forget) |

### 4.2 Server-Side Routes (Next.js API Routes)
| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/sessions` | POST | Required | Create session record |
| `/api/sessions/[id]` | PATCH | Required | Update session (end time, rep count, form score) |
| `/api/sessions` | GET | Required | List user sessions (max 30) |
| `/api/sessions/[id]/reps` | POST | Required | Batch upsert rep data |
| `/api/telemetry` | POST | Optional | Ingest telemetry events |
| `/api/auth/callback` | GET | — | Supabase OAuth callback (post-MVP) |

**Important:** All live coaching logic executes client-side. The API is only used for persistence and history.

### 4.3 Provider Boundaries (Disabled in Beta, Wired for Post-MVP)
```typescript
// Disabled providers — interface defined, implementation empty at MVP
interface VisionReasoningProvider {
  analyzePosture(frame: ImageBitmap): Promise<PostureAnalysis>;
}

interface TextPlanningProvider {
  generateWorkoutPlan(profile: UserProfile): Promise<WorkoutPlan>;
}

interface VoiceSynthesisProvider {
  synthesize(text: string, voice: VoiceConfig): Promise<ArrayBuffer>;
}
```

---

## 5. Infrastructure & Deployment

### 5.1 Hosting
- **Frontend + API Routes:** Vercel (Next.js native deployment)
  - Edge Runtime for `/api/og-image` (fix pending non-blocking warning)
  - Node.js Runtime for session API routes (Supabase SDK requires)
- **Database + Auth:** Supabase (Pro plan required before launch for 500MB+ storage + 50GB bandwidth)
- **Media Assets (audio packs, video tutorials):** Vercel CDN or Supabase Storage (≤50MB total at MVP)

### 5.2 Service Worker (PWA)
```
Status: Not yet implemented (Beta 1 ships without service worker)
Planned library: Serwist (next-pwa replacement for Next.js 14+; next-pwa is abandoned)
Phase 1 implementation target.

Planned cache strategy (Phase 1):
  - Static assets: CacheFirst (long TTL)
  - API routes: NetworkFirst with IndexedDB fallback
  - MediaPipe WASM bundles: CacheFirst (version-keyed)
  - Audio pack files: CacheFirst
  - Camera stream: Never cached (live only)

Note: Offline data persistence already works via IndexedDB (`idb` library)
      in src/lib/storage/offlineQueue.ts. Service worker adds asset caching
      and the install banner / "Add to Home Screen" capability.
```

### 5.3 Environment Configuration
```bash
# .env.local (never committed)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only
NEXT_PUBLIC_APP_VERSION=        # injected at build time
NEXT_PUBLIC_FEATURE_ENV=        # 'beta' | 'production'

# Optional post-MVP
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### 5.4 CI/CD Pipeline
```yaml
# GitHub Actions (simplified)
on: [push to main, PR to main]

jobs:
  quality-gates:
    - npm run lint
    - npm run test              # MVP suite only
    - npm run build
    - npm run test:e2e:coach    # Playwright (Chromium + Android Chrome emulator)

  # Real device validation: manual trigger via DEVICE_VALIDATION_RUNBOOK.md
  # Required before release branch promotion
```

### 5.5 Monitoring & Observability
- **Error tracking:** Sentry (free tier, client + server)
- **Performance telemetry:** Custom telemetry.ts events → Supabase `telemetry_events` table
- **Uptime monitoring:** Better Uptime (free tier, 1-min intervals)
- **Database monitoring:** Supabase dashboard + pg_stat_statements

---

## 6. Security Model

### 6.1 Authentication Flow
```
User submits email/password
        │
        ▼
Supabase Auth (bcrypt hashed passwords)
        │
        ▼
JWT issued → stored in httpOnly Supabase cookie
        │
        ▼
All API requests validated by Supabase RLS + anon/service key
        │
        ▼
Client receives session object via @supabase/ssr
```

### 6.2 Threat Model (MVP)
| Threat | Mitigation |
|---|---|
| Video data exfiltration | MediaPipe runs fully in-browser; camera stream never transmitted |
| User data access by others | RLS policies enforced at DB layer for all tables |
| Auth token theft | httpOnly cookies, HTTPS only, Supabase secure defaults |
| API abuse / rate limiting | Supabase built-in rate limiting + Next.js edge rate limiting (post-MVP) |
| XSS | Next.js React escaping; no dangerouslySetInnerHTML usage |
| CSRF | Supabase cookie-based auth uses SameSite protection |

### 6.3 Data Retention
- Sessions and reps: retained until user deletes account
- Telemetry events: 90-day retention, then archived or deleted
- Account deletion: cascades to all user data (ON DELETE CASCADE in schema)

---

## 7. Scalability Limits & Upgrade Triggers

| Scale Signal | Current Architecture Limit | Upgrade Path |
|---|---|---|
| 10K MAU | Supabase free/pro handles easily | — |
| 100K MAU | Supabase Pro + Vercel Pro | Consider read replica, CDN tuning |
| 1M MAU | DB connection pooling (PgBouncer) needed | Supabase Enterprise / dedicated Postgres |
| B2B multi-tenant | Single-tenant model today | Add `organization_id` FK, org-scoped RLS |
| HIPAA compliance | Not currently compliant | Supabase HIPAA-eligible plan + BAA agreement + audit logging |

---

## 8. Architecture Decision Log

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| MediaPipe Pose Landmarker (not MoveNet) | 33 landmarks with 3D, proven browser SDK, future headroom for richer analysis | MoveNet Lightning (17 landmarks only, no 3D) |
| Canvas2D for overlay (not WebGL) | <1ms draw time for 10-joint fitness skeleton, no GPU pipeline complexity | WebGL (overkill, adds fragility) |
| Supabase (not custom Postgres) | Instant auth, RLS, realtime, Postgres — all for $25/mo | PlanetScale, Neon, Firebase |
| Next.js App Router (not Pages) | Server Components, layout-level auth, Edge Runtime support | Pages Router (older, more compatible) |
| IndexedDB + Supabase (not PowerSync) | Simpler for MVP; PowerSync adds ~50KB bundle | PowerSync (evaluate post-MVP for sync robustness) |
| Client-side AI only (no cloud AI in coaching path) | Privacy, latency, zero per-inference cost, no GPU server needed | Cloud Vision API (too expensive, privacy risk, latency) |
| EMA smoothing (alpha=0.65) for MVP | Simpler, faster (~0.1ms vs ~0.3ms), sufficient for dynamic rep-based exercises. One Euro Filter evaluated for Phase 3+ hold-based exercises (yoga/plank). | One Euro Filter (better for holds, adaptive), Kalman (higher SEM, heavier) |
| Zustand for real-time pose state | Handles ~30fps pose updates without triggering React re-renders; outperforms React Context for high-frequency state | React Context (re-render cascade), Jotai (similar, less ecosystem) |
| `idb` for IndexedDB (not Dexie.js) | Lightweight Promise wrapper over IndexedDB; sufficient for offline queue pattern | Dexie.js (heavier, more features than needed) |

---

_Maintained by Tech Lead. Architecture changes require written ADR entry and Tech Lead approval._

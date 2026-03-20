# AI Form Coach — Canonical API List
**Version:** 1.0 | **Status:** War Room Active | **Date:** March 2026
**Owner:** Principal Backend Engineer | **Reviewed by:** Tech Lead

---

## Overview

AI Form Coach has a **thin API surface**. All live coaching logic executes client-side. The API is exclusively responsible for persistence, authentication, and data retrieval. Server-side routes are implemented as Next.js App Router Route Handlers unless noted otherwise.

**Base URL (production):** `https://aiformcoach.com`
**Base URL (development):** `http://localhost:3000`
**API prefix:** `/api/v1/`

**Authentication:** All protected routes require a valid Supabase session JWT in the `Authorization: Bearer <token>` header, OR in the `sb-access-token` httpOnly cookie (SSR contexts). Supabase middleware validates the token before the handler runs.

---

## Authentication Contract

```typescript
// Every protected route handler receives a validated user object
type AuthenticatedRequest = {
  user: {
    id: string;          // Supabase auth.users UUID
    email: string;
    created_at: string;
  };
  supabase: SupabaseClient;  // server-side client with user context
};
```

**Error responses (auth):**
```json
// 401 Unauthorized — no or invalid token
{ "error": "Unauthorized", "code": "AUTH_REQUIRED" }

// 403 Forbidden — valid token but insufficient permissions
{ "error": "Forbidden", "code": "ACCESS_DENIED" }
```

---

## 1. Sessions

### `POST /api/v1/sessions` — Create session

Initializes a session record when the user presses Start. Returns the session ID used for all subsequent calls.

**Auth:** Required

**Request body:**
```typescript
type CreateSessionRequest = {
  exercise: 'squat' | 'pushup' | 'plank';
  started_at: string;          // ISO 8601, e.g. "2026-03-09T14:32:00.000Z"
  device_type: 'iphone_safari' | 'android_chrome' | 'desktop' | 'unknown';
  app_version: string;         // e.g. "1.0.0"
};
```

**Response `201 Created`:**
```typescript
type CreateSessionResponse = {
  id: string;                  // UUID — session ID, client caches this
  user_id: string;
  exercise: string;
  started_at: string;
  created_at: string;
};
```

**Validation:**
- `exercise` must be `squat | pushup | plank`
- `started_at` must be valid ISO 8601 and not in the future
- Rate limit: max 10 session creates per user per hour

**Error responses:**
```json
// 400 Bad Request
{ "error": "Invalid exercise", "code": "VALIDATION_ERROR", "field": "exercise" }
{ "error": "Invalid started_at", "code": "VALIDATION_ERROR", "field": "started_at" }

// 429 Too Many Requests
{ "error": "Rate limit exceeded", "code": "RATE_LIMIT", "retryAfterMs": 3600000 }
```

---

### `PATCH /api/v1/sessions/:id` — Update session (end session)

Called when the user ends a session (Save button). Updates the session with final metrics.

**Auth:** Required (user must own the session)

**Path params:**
- `id` — session UUID (from POST /sessions response)

**Request body:**
```typescript
type UpdateSessionRequest = {
  ended_at: string;            // ISO 8601
  duration_ms: number;         // ms from started_at to ended_at
  rep_count: number;           // total reps completed
  avg_form_score?: number;     // 0–100, float
  cue_feedback?: boolean;      // true = helpful, false = not helpful, null = not answered
};
```

**Response `200 OK`:**
```typescript
type UpdateSessionResponse = {
  id: string;
  user_id: string;
  exercise: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  rep_count: number;
  avg_form_score: number | null;
  cue_feedback: boolean | null;
  updated_at: string;
};
```

**Validation:**
- `ended_at` must be after the session's `started_at`
- `duration_ms` must match `ended_at - started_at` within ±5000ms tolerance
- `rep_count` must be ≥0
- `avg_form_score` if present must be 0–100

**Error responses:**
```json
// 404 Not Found
{ "error": "Session not found", "code": "NOT_FOUND" }

// 403 Forbidden — session belongs to another user
{ "error": "Access denied", "code": "ACCESS_DENIED" }

// 409 Conflict — session already ended
{ "error": "Session already completed", "code": "SESSION_ALREADY_ENDED" }
```

---

### `GET /api/v1/sessions` — List sessions (history)

Returns the user's session history in reverse chronological order.

**Auth:** Required

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | 30 | Max sessions to return (1–50) |
| `before` | ISO 8601 | — | Cursor for pagination (optional) |
| `exercise` | string | — | Filter by exercise type (optional) |

**Response `200 OK`:**
```typescript
type ListSessionsResponse = {
  sessions: SessionSummary[];
  total: number;
  hasMore: boolean;
};

type SessionSummary = {
  id: string;
  exercise: 'squat' | 'pushup' | 'plank';
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  rep_count: number;
  avg_form_score: number | null;
  cue_feedback: boolean | null;
};
```

---

### `GET /api/v1/sessions/:id` — Get single session

**Auth:** Required (user must own the session)

**Response `200 OK`:**
```typescript
type GetSessionResponse = SessionSummary & {
  device_type: string;
  app_version: string;
  reps: RepSummary[];    // populated if reps were submitted
};

type RepSummary = {
  rep_number: number;
  duration_ms: number;
  form_score: number | null;
  max_angle: number | null;
  min_angle: number | null;
  cues_triggered: string[];
};
```

---

### `DELETE /api/v1/sessions/:id` — Delete session

**Auth:** Required (user must own the session)

**Response `204 No Content`**

---

## 2. Reps

### `POST /api/v1/sessions/:id/reps` — Batch upsert reps

Submits all rep data for a session as a batch. Called once on session end alongside the PATCH /sessions/:id call. Client may also call during a session for offline resilience.

**Auth:** Required

**Request body:**
```typescript
type BatchUpsertRepsRequest = {
  reps: RepData[];
};

type RepData = {
  id?: string;               // Client-generated UUID (idempotency key)
  rep_number: number;        // 1-indexed
  started_at: string;        // ISO 8601
  ended_at: string;          // ISO 8601
  duration_ms: number;
  form_score?: number;       // 0–100
  max_angle?: number;        // exercise-specific primary angle at peak
  min_angle?: number;        // exercise-specific primary angle at bottom
  cues_triggered?: string[]; // array of cue IDs
};
```

**Response `201 Created`:**
```typescript
type BatchUpsertRepsResponse = {
  inserted: number;
  updated: number;
  failed: number;
  errors: Array<{ repNumber: number; error: string }>;
};
```

**Validation:**
- Max 500 reps per batch
- `rep_number` must be sequential starting from 1
- Session must exist and belong to the authenticated user

---

## 3. Telemetry

### `POST /api/v1/telemetry` — Ingest telemetry events

**Auth:** Optional (anonymous events accepted but rate-limited more aggressively)

**Request body:**
```typescript
type TelemetryBatchRequest = {
  events: TelemetryEvent[];
  sessionId?: string;    // associate batch with a session if available
};

type TelemetryEvent = {
  eventType: TelemetryEventType;
  properties?: Record<string, string | number | boolean>;
  clientTs: string;      // ISO 8601 client-side timestamp
};

type TelemetryEventType =
  // Navigation
  | 'coach_page_visit'
  | 'pricing_page_visit'
  | 'history_page_visit'
  // Device / stage
  | 'stage_readiness_check'
  | 'stage_readiness_passed'
  | 'stage_readiness_failed'
  | 'stage_readiness_retry'
  | 'camera_permission_denied'
  | 'camera_permission_granted'
  // Session
  | 'exercise_selected'
  | 'session_start'
  | 'session_pause'
  | 'session_resume'
  | 'session_complete'
  | 'session_abandoned'
  | 'session_save_success'
  | 'session_save_failed'
  | 'session_save_queued_offline'
  // Cues
  | 'cue_delivered'
  | 'cue_feedback_positive'
  | 'cue_feedback_negative'
  // Performance
  | 'performance_frame_drop_spike'  // when drop rate exceeds threshold
  | 'performance_cue_latency_exceeded';

```

**Response `202 Accepted`:**
```json
{ "accepted": 5 }
```

**Rate limit:** 100 events/session, 1000 events/user/day

---

## 4. Profile

### `GET /api/v1/profile` — Get current user's profile

**Auth:** Required

**Response `200 OK`:**
```typescript
type ProfileResponse = {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string;
  created_at: string;
  stats: {
    total_sessions: number;
    total_reps: number;
    streak_days: number;        // post-MVP, returns 0 at MVP
    favorite_exercise: string | null;
  };
};
```

---

### `PATCH /api/v1/profile` — Update profile

**Auth:** Required

**Request body:**
```typescript
type UpdateProfileRequest = {
  display_name?: string;    // max 50 chars
  username?: string;        // max 30 chars, alphanumeric + underscores, unique
};
```

**Response `200 OK`:** Returns updated `ProfileResponse`

**Error responses:**
```json
// 409 Conflict — username already taken
{ "error": "Username already taken", "code": "USERNAME_CONFLICT" }
```

---

### `DELETE /api/v1/profile` — Delete account (GDPR compliance)

**Auth:** Required

**Response `204 No Content`**

**Behavior:** Triggers Supabase cascade delete on all user data (sessions, reps, telemetry, profile). Supabase Auth user is also deleted. This action is irreversible.

---

## 5. Feature Flags (Internal)

### `GET /api/v1/features` — Get feature flag state

Returns the current FeatureRegistry state. Used by the client to gate UI elements.

**Auth:** Optional (returns public flags regardless)

**Response `200 OK`:**
```typescript
type FeaturesResponse = {
  flags: Record<string, boolean>;
  environment: 'beta' | 'production';
  appVersion: string;
};
```

---

## 6. Post-MVP API Contracts (Defined, Not Implemented)

The following routes are **defined here for planning purposes** and will be implemented in later phases:

### `POST /api/v1/subscriptions/checkout` — Create Stripe checkout session
- Phase 2 (Month 2–4 post-launch)
- Creates a Stripe Checkout session for Pro or Premium tier
- Returns `{ checkoutUrl: string }`

### `POST /api/v1/webhooks/stripe` — Stripe webhook handler
- Phase 2
- Handles `checkout.session.completed`, `customer.subscription.deleted`
- Updates user `subscription_tier` in profiles table

### `POST /api/v1/organizations` — Create organization (B2B)
- Phase 3 (Month 12+)
- Requires `ORGANIZATION_ADMIN` role
- Returns organization object with `admin_invite_code`

### `GET /api/v1/organizations/:id/analytics` — Organization-level analytics
- Phase 3 (B2B admin dashboard)
- HIPAA-eligible endpoint — requires org admin role
- Returns aggregate (never individual) usage metrics

### `GET /api/v1/share/form-score/:sessionId` — Shareable form score card
- Phase 2
- Public endpoint (no auth) — returns OG-optimized card metadata for sharing
- Rate-limited to prevent enumeration

---

## 7. Error Response Standard

All error responses follow this schema:

```typescript
type ErrorResponse = {
  error: string;        // Human-readable message
  code: string;         // Machine-readable error code (SCREAMING_SNAKE_CASE)
  field?: string;       // For validation errors — which field failed
  retryAfterMs?: number; // For rate limit errors
  requestId?: string;   // For debugging (Vercel request ID or UUID)
};
```

**HTTP Status Codes:**
| Status | Usage |
|---|---|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 202 | Accepted (async operations like telemetry) |
| 204 | No Content (DELETE) |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, already exists) |
| 422 | Unprocessable entity (semantic validation failed) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (Supabase outage) |

---

## 8. Offline Sync Contract

The client SyncQueue uses IndexedDB and retries against the API when online. The retry strategy for each route:

| Route | Retry Strategy | Max Retries | Idempotency |
|---|---|---|---|
| `POST /sessions` | Exponential backoff (1s, 2s, 4s, 8s) | 5 | Client-generated UUID as `id` |
| `PATCH /sessions/:id` | Exponential backoff | 5 | Safe to retry (PATCH is idempotent) |
| `POST /sessions/:id/reps` | Exponential backoff | 5 | Client-generated rep IDs prevent duplicates |
| `POST /telemetry` | Fire-and-forget | 1 | Best-effort; data loss acceptable |

**Sync queue item lifecycle:**
```
queued → retrying (backoff) → synced (remove from queue)
                          ↘ failed (max retries exceeded, keep in queue, notify user)
```

---

## 9. API Versioning Policy

- Current version: `v1`
- Breaking changes require a new version prefix (`/api/v2/`)
- Non-breaking additions (new optional fields, new routes) do not require version bump
- Deprecation notice period: 90 days minimum before removing a versioned endpoint
- API changelog maintained in `/docs/api/CHANGELOG.md`

---

_Maintained by Principal Backend Engineer. All new routes require PR review from Tech Lead. Endpoint schemas are the source of truth — Supabase DB schema is derived from these, not vice versa._

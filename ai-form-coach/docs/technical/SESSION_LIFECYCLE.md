# Session Lifecycle — Coach Page State Machine

> Source of truth: `src/app/coach/page.tsx`

## Overview

The coach page manages two layers of state: **camera setup** (hardware readiness) and **session state** (coaching lifecycle). Both must be understood together to trace the full user journey from page load to saved session.

---

## Layer 1: Camera Setup

Camera setup runs once on mount (gated by `permissionGranted`) and can be re-triggered via retry. It is **not** part of `SessionState` — it's a precondition.

```
┌──────────────────┐
│ Permission Card  │  permissionGranted = false
│ (CameraPermission│  User sees pre-permission explanation card
│  Card.tsx)       │
└────────┬─────────┘
         │ user clicks "Allow Camera Access"
         ▼
┌──────────────────┐
│ Initializing     │  cameraReady=false, cameraError=null, detectorError=null
│ Pose Detector    │  cameraStatus="Initializing pose detector..."
└────────┬─────────┘
         │ PoseEngine2.init()
         ├── success ──────────────────────────────┐
         │                                         ▼
         │                               ┌──────────────────┐
         │                               │ Requesting Camera │
         │                               │ Access            │
         │                               │ getUserMedia()    │
         │                               └────────┬─────────┘
         │                                        │
         │                          ┌─────────────┼─────────────┐
         │                          ▼             ▼              ▼
         │                    ┌──────────┐  ┌──────────┐  ┌──────────────┐
         │                    │ Camera   │  │ Camera   │  │ Camera Ready │
         │                    │ Error    │  │ Error    │  │              │
         │                    │ (denied) │  │ (in use) │  │ cameraReady  │
         │                    └──────────┘  └──────────┘  │ = true       │
         │                                                └──────────────┘
         ▼
┌──────────────────┐
│ Detector Error   │  detectorError="Pose detector could not start..."
│                  │  cameraStatus="Pose detector unavailable."
└──────────────────┘
```

### Camera Error Types (from `getCameraErrorMessage`)

| Error Name | User Message |
|---|---|
| `NotAllowedError` | Camera access is blocked. Allow permission and reload. |
| `NotFoundError` | No camera was found for this device or browser profile. |
| `NotReadableError` | The camera is already in use by another app or tab. |
| `OverconstrainedError` | The requested camera settings are not available on this device. |
| (other) | Camera access failed. Check browser permissions and try again. |

### Recovery

All camera/detector errors show a recovery guide (`getCoachRecoveryGuide`). The user can retry via `handleRetryCamera`, which:
1. Increments `retryCountRef`
2. Releases camera stage (stops stream, disposes engine, cancels loops)
3. Resets all camera/detector state
4. Bumps `cameraBootNonce` to re-trigger the initialization `useEffect`

---

## Layer 2: Session State Machine

```typescript
type SessionState = "idle" | "active" | "paused" | "completed";
```

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
              ┌──────────┐                                    │
              │   idle   │ ◄──── page load / retry camera     │
              │          │       exercise change resets here   │
              └────┬─────┘                                    │
                   │                                          │
                   │ queueSessionStart() — user taps "Start"  │
                   │ → 3-second countdown                     │
                   │ → activateSession() on countdown end     │
                   │                                          │
                   ▼                                          │
              ┌──────────┐         pause()                    │
              │  active  │ ─────────────────► ┌──────────┐    │
              │          │                    │  paused  │    │
              │          │ ◄───────────────── │          │    │
              └────┬─────┘     resume()       └────┬─────┘    │
                   │                               │          │
                   │ endAndSave()                   │          │
                   │◄──────────────────────────────┘          │
                   │ endAndSave()                              │
                   ▼                                          │
              ┌──────────┐                                    │
              │completed │ ─── user taps "Start New" ─────────┘
              │          │     (goes back to idle,
              └──────────┘      then queueSessionStart)
```

### State Details

#### `idle`
- **Entry:** Page load, camera retry, exercise change, or after completed → new session
- **Camera active:** Yes (preview mode — pose detection runs but no rep counting)
- **UI:** Pre-session framing guidance, exercise selector enabled, "Start" button visible
- **Cue:** `starterCue` for selected exercise
- **Pose handling:** Shows framing guidance (`getFramingGuidance`) but does not validate reps

#### `active`
- **Entry:** `activateSession()` — called after 3-second countdown completes
- **What happens on entry:**
  - Creates fresh validator (`createValidator(exercise)`)
  - Resets session metrics (reps, elapsed, visibility accumulator)
  - Records `sessionStartIso` timestamp
  - Starts performance timer (`activeStartPerfRef`)
  - Ensures speech synthesis is ready
  - Fires `trackCoachSessionStart` analytics event
- **Camera active:** Yes (full coaching mode — rep counting, cue generation)
- **UI:** Live coaching overlay, rep counter, elapsed timer, quality badge, pause/end buttons
- **Pose handling:** Full pipeline — validator processes each pose frame, generates cues, counts reps
- **Cue cadence:** `setCadencedCue` with TTS speaking on primary cue changes

#### `paused`
- **Entry:** `pause()` — user taps pause button
- **What happens on entry:**
  - Snapshots elapsed time from performance timer
  - Increments `pauseCount`
  - Fires `trackCoachSessionPause` analytics event
- **Camera active:** Yes (preview mode, no rep counting)
- **UI:** "Session paused" badge, framing guidance, resume/end buttons, exercise selector disabled
- **Can transition to:** `active` (resume) or `completed` (end)

#### `completed`
- **Entry:** `endAndSave()` — user taps end button or session ends
- **What happens on entry:**
  1. Calculates final elapsed time and average visibility
  2. Sets `sessionState("completed")` and `saving(true)`
  3. Gets current user ID (if not authenticated → `signin_required` notice)
  4. Enqueues session write to IndexedDB sync queue
  5. Enqueues individual rep metric writes
  6. Calls `flushWrites()` to sync to Supabase
  7. Sets save outcome: `"saved"` | `"sync_pending"` | `"sync_retry"` | `"signin_required"`
  8. Fires `trackCoachSessionComplete` analytics event
  9. Sets `saving(false)`
- **Camera active:** Yes (preview mode)
- **UI:** "Session complete" badge, save notice, "Start New" button, link to history

---

## Save Outcomes

| Outcome | Condition | User Message |
|---|---|---|
| `saved` | Flush succeeded, no pending writes | "Session saved. It is ready in history." |
| `sync_pending` | Flush succeeded but writes remain in queue | "Session buffered for sync. N writes still pending." |
| `sync_retry` | Flush threw an error | "Session captured locally, but sync failed. We will retry when the connection is healthy." |
| `signin_required` | No authenticated user | "Session complete. Sign in to save it to history." |

---

## Countdown Mechanism

The countdown bridges `idle` → `active`:

1. User taps "Start" → `queueSessionStart()`
2. If countdown already running → `cancelCountdown()` (toggle off)
3. Sets `countdownValue = 3`, shows "Hold steady. {exercise} starts in 3."
4. Internal timer decrements each second: 3 → 2 → 1 → 0
5. At 0 → calls `activateSession()` which sets `sessionState("active")`

The countdown can be cancelled by tapping "Start" again during the countdown.

---

## Data Flow: Pose → Cue → Save

```
Camera frame
    │
    ▼
PoseEngine2.detect()          ← MediaPipe Tasks Vision (Lite model)
    │
    ▼
onPose(result)                ← called per frame via requestAnimationFrame
    │
    ├── No result → increment stale frame counter
    │   └── After 10 stale frames → force "no pose" UI update
    │
    ├── Not active → show preview framing guidance only
    │
    ├── Low visibility (<0.6) → "Move back" cue, no validation
    │
    └── Good frame → validator(result)
        │
        ├── repCount, phase, mentorCue, cues[]
        │
        ├── commitLiveUiFrame() → batched React state update via startTransition
        │
        └── setCadencedCue() → TTS speaks on primary cue change
                                (1800ms minimum interval)
```

---

## Key Constants

| Constant | Value | Purpose |
|---|---|---|
| `VISIBILITY_THRESHOLD` | 0.6 | Minimum landmark visibility to run validation |
| `FLUSH_INTERVAL_MS` | 10000 | Periodic sync queue flush interval |
| `TRACKING_TIMEOUT_MS` | 1600 | Stale tracking timeout |
| `COUNTDOWN_SECONDS` | 3 | Pre-session countdown duration |
| `PREVIEW_STALE_FRAME_LIMIT` | 10 | Frames without pose before showing "no pose" |

---

## Related Files

| File | Role |
|---|---|
| `src/app/coach/page.tsx` | Session state machine, camera init, pose loop, save logic |
| `src/components/coach/CoachExperienceView.tsx` | UI rendering for all session states |
| `src/lib/pose/PoseEngine2.ts` | MediaPipe wrapper, landmark detection |
| `src/lib/coach/validator.ts` | Exercise-specific rep counting and cue generation |
| `src/lib/coach/cueCadence.ts` | Cue rotation timing and deduplication |
| `src/lib/coach/framing.ts` | Pre-session framing guidance based on visibility/FPS |
| `src/lib/offline/syncQueue.ts` | IndexedDB write queue for offline persistence |

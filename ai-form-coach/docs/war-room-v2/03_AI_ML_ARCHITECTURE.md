# AI Form Coach — AI/ML Architecture
**Version:** 1.0 | **Status:** War Room Active | **Date:** March 2026
**Owner:** Staff AI/ML Engineer | **Reviewed by:** Tech Lead

---

## 1. ML Philosophy for MVP

The ML stack is governed by three principles:

1. **On-device only in the live coaching path.** No cloud inference, no video upload. Privacy is a core product promise and also eliminates per-inference cost.
2. **Don't change the detector during MVP.** MediaPipe Pose Landmarker is already integrated, meets the performance budget, and has future headroom. The benchmark harness must prove it fails before switching.
3. **Rule-based cue logic is sufficient and safer than ML cue logic at MVP.** Neural cue classifiers require labeled data we don't have. Deterministic rules are auditable, testable by the wellness consultant, and can be tuned without retraining.

Post-MVP ML expansions (multimodal reasoning, voice AI, injury prediction) have defined provider boundaries but are disabled in beta.

---

## 2. Pose Estimation Layer

### 2.1 Model: MediaPipe Pose Landmarker

| Property | Value |
|---|---|
| Model variant | Pose Landmarker Lite (MVP launch) |
| Landmark count | 33 3D world landmarks |
| Additional outputs | Visibility score (0–1) per landmark, presence score |
| Inference mode | `VIDEO` (synchronous per-frame; LIVE_STREAM migration planned Phase 1) |
| Acceleration | WebGL (MediaPipe default in browser) |
| Model size | ~5MB (Lite), ~25MB (Full) |
| Typical mobile latency | 12–25ms (Lite), 20–40ms (Full) |
| World landmark coordinates | Camera-centric metric scale (meters) |

**Lite vs Full decision rule:**
- Ship with **Lite** at launch (lower latency, simpler performance budget)
- Benchmark harness must test Full on target devices
- Switch to **Full only if** Lite produces >15% rep counting errors in benchmark across squat/pushup/plank
- Never switch based on visual inspection alone — only benchmark data

### 2.2 Initialization

```typescript
// src/lib/coach/posePipeline.ts
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

let landmarker: PoseLandmarker | null = null;

export async function initPoseLandmarker(): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/pose_landmarker_lite.task',  // cached via Service Worker
      delegate: 'GPU',  // falls back to CPU automatically
    },
    runningMode: 'VIDEO',  // Phase 1: migrate to LIVE_STREAM for async callback + frame dropping
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,  // not needed, saves compute
  });

  return landmarker;
}

// Frame processing — called per requestAnimationFrame
export function processFrame(
  videoElement: HTMLVideoElement,
  timestamp: number,
  onResult: (result: PoseLandmarkerResult) => void
): void {
  if (!landmarker) return;
  landmarker.detectForVideo(videoElement, timestamp, onResult);
}
```

### 2.3 Landmark Index Reference

MediaPipe provides 33 landmarks. The fitness skeleton uses a subset mapped to COCO-17 naming:

| FitnessJointName | MediaPipe Index | Notes |
|---|---|---|
| nose | 0 | Used for head presence only |
| left_shoulder | 11 | |
| right_shoulder | 12 | |
| left_elbow | 13 | |
| right_elbow | 14 | |
| left_wrist | 15 | |
| right_wrist | 16 | |
| left_hip | 23 | |
| right_hip | 24 | |
| left_knee | 25 | |
| right_knee | 26 | |
| left_ankle | 27 | |
| right_ankle | 28 | |
| left_heel | 29 | |
| right_heel | 30 | |
| left_foot_index | 31 | |
| right_foot_index | 32 | |
| **neck** | derived | midpoint(left_shoulder, right_shoulder) |
| **pelvis_center** | derived | midpoint(left_hip, right_hip) |
| **torso_center** | derived | midpoint(neck, pelvis_center) |

**Excluded from public overlay:** Landmarks 0–10 (face/head chain: nose, eyes, ears, mouth). Head rendered as a single center dot for framing guidance only.

---

## 3. Landmark Normalization & Smoothing

### 3.1 EMA Smoothing (Current Implementation)

The codebase uses **Exponential Moving Average (EMA)** with alpha=0.65 for landmark smoothing. This is simpler and faster than One Euro Filter (~0.1ms vs ~0.3ms per frame), and sufficient for dynamic rep-based exercises (squat, pushup).

```typescript
// src/lib/pose/engine.ts — PoseEngine2
// EMA smoothing applied per landmark coordinate
const EMA_ALPHA = 0.65;  // higher = more responsive, lower = smoother

function emaSmooth(current: number, previous: number): number {
  return EMA_ALPHA * current + (1 - EMA_ALPHA) * previous;
}

// Applied per landmark per coordinate (x, y, z)
// Reset on exercise change
```

**Why EMA over One Euro Filter (for now):**
- Simpler implementation, easier to debug
- ~3x faster per frame
- Sufficient for dynamic exercises where the user is in constant motion
- One Euro Filter's adaptive smoothing (low jitter at rest, responsive during movement) becomes important for **hold-based exercises** (plank holds, yoga poses) — evaluate when building STILL or extending plank detection

**Phase 3+ consideration:** Evaluate One Euro Filter for hold-based exercises where visible jitter at rest degrades UX. The filter's adaptive cutoff frequency provides superior smoothing during static holds while maintaining responsiveness during transitions.

**Never share filter state across exercises** — reset on exercise select

### 3.2 Normalization

```typescript
// src/lib/coach/poseNormalizer.ts
export function normalizePose(raw: RawPose33): NormalizedPose {
  const { landmarks, worldLandmarks } = raw;

  // Use world landmarks for angle calculation (metric scale, camera-independent)
  // Use screen landmarks for overlay rendering (pixel/normalized screen space)

  const leftShoulder = worldLandmarks[11];
  const rightShoulder = worldLandmarks[12];
  const leftHip = worldLandmarks[23];
  const rightHip = worldLandmarks[24];

  const neck = midpoint3D(leftShoulder, rightShoulder);
  const pelvisCenter = midpoint3D(leftHip, rightHip);
  const torsoCenter = midpoint3D(neck, pelvisCenter);

  // Hip-to-ankle normalization: scale using lower body segment length
  // Rationale: superior for lower-body exercises (squat, lunge) because it scales
  // with the measured body segment. Torso-length normalization breaks when users
  // lean forward (squat bottom position visually shortens the torso).
  const leftAnkle = worldLandmarks[27];
  const rightAnkle = worldLandmarks[28];
  const ankleCenter = midpoint3D(leftAnkle, rightAnkle);
  const hipToAnkle = distance3D(pelvisCenter, ankleCenter);
  const scale = hipToAnkle > 0.01 ? 1 / hipToAnkle : 1;

  return {
    screenLandmarks: landmarks,        // unnormalized, for overlay
    worldLandmarks: worldLandmarks,    // for angle calculation
    derivedJoints: { neck, pelvisCenter, torsoCenter },
    torsoLengthMeters: torsoLength,
    normalizedScale: scale,
    timestamp: raw.timestamp,
  };
}

function midpoint3D(a: Landmark3D, b: Landmark3D): Landmark3D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}
```

---

## 4. Motion Feature Extraction

### 4.1 Joint Angle Calculation

Joint angles are calculated using the **law of cosines** on three 3D world landmarks (proximal, joint, distal):

```typescript
// src/lib/coach/motionFeatures.ts
export function calculateAngle(
  proximal: Landmark3D,
  joint: Landmark3D,
  distal: Landmark3D
): number {
  const v1 = subtract3D(proximal, joint);
  const v2 = subtract3D(distal, joint);
  const dot = dotProduct3D(v1, v2);
  const mag = magnitude3D(v1) * magnitude3D(v2);
  if (mag < 1e-6) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI);
}

// Always use world landmarks (metric, camera-angle invariant)
// Never use screen landmarks for angle calculation
```

### 4.2 Exercise-Specific Angle Map

**Squat:**
| Angle Name | Landmarks (proximal, joint, distal) | Significance |
|---|---|---|
| `leftKneeAngle` | left_hip, left_knee, left_ankle | Depth primary signal |
| `rightKneeAngle` | right_hip, right_knee, right_ankle | Depth + symmetry |
| `leftHipAngle` | left_shoulder, left_hip, left_knee | Forward lean |
| `rightHipAngle` | right_shoulder, right_hip, right_knee | Forward lean |
| `trunkForwardLean` | neck, pelvis_center, (vertical) | Back angle |
| `kneeValgus` | derived from knee/ankle lateral displacement | Knee cave signal |

**Pushup:**
| Angle Name | Landmarks | Significance |
|---|---|---|
| `leftElbowAngle` | left_shoulder, left_elbow, left_wrist | Depth primary |
| `rightElbowAngle` | right_shoulder, right_elbow, right_wrist | Depth |
| `bodyAlignment` | neck, pelvis_center, left_ankle | Plank position |
| `shoulderAngle` | neck, left_shoulder, left_elbow | Elbow flare |

**Plank:**
| Angle Name | Landmarks | Significance |
|---|---|---|
| `hipHeight` | neck, pelvis_center, left_ankle | Hip sag/pike |
| `shoulderStack` | neck, left_shoulder, left_wrist | Shoulder over wrist |
| `spinalAlignment` | neck, torso_center, pelvis_center | Back flatness |

### 4.3 Rep State Machine

Each exercise has a deterministic READY → DOWN → UP state machine with exercise-specific thresholds and hysteresis to prevent false triggers:

```typescript
// src/lib/coach/repStateMachine.ts
type RepState = 'READY' | 'DOWN' | 'UP';

const REP_THRESHOLDS: Record<Exercise, RepThresholds> = {
  squat: {
    // Knee angle (both knees avg)
    downThreshold: 100,   // degrees — enter DOWN state below this
    upThreshold: 155,     // degrees — enter UP state above this (with hysteresis)
    readyThreshold: 160,  // degrees — must reach before counting rep
    primaryAngle: 'avgKneeAngle',
  },
  pushup: {
    // Elbow angle (both elbows avg)
    downThreshold: 90,
    upThreshold: 145,
    readyThreshold: 155,
    primaryAngle: 'avgElbowAngle',
  },
  plank: {
    // Hip height deviation — rep counting not primary (time-based instead)
    // State machine tracks hold quality, not reps
    holdQualityThreshold: 15,  // degrees hip deviation = break in form
    primaryAngle: 'hipHeight',
  },
};

export function updateRepState(
  current: RepState,
  angles: MotionAngles,
  exercise: Exercise,
  repCount: number
): { newState: RepState; repCompleted: boolean } {
  const { primaryAngle, downThreshold, upThreshold, readyThreshold } =
    REP_THRESHOLDS[exercise];
  const angle = angles[primaryAngle];
  let newState = current;
  let repCompleted = false;

  switch (current) {
    case 'READY':
      if (angle < downThreshold) newState = 'DOWN';
      break;
    case 'DOWN':
      if (angle > upThreshold) newState = 'UP';
      break;
    case 'UP':
      if (angle > readyThreshold) {
        newState = 'READY';
        repCompleted = true;
      } else if (angle < downThreshold) {
        // Incomplete rep — started next without finishing
        newState = 'DOWN';
      }
      break;
  }

  return { newState, repCompleted };
}
```

### 4.4 Form Score Calculation

Per-rep form score (0–100) is a weighted average of exercise-specific signals:

```typescript
// src/lib/coach/formScore.ts
type FormScoreWeights = Record<string, number>;

const SQUAT_WEIGHTS: FormScoreWeights = {
  kneeDepth: 0.30,        // did they reach parallel?
  kneeTracking: 0.25,     // knee over toe alignment
  backAngle: 0.25,        // minimal forward lean
  symmetry: 0.20,         // left/right balance
};

const PUSHUP_WEIGHTS: FormScoreWeights = {
  elbowDepth: 0.30,       // chest near floor
  bodyAlignment: 0.30,    // plank position maintained
  elbowFlare: 0.20,       // elbow angle to body
  symmetry: 0.20,
};

const PLANK_WEIGHTS: FormScoreWeights = {
  hipHeight: 0.40,        // hips level (not sagging/piking)
  shoulderStack: 0.35,    // shoulders over wrists
  spinalAlignment: 0.25,  // flat back
};

export function calculateFormScore(
  angles: MotionAngles,
  exercise: Exercise
): number {
  // Returns 0–100 where 100 = perfect form based on ideal angle ranges
  // Each component is scored 0–100, then weighted sum
  // Visibility-gated: if key landmark visibility < 0.5, that component = 50 (neutral)
  // ...
}
```

---

## 5. Cue Engine

### 5.1 Architecture

The cue engine is a **rule-based priority system** — not ML. All rules are human-authored and wellness-consultant-reviewed.

```typescript
// src/lib/coach/cueEngine.ts
type CueRule = {
  id: string;
  exercise: Exercise;
  condition: (features: MotionFeatures) => boolean;
  priority: 'safety' | 'correction' | 'encouragement';
  suppressWindowMs: number;
  cue: CueTrigger;
};

// Global state per session
type CueEngineState = {
  lastCuedAt: Record<string, number>;   // cueId → timestamp
  lastAnyCueAt: number;                  // suppress all cues if too recent
  consecutiveBadReps: number;
  consecutiveGoodReps: number;
};

const GLOBAL_CUE_COOLDOWN_MS = 3000;   // no cue more frequent than once per 3s (DEFAULT_COOLDOWN)
const SAFETY_CUE_COOLDOWN_MS = 2000;   // safety cues have 2s minimum floor

export function evaluateCues(
  features: MotionFeatures,
  state: CueEngineState,
  exercise: Exercise,
  now: number
): CueTrigger | null {
  const rules = CUE_RULES[exercise];
  const globalCooldownOk = (now - state.lastAnyCueAt) > GLOBAL_CUE_COOLDOWN_MS;

  // Safety cues bypass global cooldown
  for (const rule of rules.filter(r => r.priority === 'safety')) {
    if (rule.condition(features) && canTrigger(rule, state, now, SAFETY_CUE_COOLDOWN_MS)) {
      return rule.cue;
    }
  }

  if (!globalCooldownOk) return null;

  // Correction cues (highest non-safety priority)
  for (const rule of rules.filter(r => r.priority === 'correction')) {
    if (rule.condition(features) && canTrigger(rule, state, now, rule.suppressWindowMs)) {
      return rule.cue;
    }
  }

  // Encouragement (only after N consecutive good reps)
  if (features.consecutiveGoodReps >= 3) {
    for (const rule of rules.filter(r => r.priority === 'encouragement')) {
      if (rule.condition(features) && canTrigger(rule, state, now, rule.suppressWindowMs)) {
        return rule.cue;
      }
    }
  }

  return null;
}
```

### 5.2 Squat Cue Rules (MVP Set)

| Rule ID | Trigger Condition | Cue Text | Priority |
|---|---|---|---|
| `squat_depth_low` | `avgKneeAngle > 120` on DOWN state | "Go a little deeper" | correction |
| `squat_knee_cave` | `kneeValgus > 15°` | "Push your knees out" | safety |
| `squat_lean_forward` | `trunkForwardLean > 45°` | "Chest up, stand tall" | correction |
| `squat_good_depth` | `avgKneeAngle < 95°` and form score > 75 | "Great depth!" | encouragement |
| `squat_weight_heels` | `ankleAngle < 60°` | "Weight in your heels" | correction |
| `squat_ready_start` | session start | "Feet shoulder-width apart" | correction |

### 5.3 Pushup Cue Rules (MVP Set)

| Rule ID | Trigger Condition | Cue Text | Priority |
|---|---|---|---|
| `pushup_depth_low` | `avgElbowAngle > 110` on DOWN | "Lower your chest" | correction |
| `pushup_hip_sag` | `bodyAlignment > 20°` | "Tighten your core" | safety |
| `pushup_hip_pike` | `bodyAlignment < -20°` | "Lower your hips" | correction |
| `pushup_elbow_flare` | `shoulderAngle > 60°` | "Elbows closer to body" | correction |
| `pushup_neck_forward` | `neckAngle > 25°` | "Keep your neck neutral" | correction |
| `pushup_good_form` | formScore > 80 and rep completed | "Nice rep!" | encouragement |

### 5.4 Plank Cue Rules (MVP Set)

| Rule ID | Trigger Condition | Cue Text | Priority |
|---|---|---|---|
| `plank_hip_sag` | `hipHeight < -15°` | "Lift your hips" | safety |
| `plank_hip_pike` | `hipHeight > 20°` | "Lower your hips slightly" | correction |
| `plank_shoulder_drift` | `shoulderStack > 10°` | "Stack shoulders over wrists" | correction |
| `plank_hold_strong` | formScore > 75 at 30s mark | "Halfway — stay strong" | encouragement |
| `plank_breathe` | 15s into hold (first time only) | "Remember to breathe" | correction |

---

## 6. Overlay Renderer

### 6.1 Canvas2D Rendering

```typescript
// src/lib/coach/overlayRenderer.ts
const SKELETON_CONNECTIONS: [FitnessJointName, FitnessJointName][] = [
  ['neck', 'left_shoulder'],   ['neck', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],['right_elbow', 'right_wrist'],
  ['neck', 'torso_center'],    ['torso_center', 'pelvis_center'],
  ['pelvis_center', 'left_hip'],    ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['pelvis_center', 'right_hip'],   ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

export function renderSkeleton(
  ctx: CanvasRenderingContext2D,
  skeleton: FitnessSkeleton17 & DerivedJoints,
  activeSegments: FitnessJointName[],  // segments receiving cue (highlighted)
  formScore: number,
  videoWidth: number,
  videoHeight: number
): void {
  ctx.clearRect(0, 0, videoWidth, videoHeight);

  // Draw connections
  for (const [a, b] of SKELETON_CONNECTIONS) {
    const jointA = skeleton.joints[a];
    const jointB = skeleton.joints[b];
    if (!jointA || !jointB) continue;
    if ((jointA.visibility ?? 1) < 0.3 || (jointB.visibility ?? 1) < 0.3) continue;

    const isActive = activeSegments.includes(a) || activeSegments.includes(b);
    ctx.beginPath();
    ctx.moveTo(jointA.x * videoWidth, jointA.y * videoHeight);
    ctx.lineTo(jointB.x * videoWidth, jointB.y * videoHeight);
    ctx.strokeStyle = isActive ? '#FF6B6B' : getColorForScore(formScore);
    ctx.lineWidth = isActive ? 4 : 2;
    ctx.stroke();
  }

  // Draw joints
  for (const [name, joint] of Object.entries(skeleton.joints)) {
    if ((joint.visibility ?? 1) < 0.3) continue;
    const isActive = activeSegments.includes(name as FitnessJointName);
    ctx.beginPath();
    ctx.arc(joint.x * videoWidth, joint.y * videoHeight, isActive ? 8 : 5, 0, 2 * Math.PI);
    ctx.fillStyle = isActive ? '#FF6B6B' : '#FFFFFF';
    ctx.fill();
  }
}

function getColorForScore(score: number): string {
  if (score >= 80) return '#4CAF50';  // green
  if (score >= 60) return '#FFC107';  // amber
  return '#FF5722';                    // orange-red
}

// Performance target: entire renderSkeleton() completes in ≤4ms
// Measured via performance.now() in development
```

---

## 7. Performance Budget & Monitoring

### 7.1 Frame Budget Breakdown (16.67ms @ 60 FPS)

| Stage | Budget | Typical |
|---|---|---|
| Camera frame capture | ~2ms | ~1ms |
| MediaPipe detection | ≤25ms (async, non-blocking) | 12–20ms |
| EMA smoothing (per landmark) | ~0.2ms | ~0.1ms |
| Normalization + DerivedJoints | ~0.3ms | ~0.2ms |
| Motion feature extraction | ~1ms | ~0.5ms |
| Cue engine evaluation | ~0.5ms | ~0.2ms |
| Canvas2D render | ≤4ms | ~1–2ms |
| **Total render thread** | **≤8ms** | **~4ms** |

**Note:** Current implementation uses VIDEO mode (synchronous). MediaPipe processes the frame synchronously per `requestAnimationFrame` call. Phase 1 migration to LIVE_STREAM mode will make detection truly async. The render thread handles normalization → cue → overlay only.

### 7.2 Performance Instrumentation

```typescript
// src/lib/coach/performanceMonitor.ts
export class PerformanceMonitor {
  private frameTimings: number[] = [];
  private dropCount: number = 0;
  private totalFrames: number = 0;

  recordFrame(durationMs: number): void {
    this.totalFrames++;
    this.frameTimings.push(durationMs);
    if (durationMs > 33) this.dropCount++;  // >2 frames = drop
    if (this.frameTimings.length > 300) this.frameTimings.shift();  // 5s window
  }

  getMetrics(): PerformanceMetrics {
    const sorted = [...this.frameTimings].sort((a, b) => a - b);
    return {
      medianMs: sorted[Math.floor(sorted.length / 2)] ?? 0,
      p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      frameDropRate: this.totalFrames > 0 ? this.dropCount / this.totalFrames : 0,
    };
  }
}
```

### 7.3 Benchmark Harness (Real Device Validation)

The `DEVICE_VALIDATION_RUNBOOK.md` specifies test cases. Each must be run manually on physical devices:

| Test Case | Device | Pass Criterion |
|---|---|---|
| Good lighting, full body visible | iPhone Safari | Median ≤25ms, drops <10% |
| Good lighting, full body visible | Android Chrome | Median ≤25ms, drops <10% |
| Poor lighting (dim room) | Both | Graceful degradation + framing cue |
| Partial occlusion (hands cut off) | Both | No crash, reduced but stable tracking |
| Fast reps (>1/sec) | Both | Rep counting accuracy >90% |
| Slow reps (<0.3/sec) | Both | No phantom reps |
| 60-second continuous session | Both | Drop rate <10% end-to-end |

---

## 8. Post-MVP AI Provider Roadmap

### 8.1 When to Consider Adding Cloud AI

Triggers that justify revisiting the disabled providers:

| Provider | Enable When | Candidate Tech |
|---|---|---|
| `VisionReasoningProvider` | Beta metrics show ≥20% "poor form" false positives from rule engine | Qwen3-VL, MiniCPM-V (self-hosted) |
| `TextPlanningProvider` | Post-MVP progressive programming feature | OpenAI API, Claude API |
| `VoiceSynthesisProvider` | Branded voice becomes key differentiator (>50% users prefer it) | CosyVoice, ElevenLabs |

### 8.2 Model Evaluation Criteria (If Needed)

Before any model addition, it must pass:
1. Latency: p95 end-to-end cue latency still ≤300ms (total including model)
2. Privacy: No video frames transmitted (if cloud model, only feature vectors)
3. Cost: Inference cost per MAU <$0.02/mo at 10K users
4. Safety: Output safety review by wellness consultant before deployment

---

## 9. Known Limitations & Mitigation

| Limitation | Impact | Mitigation |
|---|---|---|
| MediaPipe accuracy drops in poor lighting | Form score unstable, more cue noise | Device readiness check warns user; lighting guidance in framing stage |
| 2D screen landmarks can't resolve depth ambiguity | Knee valgus estimation may be imprecise in some camera angles | Use world landmarks for angle calc; document limitation in terms |
| Plank is hard to detect without side view | Shoulder stack measurement limited in front-facing camera | Plank framing guide specifies side profile; front view shows hip height only |
| iOS Safari camera permission resets | User friction on each session | Persist stream across route transitions; clear UX explanation at permission prompt |
| EMA smoothing has fixed alpha tradeoff | At alpha=0.65, slightly more jitter than adaptive filters during holds | Acceptable for dynamic exercises; evaluate One Euro Filter for hold-based exercises in Phase 3+ |

---

_Maintained by Staff AI/ML Engineer. Model changes require benchmark data, wellness consultant sign-off on cue changes, and Tech Lead approval. No live-path model changes without passing the full performance benchmark harness._

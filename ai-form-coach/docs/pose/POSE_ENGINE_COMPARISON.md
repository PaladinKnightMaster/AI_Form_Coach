# 🔄 Pose Engine Comparison: V1 vs V2

## Overview

**Old:** `PoseEngine` (src/lib/pose/index.ts)  
**New:** `PoseEngine2` (src/lib/pose/engine.ts)

---

## 📊 Feature Comparison

| Feature | PoseEngine (V1) | PoseEngine2 (V2) | Winner |
|---------|----------------|------------------|---------|
| **EMA Smoothing** | ✅ Yes (alpha=0.5) | ✅ Yes (alpha=0.4, configurable) | V2 - More configurable |
| **Visibility Gating** | ❌ No | ✅ Yes (threshold=0.55) | **V2 - NEW** |
| **Left/Right Auto-Switch** | ❌ No | ✅ Yes | **V2 - NEW** |
| **Temporal Debounce** | ❌ No | ✅ Yes (3 frames) | **V2 - NEW** |
| **FPS Tracking** | ✅ Simple | ✅ Rolling window (30 frames) | V2 - More accurate |
| **Console Suppression** | ✅ Yes | ✅ Yes | Tie |
| **Resource Management** | ⚠️ Basic | ✅ Full dispose() | V2 - Better |
| **API Design** | Observer pattern | Direct async calls | V2 - Simpler |
| **Type Safety** | ⚠️ Basic | ✅ Comprehensive | V2 - Better |
| **Normalization** | ❌ No | ✅ Yes (separate module) | **V2 - NEW** |
| **Robust Angles** | ❌ No | ✅ Yes | **V2 - NEW** |

---

## 🎯 Key Improvements in V2

### 1. **Visibility Gating** ⭐ CRITICAL
**Problem in V1:** Accepts all frames, even when user is partially out of frame  
**Solution in V2:** Calculates visibility score, rejects frames < 0.55  
**Benefit:** Prevents FSM from transitioning based on bad data

```typescript
// V1: No visibility check
const curr = result.landmarks[0].map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }));
// Always uses this data ❌

// V2: Visibility gating
const visibilityScore = this.calculateVisibilityScore(rawLandmarks);
if (visibilityScore < this.visibilityThreshold) {
  // Don't update smoothing state on low-visibility frames ✅
  return {...};
}
```

### 2. **Left/Right Auto-Switch** ⭐ CRITICAL
**Problem in V1:** No automatic side selection for bilateral exercises  
**Solution in V2:** Calculates left/right visibility, picks better side  
**Benefit:** Always uses the more visible side for accurate angle measurements

```typescript
// V2: Auto-selects best side
const leftVisibility = this.calculateSideVisibility(smoothedLandmarks, 'left');
const rightVisibility = this.calculateSideVisibility(smoothedLandmarks, 'right');
const bestSide: BestSide = leftVisibility > rightVisibility ? 'left' : 'right';
```

### 3. **Temporal Debounce** ⭐ CRITICAL
**Problem in V1:** FSM can jitter on single bad frames  
**Solution in V2:** Requires 3 consecutive valid frames for phase changes  
**Benefit:** Stable FSM transitions, no flickering

```typescript
// V2: Debounced phase changes
if (engine.canTransitionPhase()) {
  // Safe to transition ✅
  fsm.transition();
  engine.resetDebounce();
}
```

### 4. **Perspective Normalization** ⭐ NEW
**Problem in V1:** Angles affected by camera distance/angle  
**Solution in V2:** Normalizes based on mid-hip and hip-ankle distance  
**Benefit:** Consistent measurements regardless of camera position

```typescript
// V2: normalize.ts
const normalized = normalizeForPerspective(landmarks);
// Scale and center independent ✅
```

### 5. **Robust Angle Calculations** ⭐ NEW
**Problem in V1:** Manual angle calculation in validators  
**Solution in V2:** Automatic best-side angle selection  
**Benefit:** More reliable, less code duplication

```typescript
// V2: normalize.ts
const angles = getRobustAngles(result);
// Automatically uses bestSide ✅
```

---

## 🔧 API Differences

### Initialization

```typescript
// V1: Global singleton
await initPose('lite');
const engine = new PoseEngine(video, 0.5);
engine.start();

// V2: Instance-based
const engine = new PoseEngine2({ model: 'lite', smoothingAlpha: 0.4 });
await engine.init();
```

### Getting Landmarks

```typescript
// V1: Observer pattern
engine.subscribe((landmarks) => {
  if (landmarks) {
    // Use landmarks
  }
});

// V2: Direct async
const result = await engine.estimate(video);
if (result && result.visibilityScore > 0.55) {
  // Use result.landmarks
  // Also get: fps, bestSide, leftVisibility, rightVisibility
}
```

### Cleanup

```typescript
// V1: Basic stop
engine.stop();

// V2: Full disposal
engine.dispose(); // Cleans up landmarker + state
```

---

## 📋 Migration Strategy

### ✅ Recommended: Replace V1 with V2

**Why?**
1. V2 has ALL features of V1 + new critical features
2. V2 fixes fundamental accuracy issues
3. V2 has better type safety
4. V2 has cleaner API
5. No need to maintain two engines

**Migration Steps:**
1. ✅ Create V2 (DONE)
2. ✅ Create normalize.ts (DONE)
3. Update coach page to use V2
4. Update validators to use robust angles
5. Delete old PoseEngine from index.ts
6. Keep `initPose()` and `estimate()` functions for backward compatibility (if needed)

---

## 🗑️ What to Keep from V1?

### Keep (as utility functions):
```typescript
// In src/lib/pose/index.ts (refactor to utils)
export { initPose, estimate }; // Low-level MediaPipe wrappers
export type { PoseModel, SmoothedLandmark }; // Types
```

### Delete:
```typescript
// Remove from src/lib/pose/index.ts
export class PoseEngine { ... } // ❌ Delete - replaced by PoseEngine2
```

---

## 📊 Impact Analysis

### Files That Use Old PoseEngine:

1. **src/app/coach/page.tsx**
   - Currently: `new PoseEngine(video)`
   - Change to: `new PoseEngine2()`
   - Impact: Need to update landmark subscription to async pattern

2. **Validators (squat.ts, pushup.ts, plank.ts)**
   - Currently: Manual angle calculations
   - Change to: Use `getRobustAngles()` from normalize.ts
   - Impact: Simpler, more reliable code

### Breaking Changes:
- ❌ Observer pattern removed (use async/await instead)
- ✅ All other functionality preserved or enhanced

---

## 🎯 Recommendation

**✅ YES, delete old PoseEngine and use PoseEngine2**

**Reasons:**
1. V2 is strictly better in every way
2. No compelling reason to keep V1
3. Maintaining two engines is technical debt
4. V2 fixes critical accuracy issues

**Action Plan:**
1. Migrate coach page to V2 ✅ Next step
2. Update validators to use robust angles
3. Test thoroughly
4. Delete old PoseEngine class
5. Keep utility functions (`initPose`, `estimate`) if needed elsewhere

---

## 💡 Summary

| Aspect | V1 | V2 |
|--------|----|----|
| **Accuracy** | Good | **Excellent** ⭐ |
| **Stability** | Moderate | **High** ⭐ |
| **Features** | Basic | **Advanced** ⭐ |
| **API** | Observer | **Async/Await** ⭐ |
| **Maintainability** | Okay | **Better** ⭐ |
| **Type Safety** | Basic | **Strong** ⭐ |

**Verdict:** V2 is a clear upgrade. Proceed with migration! 🚀



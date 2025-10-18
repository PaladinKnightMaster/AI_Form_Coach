# PoseEngine2 Integration - Current Status

## ✅ Completed Steps

### 1. Core Files Created
- ✅ `src/lib/pose/engine.ts` - PoseEngine2 class with all features
- ✅ `src/lib/pose/normalize.ts` - Normalization and robust angles
- ✅ `POSE_ENGINE_COMPARISON.md` - Detailed comparison document

### 2. Coach Page - Partial Integration
- ✅ Updated imports (PoseEngine2, Landmark3D, getRobustAngles)
- ✅ Added new state variables (visibilityScore, bestSide, poseLoopRef)
- ✅ Changed engineRef type to `PoseEngine2`
- ✅ Changed landmarks type to `Landmark3D[]`

## 🔄 In Progress

### 3. Coach Page - Remaining Work

#### A. Initialization Logic (lines 231-257)
**Current:** Uses old PoseEngine with observer pattern
```typescript
const engine = new PoseEngine(video);
engine.subscribe(onPose);
engine.subscribeStats(({ fps }) => setFps(fps));
```

**Needs:** Replace with PoseEngine2 and async loop
```typescript
const engine = new PoseEngine2({ smoothingAlpha: 0.4 });
await engine.init();
engineRef.current = engine;
// Start async pose loop
```

#### B. Pose Estimation Loop (NEW)
**Needs:** Create new async loop to replace observer pattern
- Call `engine.estimate(video)` in loop
- Check `result.visibilityScore`
- Auto-pause on low visibility
- Update FPS from `result.fps`
- Call onPose with landmarks

#### C. onPose Handler (lines 288-322)
**Current:** Accepts `SmoothedLandmark[]`
**Needs:** 
- Accept `Landmark3D[]`
- Use `visibilityScore` from parent (passed as param or state)
- Validators already work with landmarks (minimal changes)

#### D. Running State Effect (lines 259-278)
**Current:** Calls `engine.start()` and `engine.stop()`
**Needs:**
- Start/stop async pose loop
- Handle poseLoopRef cancellation

#### E. Visibility UI (NEW)
**Needs:** Add UI indicator for low visibility
- Display when `visibilityScore < 0.55`
- Show "Step back / Improve lighting" message
- Maybe show visibility percentage

## 📋 Detailed Integration Plan

### Step 3a: Replace Initialization
```typescript
// OLD (line 231-257)
await initPose(cached ?? 'lite');
const engine = new PoseEngine(video);
engineRef.current = engine;
engine.subscribe(onPose);
engine.subscribeStats(({ fps }) => setFps(fps));

// NEW
const engine = new PoseEngine2({
  model: (cached as 'lite' | 'full') ?? 'lite',
  smoothingAlpha: 0.4,
  visibilityThreshold: 0.55,
  debounceFrames: 3
});
await engine.init();
engineRef.current = engine;
```

### Step 3b: Create Pose Loop
```typescript
// NEW function to add
const startPoseLoop = () => {
  const loop = async () => {
    const video = videoRef.current;
    const engine = engineRef.current;
    
    if (!video || !engine) return;
    
    const result = await engine.estimate(video);
    
    if (result) {
      setVisibilityScore(result.visibilityScore);
      setBestSide(result.bestSide);
      setFps(result.fps);
      
      // Visibility gating
      if (result.visibilityScore >= 0.55) {
        onPose(result.landmarks, result);
      } else {
        // Low visibility - don't process frame
        lowQualityFramesRef.current++;
      }
    }
    
    // Continue loop
    if (running) {
      poseLoopRef.current = requestAnimationFrame(loop);
    }
  };
  
  loop();
};
```

### Step 3c: Update onPose Signature
```typescript
// OLD
function onPose(lms: SmoothedLandmark[] | null) {
  if (!lms) return;
  const vis = lms.map(l => (l.visibility ?? 0));
  const avgVis = vis.reduce((a, b) => a + b, 0) / Math.max(1, vis.length);
  // ...
}

// NEW
function onPose(lms: Landmark3D[], result: PoseEstimateResult) {
  const ts = performance.now();
  const avgVis = result.visibilityScore;
  
  // Rest of logic mostly unchanged
  // Validators work with Landmark3D[]
}
```

### Step 3d: Update Running Effect
```typescript
// OLD (lines 259-278)
useEffect(() => {
  if (running) {
    engineRef.current?.start();
  } else {
    engineRef.current?.stop();
  }
}, [running]);

// NEW
useEffect(() => {
  if (running) {
    startPoseLoop();
  } else {
    if (poseLoopRef.current) {
      cancelAnimationFrame(poseLoopRef.current);
      poseLoopRef.current = null;
    }
  }
}, [running]);
```

### Step 3e: Add Visibility Warning UI
```typescript
// Add after line 373 in the video overlay section
{visibilityScore < 0.55 && (
  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
    <div className="flex items-center gap-2">
      <Icon name="alert-triangle" className="w-5 h-5" />
      <span className="font-medium">Step back / Improve lighting</span>
    </div>
    <div className="text-xs mt-1">Visibility: {Math.round(visibilityScore * 100)}%</div>
  </div>
)}
```

## 🎯 Remaining Tasks

- [ ] Replace initialization code
- [ ] Create startPoseLoop function
- [ ] Update onPose function signature
- [ ] Update running state effect
- [ ] Add visibility warning UI
- [ ] Update cleanup logic
- [ ] Test with real workouts
- [ ] Update validators to use robust angles (optional enhancement)

## ⚠️ Considerations

### Breaking Changes
- Observer pattern → Async loop pattern
- `SmoothedLandmark` → `Landmark3D`
- Manual FPS tracking → Built-in FPS

### Backward Compatibility
- Validators work with both types (they accept landmarks array)
- CalibrationModal might need type update
- PoseOverlay works with both types

### Testing Needed
- Camera initialization
- Pose loop performance
- Visibility gating accuracy
- Auto-pause behavior
- FPS stability

## 📊 Complexity Assessment

**Total Changes:** ~100 lines modified, ~50 lines added  
**Risk Level:** Medium (core pose detection logic)  
**Testing Required:** High (affects all workouts)  
**Estimated Time:** 30-45 minutes for careful implementation

## 💡 Recommendation

**Option A:** Complete integration now (30-45 min)
- Finish all remaining tasks in one session
- Test thoroughly
- Commit as complete feature

**Option B:** Commit current progress
- Current state: Types updated, new engine created
- Coach page partially migrated (imports/state done)
- Complete integration in next session

**My Recommendation:** Option A if you have time, quality implementation is worth it!

---

**Current Status:** 40% complete  
**Next Step:** Replace initialization and create pose loop



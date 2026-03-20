# Coach Performance Smoke

## Purpose
- Guard the MVP coach hot path against accidental latency regressions.
- Verify that the stable live-coaching state does not spam React HUD commits during mobile sessions.

## Commands
- `npm run test:perf-smoke`
- `npm run test:release`

## Release Budgets
- Stable hold UI commit ratio: `<= 0.20`
- Scripted coach hot-path average frame compute: `< 4 ms`
- Scripted coach hot-path p95 frame compute: `< 8 ms`
- Scripted coach hot-path p99 frame compute: `< 20 ms`

## Coverage
- Squat single rep
- Pushup single rep
- Plank short hold
- Squat visibility recovery
- Stable squat hold for commit-throttle validation

## Notes
- This smoke runs the deterministic MVP coach hot path: pose reduction, derived joints, motion features, framing guidance, validator pass, and live UI commit policy.
- It does not measure MediaPipe inference on real hardware. Real Android Chrome and iPhone Safari device validation still stays in the final MVP stage.
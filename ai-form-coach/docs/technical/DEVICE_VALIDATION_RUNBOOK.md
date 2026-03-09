# Device Validation Runbook

## Scope
- Public MVP surface: `/coach` only
- Required phones: iPhone Safari and Android Chrome
- Goal: validate permission UX, framing clarity, cue readability, and session completion on real hardware

## Preflight
- Use a clean beta account with no demo data in history
- Confirm the device can grant camera access in the browser
- Use the front camera, portrait orientation, and stable indoor lighting
- Verify the coach page shows the device summary and no corrupted text

## Android Chrome Pass
1. Open `/coach` and allow camera access.
2. Confirm the framing guide appears before session start.
3. Start a squat session and verify the mobile tray stays reachable.
4. Pause, resume, end, and save the session.
5. Repeat for pushup and plank.
6. If the camera fails, use the retry button and capture the exact browser permission state.

## iPhone Safari Pass
1. Open `/coach` in Safari and grant camera access for the page.
2. Confirm the top safe area, stage, and bottom tray all remain visible.
3. Start a squat session and verify cue text remains readable during movement.
4. Pause, resume, end, and save the session.
5. Repeat for pushup and plank.
6. If the camera fails, use the retry button and note whether Safari page settings changed the outcome.

## What To Capture
- Device summary shown on the page
- Browser version and OS version
- Whether camera permission was granted, denied, or blocked by another app
- First-session completion result
- Any cue jitter, unreadable text, or stage clipping
- Whether retry camera recovered the stage without reloading

## Telemetry Events To Watch
- `coach-page-view`
- `coach-stage-ready`
- `coach-stage-issue`
- `coach-stage-retry`
- `coach-session-start`
- `coach-session-complete`
- `coach-cue-feedback`

## Exit Criteria
- Camera permission recovery is understandable on both phone lanes
- A first session can be started, paused, resumed, and saved on both phone lanes
- The stage and bottom tray remain visible for the full session
- No blocker is reproducible across both devices without a documented mitigation

## Browser Rehearsal URLs
- `/coach?stage-sim=camera-blocked-once&pose-script=squat-single-rep` validates the blocked-camera recovery path and retry button.
- `/coach?stage-sim=detector-error` validates detector failure copy and recovery guidance.
- `/coach?pose-script=squat-single-rep` validates the normal scripted squat flow without a live camera.
- `/coach?pose-script=pushup-single-rep&exercise=pushup` validates the pushup scripted flow.
- `/coach?pose-script=plank-short-hold&exercise=plank` validates the plank scripted flow.

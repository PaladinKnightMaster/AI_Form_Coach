# MVP Release Checklist

Updated: March 10, 2026

## Release Command

- `npm run test:release`
- This runs the required automated MVP gate in order: `lint`, `test`, `build`, and `test:e2e:coach`.

## Automated Pass Criteria

- Public routes stay limited to the MVP release surface.
- `/coach` boots, starts, pauses, resumes, saves, and records cue feedback in browser automation.
- Deterministic squat, pushup, and plank scripted flows all pass.
- Deterministic recovery flows all pass:
  - blocked camera with retry recovery
  - detector failure guidance
- Public share image builds cleanly and reflects truthful MVP copy.

## Manual Release Checks

- Review `/`, `/pricing`, `/coach`, `/history`, `/privacy`, and `/terms` for truthful copy.
- Confirm no public page claims nutrition AI, food scan, workout plans, readiness, or health integrations.
- Confirm no public page claims fake ratings, fake usage scale, or unsupported platform coverage.
- Confirm `/coach` recovery guide, save notice, and beta-state language read clearly on desktop and mobile viewport emulation.

## Final Device Gate Before Launch

- Run the physical-device checklist in `docs/technical/DEVICE_VALIDATION_RUNBOOK.md`.
- Required hardware pass:
  - Android Chrome
  - iPhone Safari
- Do not mark the MVP release candidate as launch-ready until both physical-device checks pass.

## Rehearsal URLs

- `/coach?pose-script=squat-single-rep`
- `/coach?pose-script=pushup-single-rep&exercise=pushup`
- `/coach?pose-script=plank-short-hold&exercise=plank`
- `/coach?stage-sim=camera-blocked-once&pose-script=squat-single-rep`
- `/coach?stage-sim=detector-error`

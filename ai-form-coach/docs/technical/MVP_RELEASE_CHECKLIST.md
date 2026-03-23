# MVP Release Checklist

Updated: March 20, 2026

## Release Command

- `npm run test:release`
- This is the formal automated MVP gate.
- It runs the required checks in order:
  - `npm run lint`
  - `npm run test`
  - `npm run test:perf-smoke`
  - `npm run build`
  - `npm run test:e2e:release`

## Automated Pass Criteria

- Public routes stay limited to the MVP release surface.
- Disabled legacy routes redirect away from public access.
- Protected MVP routes preserve the intended destination when they send a user to sign in.
- `/signup` opens the combined auth screen in signup mode and preserves redirect intent.
- `/auth/auth-code-error` offers recovery guidance and retry links when callback exchange fails.
- `/coach` boots, frames the user, starts, pauses, resumes, saves, and records cue feedback in browser automation.
- Deterministic squat, pushup, and plank scripted flows all pass.
- Deterministic recovery flows all pass:
  - blocked camera with retry recovery
  - detector failure guidance
- Coach visual baselines pass on desktop, Android mobile, and iPhone mobile layouts.
- Scripted coach hot-path performance stays within the release smoke budgets.
- Public share image metadata builds cleanly through file-based Open Graph and Twitter image routes.

## Manual Release Checks

- Review `/`, `/pricing`, `/coach`, `/history`, `/privacy`, and `/terms` for truthful MVP copy.
- Review `/signin`, `/signup`, `/reset-password`, and `/auth/auth-code-error` for clear and non-corrupted auth copy.
- Confirm no public page claims nutrition AI, food scan, workout plans, readiness, or health integrations.
- Confirm no public page claims fake ratings, fake usage scale, or unsupported platform coverage.
- Confirm `/coach` recovery guide, save notice, setup guidance, and beta-state language read clearly on desktop and mobile viewport emulation.
- Confirm mobile coach HUD does not cover the body area needed for squat, pushup, or plank guidance.

## Final Device Gate Before Launch

- Run the physical-device checklist in `docs/technical/DEVICE_VALIDATION_RUNBOOK.md`.
- Required hardware pass:
  - Android Chrome
  - iPhone Safari
- Do not mark the MVP release candidate as launch-ready until both physical-device checks pass.

## Known Non-Blocking Notes

- Non-MVP routes still compile, but route gating and redirects keep them outside the public beta surface.
- Visual and scripted browser automation do not replace the final real-device trust pass.

## Rehearsal URLs

- `/coach?pose-script=squat-single-rep`
- `/coach?pose-script=pushup-single-rep&exercise=pushup`
- `/coach?pose-script=plank-short-hold&exercise=plank`
- `/coach?stage-sim=camera-blocked-once&pose-script=squat-single-rep`
- `/coach?stage-sim=detector-error`

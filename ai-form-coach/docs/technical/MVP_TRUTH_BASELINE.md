# MVP Truth Baseline

Updated: March 15, 2026

## Launch Surface

- `/`
- `/signin`
- `/signup`
- `/coach`
- `/history`
- `/pricing`
- `/privacy`
- `/terms`

Auth is required for `/coach`, `/history`, and `/session/*`.

## Launch Promise

- Private, on-device motion analysis in the browser
- Live coaching for `squat`, `pushup`, and `plank`
- Session summaries and history for signed-in users
- Free public beta

## Explicitly Out Of Public Beta

- Nutrition AI
- Food scan
- Workout plan generation
- Readiness and health integrations
- Community, challenges, packs, leaderboards, organization features
- Placeholder or demo-backed AI endpoints

## Automated Quality Gates

- `npm run lint`
- `npm run test`
- `npm run test:perf-smoke`
- `npm run build`
- `npm run test:e2e:coach`
- `npm run test:e2e:coach:visual`
- `npm run test:release`

`npm run test:release` is the formal MVP release gate and runs the required automated checks in sequence.

## Manual Launch Gate

- Run the physical-device checklist in `docs/technical/DEVICE_VALIDATION_RUNBOOK.md`
- Required pass devices:
  - Android Chrome
  - iPhone Safari
- Do not mark the MVP release candidate as launch-ready until both physical-device checks pass.

## Code and Docs Rules

- Docs, product copy, and route exposure must match the actual beta surface.
- Public pages must not claim unsupported scale, uptime, ratings, or health/device integrations.
- Live coaching must use the fitness skeleton with `neck` and `pelvis_center`, not facial chains.
- Mobile coach HUD must not obstruct the visible full-body motion area during active sessions.

## Known Non-Blocking Notes

- Non-MVP routes still exist in the repo, but redirects and route gating keep them out of the public beta surface.
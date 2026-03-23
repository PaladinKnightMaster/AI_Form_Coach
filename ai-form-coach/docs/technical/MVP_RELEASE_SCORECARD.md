# MVP Release Scorecard

Updated: March 20, 2026

## Current Recommendation

- Status: `Release candidate in hardening`
- Automated MVP gate: `Pass`
- Physical-device launch gate: `Pending`
- Leadership recommendation: continue final launch prep, but do not call the MVP launch-ready until the Android Chrome and iPhone Safari device runbook passes.

## Scorecard

| Area                           | Status  | Evidence                                                                                       |
| ------------------------------ | ------- | ---------------------------------------------------------------------------------------------- |
| Public beta scope              | Pass    | Release surface limited to `/`, auth, `/coach`, `/history`, `/pricing`, `/privacy`, `/terms` |
| Route gating                   | Pass    | Disabled legacy routes are redirected and protected routes preserve redirect intent            |
| Auth recovery surface          | Pass    | `npm run test`, `npm run test:e2e:auth`                                                        |
| Coach correctness              | Pass    | `npm run test`, `npm run test:e2e:coach`                                                       |
| Coach visual regression        | Pass    | `npm run test:e2e:coach:visual`                                                                |
| Coach hot-path performance     | Pass    | `npm run test:perf-smoke`                                                                      |
| Production build               | Pass    | `npm run build`                                                                                |
| Metadata image surface         | Pass    | File-based Open Graph and Twitter image routes build cleanly                                   |
| Formal release gate            | Pass    | `npm run test:release`                                                                         |
| Android Chrome physical device | Pending | Final runbook not completed                                                                    |
| iPhone Safari physical device  | Pending | Final runbook not completed                                                                    |

## Automated Gate Snapshot

- `npm run lint`
- `npm run test`
- `npm run test:perf-smoke`
- `npm run build`
- `npm run test:e2e:auth`
- `npm run test:e2e:coach`
- `npm run test:e2e:coach:visual`
- `npm run test:e2e:release`
- `npm run test:release`

## MVP Strengths

- Coach-first public product surface is enforced.
- Sign-up, callback failure recovery, and auth redirect preservation are covered by code and automation.
- Squat, pushup, and plank have deterministic scripted motion coverage.
- Mobile stage protection and exercise-specific framing are in place.
- Visual regression and performance smoke are part of the formal release gate.
- Recovery UX for blocked camera and detector failure is covered in automation.

## Remaining Launch Blockers

- Android Chrome physical-device pass in `docs/technical/DEVICE_VALIDATION_RUNBOOK.md`
- iPhone Safari physical-device pass in `docs/technical/DEVICE_VALIDATION_RUNBOOK.md`
- Final PM and wellness review of cue clarity on real devices

## Known Non-Blocking Notes

- Non-MVP routes remain in the repo, but the public beta surface is constrained by redirects and feature gating.

## Leadership Decision Frame

- `Go for final manual device validation` when no new MVP scope is introduced and `npm run test:release` remains green.
- `Go for beta release` only after both physical-device passes are complete and any resulting coach UX defects are resolved.

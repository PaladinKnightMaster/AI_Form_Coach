# Coach Visual Regression

## Purpose
- Catch layout drift on the `/coach` MVP surface before manual device review.
- Keep stable baselines for exercise setup, active mobile stage, paused mobile state, and completed mobile state.
- Back the formal MVP release gate with both behavioral and visual coach coverage.

## Commands
- `npm run test:e2e:coach:visual`
- `npm run test:e2e:coach:visual:update`
- `npm run test:release`

## Release Gate
- `test:release` now includes:
  - lint
  - MVP unit/integration coverage
  - production build
  - coach smoke regression
  - coach visual regression
- Manual phone validation on real Android Chrome and iPhone Safari still stays in the final MVP stage.

## Current Coverage
- Chromium desktop setup card for squat, pushup, and plank
- Android Chrome mobile active, paused, and completed states
- iPhone Safari mobile active state

## Notes
- Visual tests use deterministic scripted pose states, not a live camera feed.
- Mobile rep and elapsed counters are masked because they are time-dependent.
- These snapshots reduce layout regressions, but they do not replace manual phone validation for real-body visibility, lighting, or motion trust.
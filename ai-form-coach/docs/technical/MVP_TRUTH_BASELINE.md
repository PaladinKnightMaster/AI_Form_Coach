# MVP Truth Baseline

Updated: March 7, 2026

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

## Quality Gates

- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:pose-smoke`

## Code and Docs Rules

- Docs, product copy, and route exposure must match the actual beta surface.
- Public pages must not claim unsupported scale, uptime, ratings, or health/device integrations.
- Live coaching must use the fitness skeleton with `neck` and `pelvis_center`, not facial chains.


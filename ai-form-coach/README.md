# AI Form Coach

Updated: March 20, 2026

## Status

AI Form Coach is currently a coach-first MVP release candidate in hardening.

The public beta surface is intentionally narrow:
- `/`
- `/signin`
- `/signup`
- `/reset-password`
- `/auth/auth-code-error`
- `/coach`
- `/history`
- `/session/[id]`
- `/pricing`
- `/privacy`
- `/terms`

The product promise for this MVP is simple: private, browser-based motion coaching for `squat`, `pushup`, and `plank`.

## Implemented Now

- Real-time live coaching on `/coach`
- MediaPipe-based pose detection with a reduced fitness skeleton
- Exercise-specific framing for squat, pushup, and plank
- Pause, resume, save, and post-session feedback
- Saved session history and session detail review
- Sign-in, sign-up, password reset, magic link, and callback recovery flows
- Mobile stage protection so the camera view remains dominant
- Automated release gates for lint, tests, build, auth smoke, coach smoke, visual regression, and performance smoke

## Restricted From Public Beta

These areas remain out of the public MVP even if historical code or documentation still exists in the repo:
- Nutrition and food scan
- Workout plan generation
- Readiness and health integrations
- Organizations, community, challenges, packs, and leaderboards
- Paid subscriptions and Stripe-gated features
- Placeholder or demo-backed AI product flows

## Current Quality Gate

The formal automated MVP gate is:

```bash
npm run test:release
```

It runs:
- `npm run lint`
- `npm run test`
- `npm run test:perf-smoke`
- `npm run build`
- `npm run test:e2e:release`

The remaining manual launch gate is the physical-device runbook on Android Chrome and iPhone Safari.

## Local Development

### Minimum environment

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # optional for local MVP app usage, required for admin/server tasks
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:3100
```

### Start the app

```bash
npm install
npm run dev
```

### Important checks

```bash
npm run lint
npm run test
npm run test:perf-smoke
npm run build
npm run test:e2e:auth
npm run test:e2e:coach
npm run test:e2e:coach:visual
npm run test:release
```

## Documentation

Canonical MVP documents:
- [docs/technical/MVP_TRUTH_BASELINE.md](./docs/technical/MVP_TRUTH_BASELINE.md)
- [docs/technical/MVP_RELEASE_CHECKLIST.md](./docs/technical/MVP_RELEASE_CHECKLIST.md)
- [docs/technical/MVP_RELEASE_SCORECARD.md](./docs/technical/MVP_RELEASE_SCORECARD.md)
- [docs/technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md](./docs/technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md)
- [docs/technical/DEVICE_VALIDATION_RUNBOOK.md](./docs/technical/DEVICE_VALIDATION_RUNBOOK.md)
- [docs/technical/COACH_VISUAL_REGRESSION.md](./docs/technical/COACH_VISUAL_REGRESSION.md)
- [docs/technical/COACH_PERFORMANCE_SMOKE.md](./docs/technical/COACH_PERFORMANCE_SMOKE.md)

Historical docs still exist under `docs/marketing`, `docs/features`, `docs/systems`, `docs/verification`, and `docs/war-room-v2`, but they should not be treated as current release truth unless a current MVP technical doc points to them explicitly. `docs/war-room-v2` is kept as the initial Beta 2 planning baseline.

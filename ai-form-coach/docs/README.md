# AI Form Coach Documentation

Updated: March 20, 2026

## Canonical MVP Docs

These files are the source of truth for the current public MVP:
- [technical/MVP_TRUTH_BASELINE.md](./technical/MVP_TRUTH_BASELINE.md)
- [technical/MVP_RELEASE_CHECKLIST.md](./technical/MVP_RELEASE_CHECKLIST.md)
- [technical/MVP_RELEASE_SCORECARD.md](./technical/MVP_RELEASE_SCORECARD.md)
- [technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md](./technical/MVP_IMPLEMENTATION_STATUS_MATRIX.md)
- [technical/DEVICE_VALIDATION_RUNBOOK.md](./technical/DEVICE_VALIDATION_RUNBOOK.md)
- [technical/COACH_VISUAL_REGRESSION.md](./technical/COACH_VISUAL_REGRESSION.md)
- [technical/COACH_PERFORMANCE_SMOKE.md](./technical/COACH_PERFORMANCE_SMOKE.md)
- [technical/MVP_AUTOMATION_MATRIX.md](./technical/MVP_AUTOMATION_MATRIX.md)

If a document conflicts with the files above, the MVP technical docs win.

## Current Product Status

AI Form Coach is a coach-first MVP release candidate in hardening.

Implemented now:
- Live coaching for `squat`, `pushup`, and `plank`
- Real-time pose overlay with a fitness skeleton
- Session save, history, and session detail review
- Auth flows: sign in, sign up, magic link, reset password, callback recovery
- Mobile coach UX tuned around camera visibility and stage protection
- Automated release gates for auth, coach behavior, visual regression, and performance smoke

Restricted from the public beta:
- Nutrition and food scan
- Workout plan generation
- Readiness and health integrations
- Organizations, social/community, challenges, packs, and leaderboards
- Paid subscriptions and Stripe-driven launch flows

## Documentation Map

### Source-of-truth MVP docs
- `technical/` for release truth, gates, runbooks, and the Beta 1 implementation matrix

### Technical reference docs still relevant to MVP internals
- `pose/`
- `development/`
- selected files in `technical/`

### Historical or broader-platform docs
These remain useful as reference, but they are not current MVP release truth by default:
- `features/`
- `systems/`
- `marketing/`
- `verification/`
- `war-room-v2/` (kept as the initial Beta 2 planning baseline)

## Best-Practice Rules For This Repo

- Keep one canonical source of truth for current release status.
- Separate active MVP docs from archival or exploratory docs.
- Mark de-scoped areas clearly instead of silently leaving old claims in place.
- Prefer concrete release evidence like commands, routes, and test gates over aspirational language.
- Update the MVP technical docs whenever release scope, route exposure, automated gates, or Beta 2 planning handoff rules change.

## Next Review Trigger

Review the canonical MVP docs whenever one of these changes:
- public route exposure
- auth flow behavior
- coach UX behavior
- release command or gate composition
- manual device launch criteria
- Beta 2 planning scope or reactivation decisions

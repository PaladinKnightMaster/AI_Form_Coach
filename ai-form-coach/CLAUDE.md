# AI Form Coach

## Git Branching (MUST FOLLOW)
- **All feature/fix branches MUST be created from `dev`**, never from `main`
- Flow: `feature branch` → PR to `dev` → verify on dev → PR `dev` to `main`
- Branch prefixes: `fix/`, `feat/`, `docs/`, `refactor/`, `chore/`
- Never push directly to `main` or `dev` — always use PRs
- User creates PRs and merges manually — do NOT auto-create PRs from CLI
- **One branch = one purpose.** Never stack unrelated changes onto an existing branch
- **Before starting new work:** delete all merged branches (local + remote), then create fresh from `dev`:
  ```bash
  git checkout dev && git pull origin dev && git fetch origin --prune
  git branch --merged origin/dev | grep -v "main\|dev" | xargs git branch -d
  git checkout -b fix/new-feature
  ```
- See ADR-006 for full details

## What This Is
Browser-based AI form coaching app. Users point their camera at themselves during exercises (squat, pushup, plank), and the app provides real-time pose feedback using on-device ML pose detection. No cloud LLM in the live coaching loop.

## Tech Stack
- **Framework:** Next.js 16.0.7 (App Router), React 19.1.0, TypeScript 5.x
- **Styling:** Tailwind CSS 4.1.13 (CSS-first: `@import "tailwindcss"` + `@tailwindcss/postcss`) + CSS custom properties in globals.css
- **State:** Zustand 5.0.8
- **Auth:** Supabase Auth via `@supabase/ssr` 0.7.0 (PKCE flow, client-side callback)
- **Database:** Supabase PostgreSQL via `@supabase/supabase-js` 2.56.1
- **Pose Detection:** @mediapipe/tasks-vision 0.10.22 (browser-only, no TensorFlow.js)
- **AI (async only):** @google/generative-ai (Gemini) — post-session analysis, NOT in live coaching loop
- **Payments:** Stripe
- **Error Monitoring:** Sentry
- **E2E Testing:** Playwright
- **Deployment:** Vercel (production + preview)
- **Analytics:** Umami (self-hosted)

## Architecture Decisions
- Auth callback is CLIENT-SIDE (`src/app/auth/callback/page.tsx`) because PKCE code_verifier lives in localStorage, inaccessible to server Route Handlers. See ADR-001.
- Skeleton overlay uses 10 fitness-relevant joints, not all 33 MediaPipe landmarks. See ADR-002.
- No cloud LLM in the live coaching loop — all pose detection and cue generation runs in-browser. Gemini is used for async features only. See ADR-003.
- Coach UI: camera viewport is the hero element. All overlays must be minimal and translucent. See ADR-005.
- Design tokens: CSS custom properties in globals.css (runtime-switchable for light/dark) + Tailwind v4 `@theme` block for token definitions. `src/ui/theme.ts` is deprecated. See ADR-004.
- Use `getUser()` not `getSession()` for server-side auth verification.

## Key Directories
- `src/app/` — Next.js App Router pages
- `src/components/coach/` — Coach experience UI (CoachExperienceView, CoachCameraChrome)
- `src/components/` — Shared components (PoseOverlay, etc.)
- `src/ui/` — Design system components (DS.tsx — Button, Badge, Card, Input, etc.)
- `src/lib/pose/` — Pose detection engine, contracts, skeleton rendering
- `src/lib/coach/` — Coaching logic, cue engine, telemetry
- `src/lib/supabase/` — Supabase client/server helpers
- `src/lib/auth/` — Auth utilities
- `docs/technical/` — Canonical MVP truth documents
- `docs/adr/` — Architecture Decision Records
- `docs/design/` — Design system spec and responsive strategy

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — Type check
- `npx supabase gen types typescript --project-id $PROJECT_ID > src/lib/supabase/database.types.ts` — Regenerate DB types after migrations

## Testing
- Unit/integration: Vitest
- E2E: Playwright
- Pre-existing TS errors in `src/__tests__/integration/user-flows.test.ts` (nutrition types mismatch) — known, not blocking
- Physical device testing (iOS Safari + Android Chrome) is the final Beta 1 gate
- Release gate: `npm run test:release`

## Current Phase
Phase 0: Beta 1 (v0.9.0 "Foundation"). Solo developer, no funding. Ship reliably on real devices, 20-50 beta testers.
Revenue roadmap: Phase 1 (v1.0.0 PMF validation) → Phase 2 (v1.5.0 freemium $500-800 MRR) → Phase 3 (v2.0.0 B2B $3-5K MRR) → Phase 4 (v2.5.0 enterprise $8-12K MRR) → Phase 5 (v3.0.0 platform $15-25K MRR).

# Close brand rollout + wire release gate to CI

**Date:** 2026-05-26
**Author:** Claude (war-room council session)
**Status:** approved (awaiting written-spec review)
**Target branch:** `chore/close-brand-rollout-ci-gate`
**Target base:** `dev`

## Goal

Close the Carriage brand rollout chapter and convert the just-restored
`npm run test:release` gate from "we can run it locally" to "the gate runs
itself at the integration-to-prod boundary." One PR, three thin deliverables,
no scope drift.

After this PR merges:

1. War-room concern #6 (brand identity gap) is officially green.
2. The only orphan file left over from the seven-step rollout is deleted.
3. A `dev` → `main` PR cannot be merged without the gate passing on a clean
   Linux runner.

## Scope (3 deliverables)

### 1. Delete `src/components/AnimatedGradientBackground.tsx`

Orphan since Step 05 — only reference is a comment in
`src/app/(marketing)/page.tsx:13`. Delete the file; strip the comment in the
same change so the diff reads as a self-contained removal.

Effort: 5 minutes. No tests, no consumers, no risk.

### 2. Flip war-room concern #6 to 🟢

In `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`:

- Update the status line from `🟡 in progress (this concern triggered the next branch)` to `🟢 resolved`.
- Add a one-line "Resolution" sub-entry referencing PRs #48 (tokens), #49 (fonts), #51 (mark + SiteHeader), #52 (pose overlay → Form Line), #54 (copy), #55 (OG/favicon/manifest + font deploy fix), #56 (splash), #57 (e2e release gate restored).
- Add an entry to the changelog table at the bottom of the file: `2026-05-26 | #6 Brand identity | 🟡 → 🟢 | Carriage rollout 7/7 merged + e2e gate restored`.

The contract in `BRAND_ROLLOUT.md` says only this PR should flip the tracker —
the brand-step PRs themselves did not edit it. This PR is that PR.

Effort: 1 minute.

### 3. Add `.github/workflows/release-gate.yml`

The substantive piece of the PR. Wires `npm run test:release` into GitHub
Actions with a frugal trigger model suited to a solo-dev free-tier account
and the existing "run the gate locally before pushing" discipline.

## CI workflow design

### Triggers

| Trigger | Active? | Why |
|---|---|---|
| `workflow_dispatch` | ✅ | Manual re-run from GH UI. Default for `feat/*` → `dev` PRs and ad-hoc verification. Accepts an `update_snapshots` boolean input (default `false`) — when `true`, the e2e step passes `--update-snapshots` to Playwright. Used once per platform-baseline change. |
| `pull_request` with `branches: [main]` | ✅ | The integration-to-prod boundary. Automatically gates every `dev` → `main` merge. |
| `pull_request` against `dev` | ❌ | Solo-dev runs `test:release` locally before pushing `feat/*`. CI duplication on every push wastes free-tier minutes. Manually dispatch instead per the rule of thumb below. |
| `push` to any branch | ❌ | Merges happen via PR; the PR run already passed. Re-running on the merge commit gates nothing new. |
| nightly cron | ❌ | `test:release` has no flaky network deps to catch overnight. |

**Estimated cost:** ~1 PR-to-main per week × 2–3 runs × ~7 min ≈ **20–40 min/month**
of the 2,000-min free-tier budget. 10× lower than a full auto-trigger setup.

### Concurrency

```yaml
concurrency:
  group: release-gate-${{ github.ref }}
  cancel-in-progress: true
```

Newer pushes on the same PR cancel older runs. Keeps the latest commit's
signal authoritative; further reduces minute spend on superseded commits.

### Runner & setup

- `runs-on: ubuntu-latest`
- `defaults.run.working-directory: ai-form-coach` (Next.js app lives under a
  subdir of the git repo root).
- `actions/checkout@v4`
- `actions/setup-node@v4` with `node-version: 22.x` (matches local
  `node --version`), `cache: 'npm'`, `cache-dependency-path: ai-form-coach/package-lock.json`.

### Browsers

`npx playwright install --with-deps chromium webkit`

- `chromium` covers the `chromium` Playwright project AND the `android-chrome`
  project (both use the chromium engine; android-chrome differs only in device
  emulation flags).
- `webkit` covers the `iphone-safari` project.
- Firefox is not needed; the suite doesn't use it.
- `--with-deps` installs OS-level libs required by webkit on Ubuntu.

### Env vars (workflow `env:` block, not GitHub Secrets)

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-anon-key
  SUPABASE_SERVICE_ROLE_KEY: placeholder-service-key
  NEXT_PUBLIC_BASE_URL: http://127.0.0.1:3100
```

**Why placeholders, not secrets:** the build needs these variables *defined*
(non-null TS assertions, SSR static analysis), but their *values* are
irrelevant in the test path. The e2e suite routes everything through the
`e2e-access=1 + loopback` bypass shipped in PR #57 — Supabase is constructed
but never round-tripped. Real credentials would add operational overhead
(rotation, leak audit, access control) for zero functional benefit at the
current test surface.

If a future test actually requires a working backend (e.g. a real
`session.save()` smoke test), add scoped `secrets.SUPABASE_TEST_*` for *that*
test only — not the whole workflow.

### Steps (design intent — YAML drafted in the implementation plan)

1. **Checkout** — `actions/checkout@v4`.
2. **Setup Node** — `actions/setup-node@v4` with `node-version: 22.x`, npm caching keyed on `ai-form-coach/package-lock.json`.
3. **Install dependencies** — `npm ci` in `ai-form-coach/`.
4. **Install Playwright browsers** — `npx playwright install --with-deps chromium webkit`.
5. **Run release gate** — `npm run test:release` *unless* `inputs.update_snapshots == true`, in which case the e2e portion runs with `--update-snapshots` appended (lint / unit / perf / build still run unchanged). The conditional lives inside the step's shell — same single step, different command.
6. **Upload Playwright report on failure** (`if: failure()`) — uploads `playwright-report/` + `test-results/` as the `playwright-report` artifact, 14-day retention. For debugging without re-running locally.
7. **Upload regenerated baselines** (`if: inputs.update_snapshots == true && success()`) — uploads `tests/e2e/**/*-snapshots/` as the `updated-snapshots-linux` artifact, 14-day retention. The single mechanism for getting newly-generated platform-specific PNGs out of the runner and into the repo.

### Manual-dispatch rule of thumb

Manually trigger the workflow (via the GH Actions UI, "Run workflow" button)
when *any* of the following are true for the commit you're about to push to
`dev`:

1. You changed anything under `tests/e2e/`.
2. You changed `playwright.config.ts`, `next.config.ts`, `package.json`, or
   any GitHub Actions workflow file.
3. You touched a Playwright snapshot PNG under `*-snapshots/`.
4. You did not run `npm run test:release` locally (for whatever reason).
5. The PR is large, touches `middleware.ts`/auth, or refactors something
   widely-imported.

Skip the dispatch for: doc-only PRs, comment/whitespace changes,
single-file copy edits with no logic. The `dev` → `main` PR will gate-check
them automatically.

## Risks & mitigations

### Cross-platform snapshot baselines

The `coach.visual` baselines committed in PR #57 are Windows-generated
(`coach-setup-squat-desktop-chromium-win32.png`). Playwright's
`toHaveScreenshot` uses platform-suffixed filenames by default — the first
CI run on Linux will fail because the `*-linux.png` baselines don't exist.

**Plan:** add a `workflow_dispatch` input `update_snapshots` (boolean,
default `false`). When `true`, the e2e step appends `--update-snapshots`
to the Playwright command. First dispatch on this PR sets it to `true` →
Linux baselines generated → workflow uploads them as an artifact → download,
commit alongside the Windows baselines, push, then dispatch again with the
input `false` (or just open the PR-to-main) to confirm both platforms pass.

This is a deliberate two-step rather than a single-shot land — call it out
in the PR body so anyone reviewing isn't surprised by the first run failing
"on purpose."

Alternative considered (not chosen): generate Linux baselines locally via
Docker (`mcr.microsoft.com/playwright:v1.X-jammy`). Rejected — requires
Docker setup the user may not have; the workflow_dispatch input keeps the
mechanism self-contained in CI.

Alternative considered: configure Playwright to use a single platform-neutral
baseline. Rejected — keeping per-platform baselines surfaces real
font-rendering / DPI / antialiasing differences that would otherwise hide
under "approximately the same."

### Webkit on Ubuntu

Webkit sometimes needs extra system libraries on Ubuntu runners.
`--with-deps` should handle it, but if the `iphone-safari` project flakes in
CI specifically (and only there), the contingency is a separate optional
job for webkit so the main chromium gate isn't blocked. We're not building
that fallback up front — only if it actually breaks.

### Branch protection (out of scope, mentioned for completeness)

This PR adds the workflow but does not configure GitHub branch protection
to *require* it. That's a one-time GitHub UI change you make after the
workflow exists and you've seen it pass once on a `dev` → `main` PR:
Settings → Branches → `main` → require status checks → select
`release-gate`. Recommended as a follow-up after this PR lands.

## Out of scope

- **Coach app chrome sweep** (`CameraPermissionCard`, `CoachCameraChrome`, session timer, top bar still mix `slate-*`/`emerald-*` utilities) — Claude Design's "item 2." Defer to a v1.1 polish PR.
- **Splash on first coach-stage entry** — Step 07 deferred this; ~10-minute follow-up. Not launch-blocking.
- **Typed `<Wordmark>` / `<Display>` / `<Eyebrow>` components** — design-system follow-up.
- **Untracked `public/fonts/*` cleanup** (zips, unused statics) — `.gitignore` decision still deferred.
- **Other war-room concerns** (#1 S-G bug, #3 Sentry verify, #10 a11y audit, etc.) — separate PRs, each gates Beta 1 launch in its own right.
- **GitHub branch protection rule configuration** — UI step, post-merge.

## Acceptance

### Verified inside this PR

- [ ] `AnimatedGradientBackground.tsx` deleted; the orphan comment in `(marketing)/page.tsx` stripped.
- [ ] War-room tracker concern #6 reads 🟢 resolved with a PR-list resolution line and a changelog row.
- [ ] `.github/workflows/release-gate.yml` exists with the trigger model and steps above.
- [ ] **Dispatch #1** on this PR's branch with `update_snapshots=true` succeeds; the `updated-snapshots-linux` artifact contains the seven `coach.visual.spec.ts-snapshots/*-linux.png` baselines.
- [ ] Those Linux baselines are downloaded, committed alongside the existing Windows baselines (both `-win32.png` and `-linux.png` live side-by-side), and pushed.
- [ ] **Dispatch #2** on this PR's branch with `update_snapshots=false` (the default) passes — proves the gate is green on Linux from committed baselines, no `--update-snapshots` shortcut.
- [ ] PR body documents the deliberate two-dispatch verification, the manual-dispatch rule of thumb, and the recommended branch-protection follow-up.

### Verified on the next `dev` → `main` PR (not this one)

- [ ] The `pull_request` auto-trigger fires when a `dev` → `main` PR is opened. Confirms the auto-gate works on a real merge boundary, not just on dispatch.

### Recommended follow-up (one-time, post-merge, GitHub UI only)

- [ ] Settings → Branches → Branch protection rule for `main` → require status checks → select `release-gate`. This is what makes the workflow *actually block* a `main` merge instead of just running alongside it. Out of code scope but the workflow's value is dramatically lower without it.

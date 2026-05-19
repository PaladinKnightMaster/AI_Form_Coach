# Carriage Brand Rollout — Workflow Contract

**Status:** Active (rollout begun May 2026)
**Owner:** Solo developer · Claude Design packages each step · Claude Code applies it
**Lives next to:** the per-step screenshot directories under `docs/brand/step-NN/`

This document is the **stable contract** behind the 7-step Carriage brand
rollout. Per-step prompts reference it and only need to add what is unique
to that step. Everything stable across the rollout — branch naming, release
gate, path resolution, out-of-scope rules — lives here once and is not
repeated in every prompt. The point is to shrink the per-step prompt to its
actual delta and stop re-injecting the same 1,500 words of context every
session.

If you are an agent reading this for the first time in a brand-rollout
session, **read this entire file, then ask for the per-step prompt.**

---

## The 7-step manifest

One PR per step. Each step ships to `dev`. `dev` → `main` only at release time.

| Step | Branch                                    | What it ships                                  | Status        |
|------|-------------------------------------------|------------------------------------------------|---------------|
| 01   | `feat/carriage-step-01-tokens`            | Carriage CSS variables in `globals.css`        | ✅ merged (PR #48) |
| 02   | `feat/carriage-step-02-fonts`             | Self-hosted Fraunces / Satoshi / JBMono        | ✅ merged (PR #49) |
| 03   | `feat/carriage-step-03-ribbon-c`          | Ribbon C SVG + `<RibbonCMark>` + SiteHeader    | pending       |
| 04   | `feat/carriage-step-04-pose-overlay`      | Form-Line palette on `PoseOverlay.tsx`         | pending       |
| 05   | `feat/carriage-step-05-copy`              | Marketing copy rewrite (hero / pricing / footer) | pending     |
| 06   | `feat/carriage-step-06-og-favicon`        | OG image, favicon link tag, manifest, app icons | pending      |
| 07   | `feat/carriage-step-07-splash`            | Signature logo reveal (splash)                 | pending       |

This table is the **single source of truth** for branch names. If a future
step adds substeps, add a row — do not rename existing rows after merge.

---

## Brand identity (locked)

This summary is the council-locked answer to "what is Carriage." Do not
drift, do not interpret. If a per-step prompt contradicts this table, this
table wins.

|                | |
|----------------|---|
| **Brand**      | Carriage |
| **Descriptor** | AI Form Coach |
| **Concept**    | Couture Kinetics |
| **Mark**       | Ribbon C (continuous body line, 3 calibration nodes) |
| **Metaphor**   | The Form Line |
| **Tagline**    | *Form, carried.* |
| **Hero line**  | *Return to your line.* |
| **Trust line** | *Your video stays on your device.* |
| **Voice**      | Calm. Precise. Private. Direct. No hype. No exclamation marks. |
| **Brand color**| Malachite `#0E6F5C` |
| **Type stack** | **Fraunces** (italic display, `opsz 144, SOFT 50, WONK 1` for wordmark) / **Satoshi** (UI 400/500/600/700) / **JetBrains Mono** (eyebrows, all-caps, `letter-spacing: 0.22em`) |

The 8-color token set and axis variables (`--wordmark-axes`, `--display-axes`)
ship in Steps 01 and 02. Steps 03+ **consume** them and **never redeclare**
them. If a handoff package redeclares a token or axis variable, stop and ask
before applying — do not patch around it.

---

## Path resolution

The Carriage handoff bundle lives at the **project root**, parallel to the
repo, not inside it:

```
D:\1_PROJECT\PRIVATE_WORK\AI_Form_Coach\
├── ai-form-coach\                           ← the repo
└── design_handoff_carriage_brand\           ← Claude Design's deliverables (untracked)
```

Two consequences:

1. **Reading paths** (handoff docs, step READMEs, source files to copy):
   relative to **project root**.
   Example: `design_handoff_carriage_brand/implementation/step-03/README.md`.
2. **Editing paths** (where files land in the repo):
   relative to **`ai-form-coach/`** inside the worktree.
   Example: `src/components/SiteHeader.tsx`.

In a git worktree, the handoff bundle is **outside the worktree** — git only
checks out the repo. Use the absolute path
`D:/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/design_handoff_carriage_brand/` to
read it. Do not try to `cp -R` from inside the worktree using a relative
path — it will not resolve.

---

## Branch + PR workflow

Per `ai-form-coach/CLAUDE.md`:

1. **All branches from `dev`**, never `main`.
2. **One branch = one purpose.** Never stack unrelated changes.
3. **Do NOT run `gh pr create`**. Commit, push the branch, provide a
   copy-paste-ready PR body. The human opens the PR manually.
4. **Conventional commits.** `feat(brand): ...` for step PRs;
   `chore(brand): ...` for workflow/doc PRs that don't ship UI changes.
5. **PR titles use this pattern:**
   `feat(brand): <one-line scope> (Step NN/7)`
   Example: `feat(brand): Ribbon C mark + SiteHeader lockup (Step 03/7)`.

### Required PR body sections

Every brand-rollout PR body must include:

1. **Summary** — 1–3 bullets, what shipped.
2. **Scope** — files added / replaced; **explicitly call out any opportunistic
   cleanup bundled into the PR.** If a replacement file also swaps unrelated
   utility classes, name it here — do not bury it in the diff.
3. **Smoke test** — pasted from the step's README, with `[x]` checkboxes ticked.
4. **Screenshots** — link to `docs/brand/step-NN/` images, inline at three
   breakpoints (desktop ≥ 1024, tablet 768, mobile 375).
5. **Snapshot baseline** — only if Playwright snapshots were re-baselined;
   say "no re-baseline needed" otherwise.
6. **Out of scope** — list the things explicitly NOT in this PR (use the
   "Out of scope across the rollout" list below as the source).

---

## Worktree setup

Each session that ships a step works in a git worktree. Two startup modes:

**Mode A — reuse a parked warm worktree** (if one exists for this rollout).
A warm worktree already has `node_modules` installed, `.env.local` /
`.env.production` present, and `public/fonts/` populated. Detect by running:

```bash
git rev-parse --show-toplevel        # → ...\.claude\worktrees\<name>\
git branch --show-current             # → claude/parked-awaiting-step-NN
```

If you see a `claude/parked-awaiting-step-NN` branch, you're warm. Switch in:

```bash
git fetch origin --prune
git checkout -b feat/carriage-step-NN-<slug> origin/dev
git branch -d claude/parked-awaiting-step-NN
```

**Mode B — fresh worktree.** If you're in a worktree without the warm
indicators, set it up manually:

1. `cd` into the worktree's `ai-form-coach/` subdir.
2. `npm install` (~40s, gitignored).
3. Copy `.env.local` and `.env.production` from the main repo's
   `ai-form-coach/` into the worktree's `ai-form-coach/`.
4. Copy `public/fonts/{Fraunces,Satoshi_Complete,JetBrainsMono-2.304}/`
   from the main repo's `ai-form-coach/public/fonts/` into the worktree's.
   (Fonts must resolve or above-the-fold paint breaks from Step 02 onward.)
5. Create the step branch:
   `git checkout -b feat/carriage-step-NN-<slug>` from a freshly-pulled `dev`.

Always confirm starting branch state with `git status --short` before applying
any handoff files.

---

## Tooling

The repo is **npm**, not pnpm. Claude Design's per-step READMEs sometimes
show `pnpm dev` / `pnpm build` — substitute `npm run dev` / `npm run build`.
Do not introduce a `pnpm-lock.yaml`. If a per-step README disagrees, defer
to this contract.

| Task              | Command                                             |
|-------------------|-----------------------------------------------------|
| Dev server        | `npm run dev`                                       |
| Production build  | `npm run build`                                     |
| Lint              | `npm run lint`                                      |
| Unit (MVP)        | `npm run test`             *(72 tests baseline)*    |
| Unit (extended)   | `npm run test:extended`    *(142 pass / 11 skip = 214)* |
| **Release gate**  | `npm run test:release`     *(lint + MVP + perf-smoke + build + e2e:release — the one to defend)* |

---

## Release gate — what must stay green

`npm run test:release` is the gate. It runs:

1. `npm run lint`
2. `npm run test` (MVP — 72 tests)
3. `npm run test:perf-smoke`
4. `npm run build`
5. `npm run test:e2e:release` (Playwright: `auth.smoke`, `coach.smoke`, `coach.visual`)

The extended unit suite (`npm run test:extended`, 214 total) is also expected
to stay green; it isn't part of `test:release` but is part of the rollout's
quality bar. Run it once per step before pushing.

### Failure mode

**If any release-gate check fails, stop and report. Do not push a
partially-passing branch.** Diagnose root cause first. Do not re-baseline
Playwright snapshots to make a failure go away — re-baselining is only
appropriate when a visible visual change was intended (e.g. Step 03 changes
the header lockup), and even then must be called out in the PR body's
"Snapshot baseline" section.

---

## Screenshots

Each step captures before/after screenshots at three breakpoints and
saves them under `ai-form-coach/docs/brand/step-NN/`. File naming:

```
docs/brand/step-NN/
├── stepNN-<surface>-<descriptor>.png
└── stepNN-<surface>-<descriptor>.png
```

Examples that landed in Steps 01–02:

```
docs/brand/step-01/step01-home-malachite.png
docs/brand/step-01/step01-pricing-malachite-accents.png
docs/brand/step-01/step01-signin-dark-surface.png
docs/brand/step-02/step02-home-carriage-type.png
docs/brand/step-02/step02-pricing-mono-eyebrows.png
docs/brand/step-02/step02-signin-satoshi-ui.png
docs/brand/step-02/step02-wordmark-wonk-fingerprint.png    ← proof shot
```

**Proof shots.** When a step introduces a self-contained primitive that
isn't visibly used elsewhere (e.g. Step 02's WONK-1 fingerprint, Step 03's
`<RibbonCMark>` rendered in isolation if only `SiteHeader` consumes it),
capture an additional standalone proof shot. The header lockup *uses* the
mark but doesn't prove the mark itself is correct in isolation.

---

## Out of scope across the rollout

These items are deliberately deferred and are **not** to be touched as
"while I'm here" cleanups during any step PR. Each has its own future
home:

- ❌ **Liability waiver / medical disclaimer copy** — separate branch,
  blocking on a lawyer review (war-room concern #2).
- ❌ **Pricing structure changes** — beta is free; tier work is Phase 2
  per the roadmap.
- ❌ **Legacy-disabled content** (`src/legacy-disabled/` — community,
  nutrition, packs). Stays disabled. Step 01's token swap touches their
  CSS variables transitively; that's fine.
- ❌ **Full Tailwind v4 token sweep** — replacing every hardcoded
  `slate-*` / `emerald-*` utility in the app. A follow-up PR after the
  rollout merges. Step 03 bundles only the SiteHeader cleanup because the
  whole file was being replaced anyway.
- ❌ **Domain registration, Stripe rename, email-sender update** —
  operational, post-merge.
- ❌ **CI workflow** (`.github/workflows/`) — war-room concern #4,
  separate PR.
- ❌ **Sentry verification** — war-room concern #3, separate PR.

If a step PR finds a real problem outside this list, file it as a
follow-up task or war-room concern — don't fold it in.

---

## War-room tracker policy

`ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` tracks
launch-blocking concerns. The brand rollout addresses **concern #6
(brand identity gap)**.

- **Do not** edit the tracker mid-rollout.
- **Do** flip concern #6 from 🟡 to 🟢 in the PR that ships Step 07.
- The tracker is the only place the brand rollout's existence is
  cross-referenced from non-brand product docs — keep that
  cross-reference intact.

---

## Carriage v1 conflict policy

If a per-step prompt or a Claude Design handoff package conflicts with
this contract, **the contract wins for workflow** (branches, gate,
scope, tooling) and **the handoff wins for design** (geometry, hex
values, axis settings, copy). When the conflict is ambiguous — stop and
ask. Do not silently reconcile.

Two specific guardrails:

1. **No token / axis redeclaration past Step 02.** Steps 01 and 02 are
   the single source of truth for CSS variables. Components consume,
   they do not redeclare.
2. **No copy changes outside Step 05.** Hero, pricing, footer, pull-quotes
   are frozen until Step 05's PR. If a smoke check requires confirming
   "copy unchanged," diff the page-level strings against `origin/dev`.

---

## Per-step prompt template

A correctly-shaped per-step prompt is now this small:

```
Step NN of the Carriage brand rollout — apply per
ai-form-coach/docs/brand/BRAND_ROLLOUT.md and the step README at
design_handoff_carriage_brand/implementation/step-NN/README.md.

Branch: feat/carriage-step-NN-<slug>

Step delta (what is unique to this step):
- <one-sentence summary>
- <opportunistic scope expansions, if any, named explicitly>
- <step-specific risks worth flagging up front>

Step delta verification (what is unique to this step's smoke gate):
- <bullets that the BRAND_ROLLOUT.md release gate doesn't already cover>

Stop after PR body is ready. Do not run `gh pr create`.
```

Everything else (branch convention, release gate, screenshot pattern,
out-of-scope, etc.) the executing agent picks up from BRAND_ROLLOUT.md
without it being repeated in the prompt.

---

## Change log for this contract

| Date       | Change                              | By  |
|------------|-------------------------------------|-----|
| 2026-05-19 | Initial contract drafted post-Step 02 merge | — |

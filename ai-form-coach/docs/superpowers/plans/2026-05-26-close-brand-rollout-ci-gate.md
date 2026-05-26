# Close Brand Rollout + Wire Release Gate to CI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the seven-step Carriage brand rollout (delete the last orphan + flip war-room concern #6 to green) and wire `npm run test:release` into a GitHub Actions workflow that auto-gates `dev` → `main` PRs while staying inside the free-tier minute budget.

**Architecture:** Three deliverables, one PR. (1) A self-contained file deletion + one-comment strip. (2) Two targeted markdown edits in the war-room tracker. (3) A new `.github/workflows/release-gate.yml` with a frugal trigger model (`pull_request` against `main` only + `workflow_dispatch` with an `update_snapshots` boolean input). Verification happens via two manual workflow dispatches inside this PR: first generates Linux Playwright baselines (committed alongside the existing Windows ones), second confirms the gate is green on Linux without the update-snapshots shortcut.

**Tech Stack:** Next.js 16 / React 19 / TypeScript (`ai-form-coach/`), Playwright 1.x, GitHub Actions (`ubuntu-latest`, `actions/setup-node@v4`, `actions/upload-artifact@v4`), Node 22.

**Branch:** `chore/close-brand-rollout-ci-gate` (already cut off `origin/dev` HEAD `951f912`).

**Spec:** `ai-form-coach/docs/superpowers/specs/2026-05-26-close-brand-rollout-ci-gate-design.md`

---

## File map

**Create:**
- `.github/workflows/release-gate.yml` — the CI workflow (the only new file).

**Modify:**
- `ai-form-coach/src/app/(marketing)/page.tsx` — strip 4 lines from the leading block comment (the AnimatedGradientBackground reference).
- `ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` — flip concern #6 status, add a Resolution sub-entry, add a row to the changelog table at the bottom.

**Delete:**
- `ai-form-coach/src/components/AnimatedGradientBackground.tsx` — orphan since Step 05, no real imports.

**Generate during verification (not by hand):**
- `ai-form-coach/tests/e2e/coach.visual.spec.ts-snapshots/*-linux.png` — seven new Linux baselines downloaded from the workflow's `updated-snapshots-linux` artifact after Task 5's first dispatch.

---

## Task 1: Delete the AnimatedGradientBackground orphan

**Files:**
- Delete: `ai-form-coach/src/components/AnimatedGradientBackground.tsx`
- Modify: `ai-form-coach/src/app/(marketing)/page.tsx` (lines 12-15 of the leading block comment)

- [ ] **Step 1.1: Confirm the orphan has no real imports**

Run from the worktree root:
```bash
grep -rn "AnimatedGradientBackground" ai-form-coach/src 2>&1 | grep -v "AnimatedGradientBackground.tsx:"
```

Expected output (one line):
```
ai-form-coach/src/app/(marketing)/page.tsx:13: * The legacy AnimatedGradientBackground variants (Hero/Nutrition/Plans)
```

If you see *any* additional line, **stop and reassess** — the component has a live import somewhere and deletion is not safe.

- [ ] **Step 1.2: Delete the orphan**

```bash
git rm ai-form-coach/src/components/AnimatedGradientBackground.tsx
```

Expected: `rm 'ai-form-coach/src/components/AnimatedGradientBackground.tsx'`.

- [ ] **Step 1.3: Strip the AnimatedGradientBackground comment block from `(marketing)/page.tsx`**

Use the Edit tool on `ai-form-coach/src/app/(marketing)/page.tsx` to remove the four-line section that mentions the deleted component.

**old_string** (six lines, includes the leading blank-asterisk and the closing rule line so the match is unambiguous):

```
 * Hero:     italic Fraunces "Return to your line." · single malachite CTA.
 *
 * The legacy AnimatedGradientBackground variants (Hero/Nutrition/Plans)
 * are intentionally NOT imported — marketing is bone editorial, not the
 * coach-app obsidian surface.
 * ──────────────────────────────────────────────────────────────────────── */
```

**new_string** (two lines — the Hero line, then the closing rule line directly):

```
 * Hero:     italic Fraunces "Return to your line." · single malachite CTA.
 * ──────────────────────────────────────────────────────────────────────── */
```

- [ ] **Step 1.4: Verify no leftover references**

```bash
grep -rn "AnimatedGradientBackground" ai-form-coach/ 2>&1 | grep -v node_modules
```

Expected: **no output** (zero references anywhere in the repo).

- [ ] **Step 1.5: Lint + typecheck still pass**

```bash
cd ai-form-coach && npm run lint
```

Expected: clean exit, no errors.

```bash
cd ai-form-coach && npx tsc --noEmit
```

Expected: no new TypeScript errors. (The pre-existing nutrition-types errors in `src/__tests__/integration/user-flows.test.ts` are tolerated per CLAUDE.md — leave them.)

- [ ] **Step 1.6: Commit**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27
git add ai-form-coach/src/components/AnimatedGradientBackground.tsx ai-form-coach/src/app/\(marketing\)/page.tsx
git commit -m "chore(brand): remove AnimatedGradientBackground orphan

File has been unused since Step 05's marketing-page rebuild (only
reference was a comment in (marketing)/page.tsx explaining why it
was NOT imported). Strip the comment alongside the file delete so
the diff reads as a self-contained removal.

War-room concern: #6 (brand rollout cleanup).
"
```

---

## Task 2: Flip war-room concern #6 to 🟢

**Files:**
- Modify: `ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` (two edits)

- [ ] **Step 2.1: Update the Status line + add a Resolution sub-entry**

Use the Edit tool on `ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`.

**old_string** (concern #6's Status + Owner lines verbatim):

```
**Status:** 🟡 in progress (this concern triggered the next branch)
**Owner:** Brand design team + Dev
```

**new_string** (status flipped + Resolution sub-entry added between Status and Owner):

```
**Status:** 🟢 resolved (2026-05-26)
**Owner:** Brand design team + Dev
**Resolution:** Seven-step Carriage rollout merged to `dev` across PRs #48 (tokens), #49 (fonts), #51 (Ribbon C mark + SiteHeader Lockup A), #52 (pose overlay → Form Line palette), #54 (marketing copy + bone editorial surface), #55 (OG keyart, favicon, app icons, manifest + font deploy fix), #56 (signature splash). PR #57 restored the e2e release gate.
```

- [ ] **Step 2.2: Add a row to the Resolution Log changelog**

Use the Edit tool on the same file.

**old_string** (the existing single-row changelog table):

```
| Date | Concern | Status change | Notes |
|------|---------|---------------|-------|
| 2026-05-17 | #6 Brand identity | 🔴 → 🟡 | Brand work scheduled as next branch |
```

**new_string** (adds one row beneath the existing one):

```
| Date | Concern | Status change | Notes |
|------|---------|---------------|-------|
| 2026-05-17 | #6 Brand identity | 🔴 → 🟡 | Brand work scheduled as next branch |
| 2026-05-26 | #6 Brand identity | 🟡 → 🟢 | Carriage rollout 7/7 merged (PRs #48–#56) + e2e gate restored (#57) |
```

- [ ] **Step 2.3: Sanity-check the file**

```bash
grep -E "^### 6\.|^\*\*Status:\*\*" ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md | head -8
```

Expected: line for `### 6. Brand identity gap …` followed by `**Status:** 🟢 resolved (2026-05-26)`.

```bash
tail -10 ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
```

Expected: the changelog table shows both rows, with the new 2026-05-26 row below the existing 2026-05-17 row.

- [ ] **Step 2.4: Commit**

```bash
git add ai-form-coach/docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
git commit -m "chore(war-room): flip concern #6 (brand identity gap) to resolved

Seven-step Carriage rollout merged across PRs #48-#56, plus #57
restoring the e2e release gate. The contract in BRAND_ROLLOUT.md
specifies this PR (not the brand-step PRs themselves) does the flip.

War-room concern: #6.
"
```

---

## Task 3: Add `.github/workflows/release-gate.yml`

**Files:**
- Create: `.github/workflows/release-gate.yml` (at the *repo root* — the worktree root, **not** `ai-form-coach/.github/`).

- [ ] **Step 3.1: Confirm the `.github/workflows/` directory exists**

```bash
ls .github/workflows/ 2>&1 || mkdir -p .github/workflows && ls .github/workflows/
```

Expected: directory exists (may be empty) or gets created.

- [ ] **Step 3.2: Write the workflow file**

Create `.github/workflows/release-gate.yml` at the worktree root with this exact content:

```yaml
name: release-gate

# Triggers (intentional frugality for solo-dev free-tier budget):
#   - pull_request against main: the integration-to-prod boundary auto-gates
#   - workflow_dispatch: manual run for ad-hoc verification or platform-baseline
#     regeneration (set the update_snapshots input to true)
#   - NOT triggered on push, NOT triggered on PRs against dev — those rely on
#     local `npm run test:release` discipline. See the dispatch rule of thumb
#     in docs/superpowers/specs/2026-05-26-close-brand-rollout-ci-gate-design.md.
on:
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      update_snapshots:
        description: "Pass --update-snapshots to Playwright (regenerates platform baselines, then exits success). Use this once after the workflow is added or whenever baselines drift on a new platform."
        required: false
        default: false
        type: boolean

concurrency:
  # Newer pushes on the same ref cancel older runs so the latest commit's signal
  # is authoritative and free-tier minutes aren't burned on superseded commits.
  group: release-gate-${{ github.ref }}
  cancel-in-progress: true

jobs:
  release-gate:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    defaults:
      run:
        # Next.js app lives under a subdir of the git repo root. Every step
        # runs from there unless explicitly overridden.
        working-directory: ai-form-coach

    # CI placeholders — the e2e tests use ?e2e-access=1 + loopback bypass, so
    # Supabase is constructed but never round-tripped. Build needs these
    # variables defined (non-null TS assertions, SSR static analysis); their
    # values are irrelevant in the test path. Real credentials would add
    # operational overhead for zero functional benefit at the current surface.
    env:
      NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-anon-key
      SUPABASE_SERVICE_ROLE_KEY: placeholder-service-key
      NEXT_PUBLIC_BASE_URL: http://127.0.0.1:3100

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22.x
          cache: npm
          cache-dependency-path: ai-form-coach/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        # chromium covers the `chromium` + `android-chrome` Playwright projects
        # (both use the chromium engine; android-chrome differs only in device
        # emulation flags). webkit covers `iphone-safari`. --with-deps installs
        # the OS-level libs webkit needs on Ubuntu.
        run: npx playwright install --with-deps chromium webkit

      - name: Run release gate
        # On a regular run (PR-against-main or dispatch with update_snapshots
        # left false) we simply chain `npm run test:release`. When the
        # update_snapshots input is true, we run the same chain explicitly so
        # we can append --update-snapshots to the Playwright leg. The other
        # legs (lint / unit / perf / build) are identical either way.
        shell: bash
        run: |
          if [ "${{ inputs.update_snapshots }}" = "true" ]; then
            echo "::notice::Regenerating Playwright snapshots for this platform."
            npm run lint
            npm run test
            npm run test:perf-smoke
            npm run build
            npx playwright test tests/e2e/auth.smoke.spec.ts tests/e2e/coach.smoke.spec.ts tests/e2e/coach.visual.spec.ts --update-snapshots
          else
            npm run test:release
          fi

      - name: Upload Playwright report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            ai-form-coach/playwright-report/
            ai-form-coach/test-results/
          retention-days: 14
          if-no-files-found: ignore

      - name: Upload regenerated baselines (update_snapshots only)
        if: ${{ inputs.update_snapshots == true && success() }}
        uses: actions/upload-artifact@v4
        with:
          name: updated-snapshots-linux
          path: ai-form-coach/tests/e2e/**/*-snapshots/
          retention-days: 14
          if-no-files-found: error
```

- [ ] **Step 3.3: Validate the YAML syntax locally**

```bash
node -e "const yaml=require('ai-form-coach/node_modules/yaml'); const fs=require('fs'); const doc=yaml.parse(fs.readFileSync('.github/workflows/release-gate.yml','utf8')); console.log('Parsed OK. Jobs:', Object.keys(doc.jobs));"
```

Expected: `Parsed OK. Jobs: [ 'release-gate' ]`

If the `yaml` module isn't installed (older `npm ci` runs), fall back to:

```bash
node -e "const fs=require('fs'); const t=fs.readFileSync('.github/workflows/release-gate.yml','utf8'); if(!t.includes('release-gate')||!t.includes('workflow_dispatch')||!t.includes('update_snapshots')||!t.includes('cancel-in-progress')) {console.error('FAIL: missing expected tokens'); process.exit(1);} console.log('Smoke-string check OK');"
```

Expected: `Smoke-string check OK`.

- [ ] **Step 3.4: Commit**

```bash
git add .github/workflows/release-gate.yml
git commit -m "ci: add release-gate workflow (PR-against-main + dispatch)

Wires npm run test:release into GitHub Actions. Triggers chosen for
free-tier frugality:

  - pull_request against main: gates the integration-to-prod boundary
  - workflow_dispatch: manual run with optional update_snapshots input
                       for regenerating platform-specific Playwright
                       baselines

NOT triggered on push or on PRs against dev — solo-dev runs the gate
locally before pushing feat/* branches. See the dispatch rule of thumb
in docs/superpowers/specs/2026-05-26-close-brand-rollout-ci-gate-design.md.

War-room concern: #4 (no CI workflow — release gate is a manual checklist).
"
```

---

## Task 4: Push the branch and dispatch the workflow once with `update_snapshots=true`

**Files:** none modified by this task — it produces an artifact that Task 5 commits.

- [ ] **Step 4.1: Push the branch to origin**

```bash
git push -u origin chore/close-brand-rollout-ci-gate
```

Expected: `* [new branch] chore/close-brand-rollout-ci-gate -> chore/close-brand-rollout-ci-gate`. The workflow file is now visible to GitHub; dispatch becomes available.

- [ ] **Step 4.2: Dispatch the workflow with `update_snapshots=true`**

Two options (pick whichever is easiest):

**Option A — `gh` CLI** (if you have `gh` authenticated):

```bash
gh workflow run release-gate.yml --ref chore/close-brand-rollout-ci-gate -f update_snapshots=true
echo "Dispatched. Watch with: gh run watch"
```

**Option B — GitHub UI:**

1. Open https://github.com/PaladinKnightMaster/AI_Form_Coach/actions/workflows/release-gate.yml
2. Click "Run workflow" (top right dropdown).
3. Branch: `chore/close-brand-rollout-ci-gate`.
4. `update_snapshots`: tick the **true** box.
5. Click "Run workflow".

- [ ] **Step 4.3: Wait for the run to finish (~7–10 minutes)**

```bash
gh run list --workflow=release-gate.yml --branch=chore/close-brand-rollout-ci-gate --limit=1
```

Watch until `status` reads `completed` and `conclusion` reads `success`.

Or in the UI, refresh the Actions tab until the run shows the green check.

- [ ] **Step 4.4: Confirm the `updated-snapshots-linux` artifact exists**

```bash
gh run view --log $(gh run list --workflow=release-gate.yml --branch=chore/close-brand-rollout-ci-gate --limit=1 --json databaseId --jq '.[0].databaseId') 2>&1 | grep -i "updated-snapshots-linux"
```

Or in the UI: open the run's summary page, scroll to "Artifacts" — confirm `updated-snapshots-linux` is listed.

**If the artifact is missing**, the run probably failed silently before the upload step. Inspect the logs, fix, and re-dispatch. Do not proceed to Task 5 without the artifact.

---

## Task 5: Download the Linux baselines and commit them

**Files:**
- Add (7 new files): `ai-form-coach/tests/e2e/coach.visual.spec.ts-snapshots/*-linux.png`

- [ ] **Step 5.1: Download the artifact**

**Option A — `gh` CLI:**

```bash
cd /d/1_PROJECT/PRIVATE_WORK/AI_Form_Coach/.claude/worktrees/adoring-sanderson-fd6c27
rm -rf /tmp/updated-snapshots-linux 2>/dev/null
gh run download $(gh run list --workflow=release-gate.yml --branch=chore/close-brand-rollout-ci-gate --limit=1 --json databaseId --jq '.[0].databaseId') -n updated-snapshots-linux -D /tmp/updated-snapshots-linux
```

**Option B — UI:**

1. Open the workflow run's summary page.
2. Under "Artifacts" → click `updated-snapshots-linux` → downloads a zip.
3. Extract to `/tmp/updated-snapshots-linux` (or wherever convenient).

- [ ] **Step 5.2: Verify the artifact contains the seven `*-linux.png` baselines**

```bash
find /tmp/updated-snapshots-linux -name "*-linux.png" | sort
```

Expected: seven files, mirroring the existing Windows set:
```
.../coach-mobile-active-android-android-chrome-linux.png
.../coach-mobile-active-iphone-iphone-safari-linux.png
.../coach-mobile-completed-android-android-chrome-linux.png
.../coach-mobile-paused-android-android-chrome-linux.png
.../coach-setup-plank-desktop-chromium-linux.png
.../coach-setup-pushup-desktop-chromium-linux.png
.../coach-setup-squat-desktop-chromium-linux.png
```

If you see fewer than seven, **stop** — Playwright didn't regenerate all of them. Re-dispatch with `update_snapshots=true` after investigating.

- [ ] **Step 5.3: Copy the Linux PNGs into the snapshot directory**

The artifact preserves the `tests/e2e/coach.visual.spec.ts-snapshots/` subpath. Find the matching subdir and copy:

```bash
SNAPS=$(find /tmp/updated-snapshots-linux -name "coach.visual.spec.ts-snapshots" -type d | head -1)
echo "Source snaps dir: $SNAPS"
cp "$SNAPS"/*-linux.png ai-form-coach/tests/e2e/coach.visual.spec.ts-snapshots/
ls ai-form-coach/tests/e2e/coach.visual.spec.ts-snapshots/ | sort
```

Expected: both `*-win32.png` and `*-linux.png` files now coexist (14 PNGs total).

- [ ] **Step 5.4: Sanity-check one of the new PNGs**

```bash
ls -la ai-form-coach/tests/e2e/coach.visual.spec.ts-snapshots/coach-setup-squat-desktop-chromium-linux.png
```

Expected: file exists, size > 30 KB (typical baseline range is 50–200 KB). A near-zero-byte file means the artifact was corrupt — re-dispatch.

- [ ] **Step 5.5: Commit the Linux baselines**

```bash
git add ai-form-coach/tests/e2e/coach.visual.spec.ts-snapshots/*-linux.png
git commit -m "ci: add Linux Playwright baselines alongside Windows ones

Generated by the release-gate workflow with update_snapshots=true.
Required because Playwright's toHaveScreenshot uses platform-suffixed
filenames — without these, CI on ubuntu-latest fails to find a
baseline and reports a 'missing snapshot' diff.

The seven Windows baselines committed in PR #57 remain in place
unchanged; both platforms now resolve a baseline from the same source.
"
```

- [ ] **Step 5.6: Push**

```bash
git push
```

Expected: branch updated on origin with the Linux baselines.

---

## Task 6: Dispatch the workflow again with `update_snapshots=false` to confirm green on Linux

**Files:** none modified — this is verification.

- [ ] **Step 6.1: Dispatch with `update_snapshots=false` (the default)**

**Option A — `gh` CLI:**

```bash
gh workflow run release-gate.yml --ref chore/close-brand-rollout-ci-gate
echo "Dispatched without --update-snapshots."
```

(Note: omitting `-f update_snapshots=...` lets the input default to `false`.)

**Option B — UI:** repeat Task 4.2 but leave the `update_snapshots` checkbox **unchecked**.

- [ ] **Step 6.2: Wait for the run to finish**

```bash
gh run watch
```

or refresh the Actions tab.

- [ ] **Step 6.3: Confirm the run is green**

```bash
gh run list --workflow=release-gate.yml --branch=chore/close-brand-rollout-ci-gate --limit=2
```

Expected: the most recent run shows `completed / success`. The penultimate run (from Task 4) is also there as a record.

**If the run fails:** download the `playwright-report` artifact and inspect. Common causes:
1. A `*-linux.png` baseline was missed in Step 5.3 — diff the snapshot dir against the artifact and re-commit.
2. The lint/unit/build leg flaked on Ubuntu — re-dispatch once to rule out transient issues before treating as a real failure.

---

## Task 7: Write the PR body and open the PR

**Files:** none modified — this prepares the PR description (per `CLAUDE.md`, the human opens the PR; we provide paste-ready text).

- [ ] **Step 7.1: Verify the branch state is clean and up to date with origin**

```bash
git status --short
git log --oneline origin/dev..HEAD
```

Expected: no unstaged/uncommitted changes; four local commits (Tasks 1, 2, 3, and 5 each produced one) on top of `origin/dev`.

- [ ] **Step 7.2: Compose the PR body**

Write a PR body that includes:

1. **Summary** — three deliverables in one sentence each.
2. **Scope table** — orphan delete / war-room flip / CI workflow.
3. **Trigger model** — restate the table from the spec (PR→main auto, dispatch otherwise, push/dev-PR explicitly *not* triggered).
4. **Manual-dispatch rule of thumb** — paste the five-bullet list from the spec.
5. **Verification log** — link to the two completed workflow runs (Tasks 4 and 6). Note Run 1 = update_snapshots=true (artifact produced, baselines committed); Run 2 = default (green on Linux from committed baselines).
6. **Recommended branch-protection follow-up** — Settings → Branches → `main` → require status checks → select `release-gate`. Out of code scope but the workflow doesn't *block* without it.
7. **Out of scope** — coach chrome sweep, splash-on-coach-entry, typed Wordmark/Display/Eyebrow components, other war-room concerns (#1, #3, #10, etc.). Each gets its own PR.

The human opens the PR via the URL printed by Task 4.1's push: https://github.com/PaladinKnightMaster/AI_Form_Coach/pull/new/chore/close-brand-rollout-ci-gate

- [ ] **Step 7.3: Hand the PR body to the human and stop**

Per the rollout contract, **do not run `gh pr create`**. Present the paste-ready PR body and the create-PR URL; the human opens it manually.

---

## Verification summary

After Task 6 lands, the PR shows:

- **One file deleted** (`AnimatedGradientBackground.tsx`).
- **Two files modified** (`(marketing)/page.tsx` comment strip, `11_BETA1_CONCERNS_TRACKER.md` status + changelog).
- **One file created** (`.github/workflows/release-gate.yml`).
- **Seven files created** (`*-linux.png` baselines).
- **Two GitHub Actions runs** on the branch: one with `update_snapshots=true` (produced the artifact), one with `update_snapshots=false` (green on Linux without the shortcut).
- **The `dev` → `main` auto-trigger** is *not* exercised inside this PR — it gets its first real test on the next `dev` → `main` PR, which any future feature will produce.

If all of the above is true, the brand chapter is officially closed and the gate self-enforces at the boundary that matters.

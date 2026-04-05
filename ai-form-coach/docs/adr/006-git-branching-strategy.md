# ADR-006: Git Branching Strategy (feature → dev → main)

**Status:** Accepted
**Date:** 2026-04-04
**Author:** Solo dev

## Context

A bug was deployed when a feature branch was created from `main` instead of `dev`. This bypassed the integration testing stage that `dev` provides. The project had no documented branching strategy, so each branch was created ad-hoc from whichever branch happened to be checked out.

## Decision

Adopt a strict three-tier branching model:

```
feature/fix branch → dev (integration) → main (production)
```

### Rules

1. **All new branches MUST be created from `dev`**, never from `main`
   ```bash
   git checkout dev && git pull origin dev
   git checkout -b fix/my-feature
   ```

2. **PRs target `dev` first** — merge feature/fix branches into `dev`

3. **Test on `dev`** — verify the change works correctly in the integration branch

4. **Only merge `dev` → `main`** when `dev` is verified stable

5. **Never push directly to `main` or `dev`** — always use PRs

6. **Branch naming convention:**
   - `fix/` — bug fixes
   - `feat/` — new features
   - `docs/` — documentation only
   - `refactor/` — code cleanup, no behavior change
   - `chore/` — dependencies, config, tooling

### Flow

```
main ─────────────────────────────────── (production, always stable)
  │                          ▲
  │                          │ PR: dev → main (after verification)
  ▼                          │
dev ──────────────────────────────────── (integration, test here)
  │          ▲         ▲
  │          │         │ PR: feature → dev
  ▼          │         │
feat/xyz ────┘    fix/abc ──┘
```

### Branch Cleanup

After a branch is merged to `dev` (and subsequently `dev` to `main`):
1. **Delete the remote branch** and **local branch** immediately
2. **Before starting new work**, clean up all stale merged branches:
   ```bash
   git fetch origin --prune
   git branch --merged origin/dev | grep -v "main\|dev" | xargs git branch -d
   ```
3. **Never reuse a merged branch** for new work — always create a fresh branch from `dev`

### One Branch, One Purpose

- Each branch solves **one thing**: a single bug fix, a single feature, or a single doc update
- Do NOT stack unrelated changes onto an existing branch (e.g., adding docs to a bug fix branch)
- If a new issue is discovered during work, finish and push the current branch, then create a new branch for the new issue

### Hotfix Exception

If `main` has a critical production bug and `dev` has untested changes:
1. Create hotfix branch from `main`: `git checkout main && git checkout -b fix/hotfix-name`
2. Fix, PR to `main`, merge
3. Immediately cherry-pick or merge `main` back into `dev` to keep them in sync

## Consequences

- **Easier:** Clear separation between tested and production code. Integration issues caught on `dev` before reaching `main`. No more "which branch did I create from?" confusion.
- **Harder:** Slightly more steps per feature (PR to dev, verify, PR to main). Worth the cost for a production app.
- **Risk:** `dev` can drift from `main` if not merged regularly. Mitigate by merging `dev` → `main` after every verified batch of changes.

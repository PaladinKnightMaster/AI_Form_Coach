# Accessibility Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit the public launch routes + `/coach` with axe-core/Playwright, fix every serious/critical WCAG 2.1 AA violation, wire the check into the release gate, and flip war-room #10 → 🟢.

**Architecture:** A chromium-only Playwright spec runs axe on each route and fails on any `serious`/`critical` violation (moderate/minor are logged). The fix phase is data-dependent — Task 3 produces the concrete violation list, Task 4 fixes them. Any contrast fix that needs a Carriage brand-token change is escalated for approval.

**Tech Stack:** `@axe-core/playwright`, Playwright (already a dep), Next 16. npm (not pnpm).

**Branch:** `fix/accessibility-audit` (cut from `dev`; spec committed).

**Commit trailer:** every commit ends with a blank line then `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

> **Controller-led tasks:** Tasks 3 and 4 are investigative (run the audit, triage, fix what axe actually reports) and involve the brand-token escalation — run by the controller (main session), who may dispatch subagents for individual, well-specified fixes. Tasks 1, 2, 5, 6 are straightforward.

---

## File Structure

- **Modify** `package.json` — add `@axe-core/playwright` devDep; extend `test:e2e:release`.
- **Create** `tests/e2e/a11y.spec.ts` — the axe audit spec.
- **Modify** (Task 4, data-dependent) whichever components/styles axe flags — likely
  `src/components/SiteHeader.tsx` / `SiteFooter.tsx`, `src/components/AuthCard.tsx`,
  `src/app/(marketing)/**` pages, `src/ui/DS.tsx`, `src/app/globals.css` (tokens).
- **Create** `docs/technical/accessibility.md` — audit results + deferred follow-ups.
- **Modify** `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` — #10 → 🟢.

---

## Task 1: add `@axe-core/playwright`

- [ ] **Step 1: Install** — `npm install -D @axe-core/playwright`. Expect `package.json`
  devDependencies to gain `@axe-core/playwright` (it brings `axe-core`). No `pnpm-lock.yaml`.

- [ ] **Step 2: Verify resolve** — `node -e "require('@axe-core/playwright'); console.log('ok')"` → `ok`.

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "build(test): add @axe-core/playwright for the a11y audit"
```

---

## Task 2: the axe audit spec

**Files:**
- Create: `tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Create `tests/e2e/a11y.spec.ts`** with EXACTLY:
```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Public launch routes + the coach (loopback bypass). /signup redirects to /signin.
// Auth-gated routes (history/settings/session) are deferred — CI has no signed-in user.
const ROUTES = [
  "/",
  "/pricing",
  "/signin",
  "/terms",
  "/privacy",
  "/medical-disclaimer",
  "/coach?e2e-access=1",
];

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type Violation = Awaited<
  ReturnType<InstanceType<typeof AxeBuilder>["analyze"]>
>["violations"][number];

function format(route: string, vs: Violation[]): string {
  if (vs.length === 0) return `${route}: clean`;
  return (
    `${route} — ${vs.length} a11y violation(s):\n` +
    vs
      .map(
        (v) =>
          `  • [${v.impact}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n` +
          `    nodes: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
      )
      .join("\n")
  );
}

for (const route of ROUTES) {
  test(`a11y: ${route} has no serious/critical WCAG violations`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "a11y audit runs on chromium only");

    await page.goto(route);
    await page.waitForLoadState("load");

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    const minor = results.violations.filter(
      (v) => v.impact === "moderate" || v.impact === "minor",
    );
    if (minor.length > 0) {
      console.log(`[a11y][moderate/minor] ${format(route, minor)}`);
    }

    expect(blocking, format(route, blocking)).toEqual([]);
  });
}
```

- [ ] **Step 2: Confirm it loads/compiles** — `npx tsc --noEmit` shows no new error in the
  spec; `npx playwright test tests/e2e/a11y.spec.ts --project=chromium --list` lists the 7 tests.
  (Do NOT commit yet — it will likely fail in Task 3; commit the spec together with the
  fixes, or commit now as a known-red baseline. Commit now as a baseline:)
```bash
git add tests/e2e/a11y.spec.ts
git commit -m "test(a11y): axe audit spec over public routes + coach (chromium)"
```

---

## Task 3 (CONTROLLER): run the audit, triage findings

- [ ] **Step 1: Run the audit** —
  `npx playwright test tests/e2e/a11y.spec.ts --project=chromium`
  (the Playwright webServer boots `next dev` on `127.0.0.1:3100` automatically).

- [ ] **Step 2: Capture the report.** For each failing route, record the serious/critical
  violations (rule id, impact, help URL, node targets) and the moderate/minor ones (for the
  follow-up doc). The assertion message already formats these.

- [ ] **Step 3: Triage into a fix list** grouped by rule id (e.g. `color-contrast`,
  `label`, `button-name`, `link-name`, `image-alt`, `landmark-*`, `heading-order`,
  `aria-*`). Note which are shared components (one fix clears many routes) vs page-specific.
  Identify any `color-contrast` failures whose only fix is changing a **brand token** —
  those go to the escalation in Task 4.

- [ ] **Step 4: Report the triage** to the user before fixing: the count by route + rule,
  and explicitly whether any fix requires a brand-color change.

---

## Task 4 (CONTROLLER, data-dependent): fix serious/critical violations

> No fabricated fixes here — the exact diffs come from Task 3's report. Apply the smallest
> correct fix per violation, re-running the audit after each group. Dispatch a subagent for
> a well-scoped individual fix when useful.

- [ ] **Step 1: Fix non-contrast violations** (labels, names, roles, landmarks, heading
  order, alt text). Prefer fixing shared components (`SiteHeader`/`SiteFooter`/`DS.tsx`/
  `AuthCard`) so multiple routes clear at once. After each group:
  `npx playwright test tests/e2e/a11y.spec.ts --project=chromium`.

- [ ] **Step 2: Contrast violations — BRAND-TOKEN HARD STOP.** For each `color-contrast`
  failure, determine the failing foreground/background pair and measured ratio. If it can be
  fixed *without* touching a Carriage brand token (e.g., a one-off utility class on a single
  element, increasing opacity, adding a scrim), do that. **If the only correct fix is changing
  a brand token** (`globals.css` `@theme` / CSS custom properties, e.g. `#8A6F4A`, `#C7B796`),
  STOP and present to the user a table: `token | current value | failing pair + measured ratio
  (need ≥ 4.5:1 text / 3:1 large) | proposed value + its ratio | rationale | my opinion`.
  Do NOT change any brand token without explicit approval.

- [ ] **Step 3: Re-run until zero serious/critical** across all 7 routes.
  `npx playwright test tests/e2e/a11y.spec.ts --project=chromium` → all pass.

- [ ] **Step 4: Lint/build** — `npm run lint`, `npm run build` green.

- [ ] **Step 5: Commit the fixes** (one commit, or grouped by area):
```bash
git add -A
git commit -m "fix(a11y): resolve serious/critical WCAG violations on public routes + coach"
```
(If any brand token changed after approval, mention it explicitly in the commit body.)

---

## Task 5: wire into the release gate + regression-check

**Files:**
- Modify: `package.json` (`test:e2e:release` script)

- [ ] **Step 1: Add the spec to `test:e2e:release`.** Change the script from:
```
"test:e2e:release": "playwright test tests/e2e/auth.smoke.spec.ts tests/e2e/coach.smoke.spec.ts tests/e2e/coach.visual.spec.ts"
```
to:
```
"test:e2e:release": "playwright test tests/e2e/auth.smoke.spec.ts tests/e2e/coach.smoke.spec.ts tests/e2e/coach.visual.spec.ts tests/e2e/a11y.spec.ts"
```

- [ ] **Step 2: Run the existing gate specs** to confirm the a11y fixes didn't regress them:
  `npx playwright test tests/e2e/auth.smoke.spec.ts tests/e2e/coach.smoke.spec.ts tests/e2e/coach.visual.spec.ts --project=chromium`.
  If `coach.visual` fails because an a11y fix changed the coach pixels, that is an expected
  re-baseline — flag it (it will be regenerated at `dev → main` with `update_snapshots`,
  same as the disclaimer micro-disclaimer change). Do not weaken assertions.

- [ ] **Step 3: Commit**
```bash
git add package.json
git commit -m "ci(test): include a11y.spec.ts in test:e2e:release"
```

---

## Task 6 (CONTROLLER): docs, tracker → 🟢, push

**Files:**
- Create: `docs/technical/accessibility.md`
- Modify: `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`

- [ ] **Step 1: Write `docs/technical/accessibility.md`** — tool (axe-core/playwright),
  WCAG 2.1 AA tags, the audited routes, the pass bar (zero serious/critical), a summary of
  what was fixed, the **moderate/minor findings logged as follow-up**, the **deferred
  auth-gated routes** (`history`, `settings`, `session/[id]`), and any **brand-token change**
  made (with before/after ratios) if approved. Fill the summary from the Task 3/4 report.

- [ ] **Step 2: Flip tracker #10 → 🟢** — set concern #10's `**Status:**` line to:
  `**Status:** 🟢 resolved (2026-05-30) — axe WCAG 2.1 AA audit: zero serious/critical on public routes + coach; gated in test:e2e:release`
  and append a Resolution Log row:
  `| 2026-05-30 | #10 Accessibility | 🔴 → 🟢 | axe-core/playwright audit over public routes + /coach; fixed all serious/critical WCAG 2.1 AA violations; added a11y.spec.ts to the release gate; moderate/minor + auth-gated routes documented as follow-ups |`

- [ ] **Step 3: Full local gate** — `npm run lint`, `npm run test` (unit), `npm run build`
  all green. (The full `test:release` incl. e2e runs in CI / pre-`dev→main`.)

- [ ] **Step 4: Commit + push**
```bash
git add docs/technical/accessibility.md docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
git commit -m "docs(a11y): document accessibility audit results; war-room #10 resolved"
git push -u origin fix/accessibility-audit
```
(Do NOT run `gh pr create`.)

- [ ] **Step 5: Invoke superpowers:finishing-a-development-branch** and present completion
  options + a paste-ready PR body. Note in the PR whether a `coach.visual` re-baseline is
  needed and whether any brand token changed (with approval reference).

---

## Self-Review

**Spec coverage:** add `@axe-core/playwright` (T1) ✓; chromium-only axe spec over the 7
routes with serious/critical bar + moderate/minor logging + formatViolations (T2) ✓; run
audit + triage (T3) ✓; fix serious/critical with brand-token HARD STOP escalation (T4) ✓;
wire into `test:e2e:release` + regression-check other specs incl. coach.visual flag (T5) ✓;
docs + tracker → 🟢 with moderate/minor + deferred auth routes (T6) ✓. Non-goals (auth-gated
routes, moderate/minor fixes, Lighthouse) respected.

**Placeholder scan:** Task 2 has full spec code. Tasks 3–4 are intentionally investigative
(an audit's fixes depend on axe output) — this is the nature of the work, not a hand-wave;
the procedure, grouping, and the brand-token escalation are fully specified, and concrete
diffs are produced at execution time from the report. No "TODO/implement-later" hidden in
otherwise-specifiable steps.

**Type/identifier consistency:** `AxeBuilder`, `.withTags(WCAG_TAGS)`, `.analyze()`,
`results.violations[].impact` are used consistently across T2; `test:e2e:release` script
string in T5 matches the current value (extended by exactly one spec path). The spec file
path `tests/e2e/a11y.spec.ts` is identical in T2, T5, T6.

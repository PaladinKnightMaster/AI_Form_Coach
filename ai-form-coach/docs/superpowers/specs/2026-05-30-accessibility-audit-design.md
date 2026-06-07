# Accessibility Audit — axe + Playwright (war-room #10)

**Date:** 2026-05-30
**Branch:** `fix/accessibility-audit`
**War-room concern:** #10 — No accessibility audit (WCAG); dark-only theme needs to be defensible.
**Goal:** audit the public launch routes + `/coach` for WCAG 2.1 AA with axe-core, fix all **serious/critical** violations, add the check to the release gate, and flip #10 → 🟢.

## Decisions (brainstorm, 2026-05-30)

- **Tooling:** `@axe-core/playwright` (axe injected into the real rendered DOM via the
  existing Playwright harness). Not Lighthouse (vaguer score, needs a separate rig).
- **Pass bar:** **zero `serious` + `critical`** axe violations. `moderate`/`minor` are
  reported and documented as a follow-up, not blocking.
- **Durability:** the a11y spec joins `test:e2e:release` → runs in `release-gate.yml`
  at `dev → main`, guarding regressions.
- **Scope:** `/`, `/pricing`, `/signin`, `/terms`, `/privacy`, `/medical-disclaimer`,
  and `/coach?e2e-access=1`. (`/signup` redirects to `/signin`.) Auth-gated routes
  (`history`, `settings`, `session/[id]`) deferred (CI has no signed-in user).
- **Brand colors:** if a contrast fix requires changing a Carriage brand token, **STOP**
  and present the list (token, current value, the failing pair + measured ratio, proposed
  value, rationale, opinion) for the user's approval before changing.

## Architecture

### Tooling
- Add devDependency `@axe-core/playwright` (pulls in `axe-core`).

### New spec — `tests/e2e/a11y.spec.ts`
- Runs **chromium only** (a11y violations are DOM-based; no value tripling across mobile
  projects). Guard: skip when `testInfo.project.name !== 'chromium'`.
- An array of routes (above). For each:
  ```ts
  await page.goto(route);
  await page.waitForLoadState("networkidle"); // and a stable selector where relevant
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  // log moderate/minor for the follow-up record
  // assert blocking is empty, with a message listing id / impact / help / node targets
  expect(blocking, formatViolations(route, blocking)).toEqual([]);
  ```
- `/coach?e2e-access=1`: the loopback bypass auto-grants the camera-permission gate;
  audit whatever shell renders (camera won't start in CI — same as `coach.smoke`).
- A small `formatViolations()` helper makes failures actionable (rule id, impact, help
  URL, and the offending CSS selectors).

### Wire into the gate
- Add `tests/e2e/a11y.spec.ts` to the `test:e2e:release` npm script (which
  `release-gate.yml` runs via `npm run test:release`). No snapshots → does not touch the
  `coach.visual` baseline process.

## Audit-then-fix flow

1. Write the spec; run it (`npm run test:e2e -- tests/e2e/a11y.spec.ts --project=chromium`).
2. It fails with the real violation list. Triage serious/critical by route.
3. Fix each (likely: form/button accessible names, `color-contrast`, landmark/heading
   order, link/image names). Re-run until zero serious/critical.
4. Record the moderate/minor findings in the spec/tracker as the follow-up.

**Likely fix sites (to be confirmed by axe):** `SiteHeader`/`SiteFooter` (landmarks,
link names), `AuthCard`/signin form (labels exist as `sr-only` — verify), the bone
editorial surfaces (`#8A6F4A`/`#C7B796` on `#FAF6EF` — contrast), the coach chrome
(low-opacity overlay text on video — the persistent micro-disclaimer already has a scrim),
and DS components (`Button`, `Badge`, `Icon` aria).

## The risk (explicit)

The **number/nature of violations is unknown until axe runs**. Most fixes are small
(a label, an aria attribute, a contrast nudge). The watch item is a **color-contrast
failure on a brand token** — fixing it may require nudging a Carriage color. Per the
decision above, any brand-token change is **stopped and escalated** for approval, with
measured contrast ratios and a recommendation. This makes the task's size data-dependent.

## Testing

- The a11y spec IS the test (it asserts zero serious/critical).
- Local run: `npx playwright test tests/e2e/a11y.spec.ts --project=chromium`.
- Gate: `test:e2e:release` includes it; `npm run lint` + `npm run build` stay green.
- Existing `auth.smoke` / `coach.smoke` / `coach.visual` must still pass (the a11y fixes
  must not change `coach.visual` snapshots — if a fix alters coach visuals, flag the
  re-baseline).

## Docs / tracker

- War-room tracker #10 → 🟢 (zero serious/critical on audited routes + gated), with the
  moderate/minor findings and the deferred auth-gated routes recorded as follow-ups.
- A short results summary in the spec or a `docs/technical/accessibility.md` (routes
  audited, tool, threshold, what was fixed, what's deferred).

## Non-goals

- Auth-gated routes (`history`, `settings`, `session/[id]`) now — deferred.
- Fixing `moderate`/`minor` violations now — documented follow-up.
- Lighthouse scoring, manual screen-reader testing matrix (Beta does the device-test gate
  separately), and full keyboard-nav E2E choreography (axe covers focusable-name/role).

## Rollout

Branch `fix/accessibility-audit` from `dev`, one purpose. User opens the PR manually.

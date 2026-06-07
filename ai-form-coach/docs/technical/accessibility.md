# Accessibility (WCAG 2.1 AA)

## Tooling & gate
- **`@axe-core/playwright`** runs axe against the real rendered DOM in the Playwright
  harness. Spec: `tests/e2e/a11y.spec.ts` (chromium only).
- WCAG rule tags: `wcag2a, wcag2aa, wcag21a, wcag21aa`.
- **Pass bar:** zero `serious` + `critical` violations (the test fails on those).
  `moderate`/`minor` are logged to the test console as a tracked follow-up, not blocking.
- Wired into `test:e2e:release` → runs in `release-gate.yml` at `dev → main`.

## Routes audited (Beta launch surface)
`/`, `/pricing`, `/signin` (= `/signup`), `/terms`, `/privacy`, `/medical-disclaimer`,
and `/coach?e2e-access=1` (loopback bypass). All pass with **0 serious/critical**.

## What was fixed (2026-05-30 audit)
All findings were `color-contrast`:
- **Brand token (approved):** the muted-gold label color `#8A6F4A` → **`#7A6240`**
  (was 4.11–4.37:1 on the bone surfaces, now ~5:1) across the marketing pages, `AuthCard`,
  and `SiteFooter`. A barely-perceptible darkening of the same hue, kept within the Carriage
  editorial palette.
- **Signin form:** the dark-themed widgets used semi-transparent backgrounds
  (`bg-slate-950/50`, `bg-slate-800/50`) that composited over the light bone `AuthCard` into
  muddy mid-grays, failing contrast with their white/slate text. Made them opaque
  (`bg-slate-950`, `bg-slate-900`, `bg-slate-800`) and darkened the loose on-bone text to
  `slate-600/700`.
- **Terms / Privacy:** body/eyebrow text `slate-500` → `slate-600` on the light bg; fixed two
  near-invisible hero badges (`gray-300`/`blue-300` on white, ~1:1).
- **Coach:** the device-summary line `slate-500` → `slate-400` on the dark stage.

## Deferred follow-ups
- **Auth-gated routes** — `history`, `settings`, `session/[id]` — not yet audited (CI has no
  signed-in user). Audit manually or wire a test session in a later pass.
- **`moderate`/`minor` violations** — logged by the spec (`[a11y][moderate/minor] …`); triage
  in a follow-up. Not blocking for Beta.
- Manual screen-reader passes and full keyboard-navigation choreography (the physical
  device-test gate covers real AT separately).

## Dark theme note
The coach is a dark shell; the marketing surface is the light "bone" editorial palette. Both
now meet AA contrast on the audited routes (the dark-only opinion is defensible: text/control
contrast is verified by axe).

## Running it locally
`npx playwright test tests/e2e/a11y.spec.ts --project=chromium`
(Playwright auto-boots the dev server on `127.0.0.1:3100`.)

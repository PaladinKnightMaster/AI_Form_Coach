# Design Guardrails & ADR System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install the four missing guardrails that the war room audit identified: (1) enforced design tokens, (2) formal design spec, (3) ADR system, (4) responsive layout strategy documentation. Plus generate Supabase DB types so `is_demo`-class bugs can't recur.

**Architecture:** This is a documentation + configuration task with one code-generation step (Supabase types). Design tokens get consolidated from 3 competing systems (CSS vars, theme.ts, inline Tailwind) into one authoritative source — Tailwind v4 `@theme` directive in globals.css plus CSS custom properties. ADRs formalize decisions already made but never recorded. The responsive spec documents what viewports the app targets and why.

**Tech Stack:** Next.js 16.0.7, React 19.1.0, Tailwind CSS 4.1.13 (CSS-first config via `@import "tailwindcss"` + `@tailwindcss/postcss`), Supabase Auth/DB (`@supabase/supabase-js` 2.56.1, `@supabase/ssr` 0.7.0), MediaPipe Tasks Vision 0.10.22 (browser-only pose detection), Zustand 5.0.8 (state management), Stripe (payments), Sentry (error monitoring), Google Generative AI / Gemini (async post-session features — NOT in live loop), Playwright (E2E testing), Supabase CLI (`supabase gen types`), Markdown (ADRs)

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `docs/design/DESIGN_SYSTEM.md` | Single source of truth for colors, typography, spacing, radii, shadows, component anatomy |
| Create | `docs/design/RESPONSIVE_STRATEGY.md` | Viewport targets, breakpoint rationale, layout grid per device class |
| Create | `docs/design/COMPONENT_SPEC.md` | Visual spec for each DS component (Button, Badge, Card, Input, etc.) |
| Create | `docs/adr/README.md` | ADR index and template |
| Create | `docs/adr/001-supabase-pkce-client-side-callback.md` | ADR: Why auth callback is client-side |
| Create | `docs/adr/002-10-joint-fitness-skeleton.md` | ADR: Why 10 joints, not 33 landmarks |
| Create | `docs/adr/003-browser-only-pose-no-cloud-llm.md` | ADR: No cloud LLM in live coaching loop |
| Create | `docs/adr/004-css-vars-plus-tailwind-tokens.md` | ADR: Design token strategy |
| Create | `docs/adr/005-mobile-first-camera-hero.md` | ADR: Camera viewport is the hero element |
| Modify | `tailwind.config.js` | Extend theme with full design token set (colors, spacing, radii, shadows, typography) |
| Modify | `src/app/globals.css` | Remove duplicate token definitions, reference Tailwind config as source of truth |
| Modify | `src/ui/theme.ts` | Deprecation notice pointing to Tailwind config |
| Create | `src/lib/supabase/database.types.ts` | Auto-generated Supabase DB types |
| Modify | `docs/INDEX.md` | Add Design System and ADR sections |
| Create | `CLAUDE.md` | Project context file for AI-assisted development |

---

## Task 1: Create CLAUDE.md Project Context

**Files:**
- Create: `CLAUDE.md` (project root: `ai-form-coach/CLAUDE.md`)

- [ ] **Step 1: Write CLAUDE.md**

```markdown
# AI Form Coach

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
- Design tokens: CSS custom properties in globals.css (runtime-switchable for light/dark) + Tailwind v4 config for static tokens. `src/ui/theme.ts` is deprecated. See ADR-004.
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
```

- [ ] **Step 2: Verify the file reads correctly**

Run: `head -5 CLAUDE.md`
Expected: First 5 lines of the file

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md project context for AI-assisted development"
```

---

## Task 2: Consolidate Design Tokens via Tailwind v4 CSS-First Config

**Files:**
- Modify: `src/app/globals.css` (add `@theme` block after `@import "tailwindcss"`)
- Modify: `tailwind.config.js` (keep minimal — content paths only, tokens move to CSS)
- Modify: `src/ui/theme.ts` (add deprecation notice)

**Context:** This project uses Tailwind CSS v4.1.13 with CSS-first config (`@import "tailwindcss"` + `@tailwindcss/postcss`). In Tailwind v4, the recommended approach is `@theme` directives in CSS, NOT `theme.extend` in a JS config file. The JS config is kept only for content path scanning and dark mode.

- [ ] **Step 1: Read current globals.css and tailwind.config.js**

Verify:
- `globals.css` starts with `@import "tailwindcss";`
- `tailwind.config.js` has minimal `theme.extend` with just `background` and `foreground`

- [ ] **Step 2: Add @theme block to globals.css**

Add immediately after the `@import "tailwindcss";` line in `src/app/globals.css`:

```css
/* ── Design Tokens (Tailwind v4 CSS-first) ──────────────────────────────
 * This @theme block is the SINGLE SOURCE OF TRUTH for design tokens.
 * Use these via Tailwind classes: bg-surface, text-brand, rounded-token-md, etc.
 * See docs/design/DESIGN_SYSTEM.md for rationale.
 * ─────────────────────────────────────────────────────────────────────── */
@theme {
  /* Brand colors — reference CSS custom properties for light/dark switching */
  --color-surface: var(--color-surface);
  --color-surface-secondary: var(--color-surface-secondary);
  --color-brand: var(--color-primary);
  --color-brand-light: var(--color-primary-light);
  --color-accent: var(--color-accent);
  --color-accent-light: var(--color-accent-light);
  --color-status-success: var(--color-success);
  --color-status-warning: var(--color-warning);
  --color-status-error: var(--color-error);
  --color-status-info: var(--color-info);
  --color-border: var(--color-border);
  --color-border-light: var(--color-border-light);
  --color-text: var(--color-text);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-muted: var(--color-text-muted);

  /* Border radius — 7 allowed stops, no arbitrary values */
  --radius-token-xs: 4px;
  --radius-token-sm: 8px;
  --radius-token-md: 12px;
  --radius-token-lg: 16px;
  --radius-token-xl: 24px;
  --radius-token-2xl: 32px;
  --radius-token-full: 999px;

  /* Shadows — reference CSS custom properties */
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);

  /* Fluid type scale */
  --font-size-fluid-xs: var(--step--1);
  --font-size-fluid-sm: var(--step-0);
  --font-size-fluid-base: var(--step-1);
  --font-size-fluid-lg: var(--step-2);
  --font-size-fluid-xl: var(--step-3);
  --font-size-fluid-2xl: var(--step-4);
}
```

- [ ] **Step 3: Simplify tailwind.config.js**

Keep only content paths and dark mode — tokens are now in CSS:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Add deprecation notice to theme.ts**

Add this comment block at top of `src/ui/theme.ts`:

```typescript
/**
 * @deprecated Design tokens now live in globals.css @theme block (Tailwind v4 CSS-first).
 * This file is kept for backward compatibility with components that import it directly.
 * New code should use Tailwind classes: bg-surface, text-brand, rounded-token-md, shadow-lg, etc.
 * See docs/design/DESIGN_SYSTEM.md for the full token reference.
 */
```

- [ ] **Step 5: Verify build still works**

Run: `npm run build 2>&1 | tail -5` (should complete without Tailwind errors)

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tailwind.config.js src/ui/theme.ts
git commit -m "design: add @theme token block (Tailwind v4 CSS-first), deprecate theme.ts"
```

---

## Task 3: Write Design System Spec

**Files:**
- Create: `docs/design/DESIGN_SYSTEM.md`
- Create: `docs/design/COMPONENT_SPEC.md`

- [ ] **Step 1: Create docs/design directory**

```bash
mkdir -p docs/design
```

- [ ] **Step 2: Write DESIGN_SYSTEM.md**

```markdown
# AI Form Coach Design System

> Single source of truth for visual design decisions.
> The `@theme` block in `globals.css` is the canonical token source (Tailwind v4 CSS-first).
> This document explains *why* — the `@theme` block defines *what*.

## Brand Identity

**Positioning:** Premium wellness technology. Think Whoop meets Peloton — not a dev tool or medical device.

**Visual Language:**
- Clean, minimal, lots of breathing room
- Camera viewport is always the hero
- Overlays are translucent and non-intrusive
- Dark-on-dark for in-session (camera stage), light for out-of-session (dashboard, history)

## Color Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `surface` | `#ffffff` | `#020617` (slate-950) | Page backgrounds |
| `surface-secondary` | `#f9fafb` (gray-50) | `#0f172a` (slate-900) | Card backgrounds |
| `brand` / `primary` | `#1f2937` (gray-800) | `#f8fafc` (slate-50) | Primary text, headings |
| `brand-light` | `#374151` (gray-700) | `#e2e8f0` (slate-200) | Secondary text |
| `accent` | `#7c3aed` (violet-600) | `#8b5cf6` (violet-500) | Links, focus rings |
| `success` | `#059669` (emerald-600) | `#34d399` (emerald-400) | Good form, framing OK |
| `warning` | `#d97706` (amber-600) | `#fbbf24` (amber-400) | Attention needed |
| `error` | `#dc2626` (red-600) | `#f87171` (red-400) | Bad form, camera issues |
| `info` | `#2563eb` (blue-600) | `#60a5fa` (blue-400) | Neutral badges, tips |

**Skeleton overlay palette** (canvas, not Tailwind — defined in `PoseOverlay.tsx`):

| Token | Value | Usage |
|-------|-------|-------|
| `edge` | `rgba(45, 212, 191, 0.85)` teal-400 | Normal skeleton lines |
| `edgeGlow` | `rgba(45, 212, 191, 0.25)` | Soft glow around lines |
| `joint` | `rgba(255, 255, 255, 0.95)` | Joint center dot |
| `jointRing` | `rgba(45, 212, 191, 0.7)` | Joint outer ring |
| `errorEdge` | `rgba(239, 68, 68, 0.9)` | Correction highlight |

## Typography

**Font Stack:** System fonts only (no web font load).
```
font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Fluid Scale** (clamp-based, responsive):

| Token | Min | Preferred | Max | Usage |
|-------|-----|-----------|-----|-------|
| `fluid-xs` | 0.79rem | calc(0.75rem + 0.21vw) | 0.89rem | Captions, badges |
| `fluid-sm` | 0.89rem | calc(0.83rem + 0.29vw) | 1rem | Body small |
| `fluid-base` | 1rem | calc(0.93rem + 0.36vw) | 1.13rem | Body |
| `fluid-lg` | 1.13rem | calc(1.02rem + 0.5vw) | 1.27rem | Subheadings |
| `fluid-xl` | 1.27rem | calc(1.13rem + 0.63vw) | 1.42rem | Section titles |
| `fluid-2xl` | 1.42rem | calc(1.25rem + 0.79vw) | 1.6rem | Page titles |

**Weight Scale:** regular(400), medium(500), semibold(600), bold(700), black(900)

## Spacing

**Base unit:** 8px (Tailwind's default `space-2` = 8px)

| Scale | Value | Usage |
|-------|-------|-------|
| `1` | 4px | Tight gaps (badge padding) |
| `2` | 8px | Default gap |
| `3` | 12px | Card padding (compact) |
| `4` | 16px | Card padding (default) |
| `6` | 24px | Section gaps |
| `8` | 32px | Page padding |
| `12` | 48px | Section padding |
| `16` | 64px | Hero spacing |

## Border Radius

**Allowed values (7 stops):**

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xs` | 4px | Tiny elements |
| `rounded-sm` | 8px | Badges, small pills |
| `rounded-md` | 12px | Inputs, small cards |
| `rounded-lg` | 16px | Cards, panels |
| `rounded-xl` | 24px | Stage shell, modals |
| `rounded-2xl` | 32px | Hero containers |
| `rounded-full` | 999px | Pills, avatars, toggles |

**Rule:** No arbitrary `rounded-[1.35rem]` values. Pick the nearest token.

## Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Cards, inputs (resting) |
| `shadow-md` | Elevated cards, dropdowns |
| `shadow-lg` | Modals, popovers |
| `shadow-xl` | Stage shell, hero elements |

## Z-Index Scale

| Value | Layer |
|-------|-------|
| `z-0` | Base content |
| `z-10` | Framing guide (behind skeleton) |
| `z-20` | Pose overlay (skeleton) |
| `z-30` | HUD badges, stage overlays |
| `z-40` | Mobile tray (fixed bottom) |
| `z-50` | Modals, dialogs |

## Interaction States

- **Focus:** 2px ring with `ring-accent/30` offset
- **Hover:** Lighten background by 1 shade
- **Active/Pressed:** Darken by 1 shade
- **Disabled:** `opacity-50 cursor-not-allowed`
- **Touch targets:** Minimum 44px height (iOS guideline)
```

- [ ] **Step 3: Write COMPONENT_SPEC.md**

```markdown
# Component Visual Spec

> Maps to components in `src/ui/DS.tsx`. Each component's allowed variants and their visual treatment.

## Button

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| `primary` | `emerald-600 → teal-600` gradient | white | none | `emerald-500 → teal-500` |
| `secondary` | white (light) / slate-800 (dark) | slate-700 / slate-200 | slate-200 / slate-700 | slate-50 / slate-700 |
| `ghost` | transparent | slate-600 / slate-300 | none | slate-100 / slate-800 |
| `outline` | transparent | slate-700 / slate-200 | slate-200 / slate-700 | slate-50 / slate-800 |
| `destructive` | red-600 | white | none | red-500 |

**Sizes:** sm (h-9), md (h-11), lg (h-12), xl (h-14)
**Radius:** `rounded-xl` (all sizes)
**Min touch target:** 44px effective height

## Badge

| Tone | Background | Text |
|------|-----------|------|
| `success` | emerald-50/900 | emerald-700/200 |
| `warning` | amber-50/900 | amber-700/200 |
| `error` | red-50/900 | red-700/200 |
| `info` | sky-50/900 | sky-700/200 |
| `neutral` | slate-100/800 | slate-600/300 |

**Sizes:** sm (text-[11px] px-2 py-0.5), md (text-xs px-2.5 py-1)
**Radius:** `rounded-full`

## Card

**Padding variants:** sm (p-4), default (p-5), lg (p-6)
**Radius:** `rounded-2xl`
**Background:** white / slate-900
**Border:** slate-200 / white/10
**Shadow:** `shadow-sm` (resting)

## Input

**Height:** h-11
**Radius:** `rounded-xl`
**Border:** slate-300 / slate-700
**Focus:** `ring-2 ring-accent/30 border-accent`
**Padding:** px-4

## Stage Shell (Coach Camera Container)

**Radius:** `rounded-2xl` outer, `rounded-xl` inner
**Background:** white/80 (light) / slate-950/72 (dark)
**Border:** white/60 (light) / white/10 (dark)
**Backdrop:** blur
**Shadow:** `shadow-xl`
```

- [ ] **Step 4: Commit**

```bash
git add docs/design/DESIGN_SYSTEM.md docs/design/COMPONENT_SPEC.md
git commit -m "docs: add design system spec and component visual spec"
```

---

## Task 4: Write Responsive Layout Strategy

**Files:**
- Create: `docs/design/RESPONSIVE_STRATEGY.md`

- [ ] **Step 1: Write RESPONSIVE_STRATEGY.md**

```markdown
# Responsive Layout Strategy

> Defines how the app adapts across device classes.
> All decisions trace back to one principle: **the camera viewport is the hero.**

## Device Classes & Breakpoints

| Class | Tailwind | Viewport | Primary Use Case |
|-------|----------|----------|-----------------|
| **Phone portrait** | default (< 640px) | 320-639px | Primary coaching device. Full-screen camera. |
| **Phone landscape / small tablet** | `sm:` (640px+) | 640-767px | Landscape coaching. Wider camera. |
| **Tablet** | `md:` (768px+) | 768-1023px | Camera switches to landscape aspect ratio. |
| **Desktop** | `lg:` (1024px+) | 1024-1279px | Side panels visible. Rich footer shows. |
| **Wide desktop** | `xl:` (1280px+) | 1280px+ | Wider stage, lower aspect ratio. |

## Layout Principles

### 1. Camera Stage Sizing

The camera stage aspect ratio adapts per viewport:

| Viewport | Aspect Ratio | Rationale |
|----------|-------------|-----------|
| Phone (active session) | `9:15` | Tall portrait — maximize body visibility |
| Phone (idle) | `9:14.2` | Slightly shorter to leave room for controls |
| Tablet (sm) | `10:16` | Still portrait-dominant |
| Tablet/Desktop (md+) | `16:10` | Landscape — natural desktop webcam ratio |
| Wide desktop (xl+) | `16:8.8` | Cinematic — less vertical space wasted |

### 2. Content Visibility by Viewport

| Element | Phone | Tablet (md) | Desktop (lg) | Wide (xl) |
|---------|-------|------------|--------------|-----------|
| Camera stage | Full width | Full width | Full width | Full width |
| Top badges | 1 badge | 2 badges | 3 badges | 3 badges |
| Stage alert | Hidden during active session | Hidden during active session | Visible | Visible |
| Live cue pill | Compact 1-line (mobile) | Compact 1-line | Rich footer panel | Rich footer panel |
| Mobile tray (bottom) | Visible during active | Visible during active | Hidden (use footer) | Hidden (use footer) |
| Support rails (3 cards) | Hidden during session | Hidden during session | Grid 3-col | Grid 3-col |
| Hero header | Hidden during session | Hidden during session | Visible | Visible |
| Rich stage footer | Hidden | Hidden | Visible | Visible |

### 3. Progressive Disclosure

Phone shows **minimum viable coaching UI**:
- Camera + skeleton overlay
- 1 quality badge (top-left)
- Mirror/mute toggles (top-right)
- Live cue + reps/elapsed (compact pill, top)
- Pause/End buttons (bottom tray)

Each larger breakpoint **adds** information, never rearranges the core layout:
- `sm:` → Second badge, wider camera
- `md:` → Landscape aspect ratio
- `lg:` → Rich footer with cue text + summary chips, support rail cards, hero header
- `xl:` → Wider cinematic stage

### 4. Safe Areas

- iOS notch/Dynamic Island: `env(safe-area-inset-top)` on page shell
- iOS home indicator: `env(safe-area-inset-bottom)` on bottom padding and mobile tray
- `viewport-fit=cover` in HTML head

### 5. Touch Targets

- All interactive elements: minimum 44px effective height
- Buttons: explicit min-height via Tailwind size classes
- Badge toggles: `py-2 px-3` (44px+ with text)
- Sufficient gap between adjacent targets: minimum 8px

## Out-of-Session Pages

| Page | Phone | Tablet | Desktop |
|------|-------|--------|---------|
| History | Single column, full width cards | 2-column grid | 3-column grid |
| Session detail | Stacked sections | Side-by-side stats + timeline | Same |
| Settings | Full width form | Centered max-w-lg | Centered max-w-lg |
| Sign in | Full width | Centered max-w-md | Centered max-w-md |
| Pricing | Single column | 2-column plan cards | 3-column plan cards |
```

- [ ] **Step 2: Commit**

```bash
git add docs/design/RESPONSIVE_STRATEGY.md
git commit -m "docs: add responsive layout strategy for all device classes"
```

---

## Task 5: Create ADR System with Initial Records

**Files:**
- Create: `docs/adr/README.md`
- Create: `docs/adr/001-supabase-pkce-client-side-callback.md`
- Create: `docs/adr/002-10-joint-fitness-skeleton.md`
- Create: `docs/adr/003-browser-only-pose-no-cloud-llm.md`
- Create: `docs/adr/004-css-vars-plus-tailwind-tokens.md`
- Create: `docs/adr/005-mobile-first-camera-hero.md`

- [ ] **Step 1: Write ADR README with template**

```markdown
# Architecture Decision Records

Lightweight ADRs recording **why** decisions were made. When future development conflicts with a past decision, check if the ADR still holds before changing direction.

## Index

| # | Decision | Status | Date |
|---|----------|--------|------|
| 001 | [Supabase PKCE: Client-Side Auth Callback](001-supabase-pkce-client-side-callback.md) | Accepted | 2026-03-28 |
| 002 | [10-Joint Fitness Skeleton](002-10-joint-fitness-skeleton.md) | Accepted | 2026-03 |
| 003 | [Browser-Only Pose, No Cloud LLM in Loop](003-browser-only-pose-no-cloud-llm.md) | Accepted | 2026-03 |
| 004 | [CSS Vars + Tailwind Design Tokens](004-css-vars-plus-tailwind-tokens.md) | Accepted | 2026-04-01 |
| 005 | [Mobile-First Camera Hero Layout](005-mobile-first-camera-hero.md) | Accepted | 2026-04-01 |

## Template

When adding a new ADR, use this format:

    # ADR-NNN: [Title]

    **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNN
    **Date:** YYYY-MM-DD
    **Author:** [name]

    ## Context
    What is the issue we're facing? What forces are at play?

    ## Decision
    What did we decide and why?

    ## Consequences
    What are the trade-offs? What becomes easier? What becomes harder?
```

- [ ] **Step 2: Write ADR-001 (PKCE Client-Side Callback)**

```markdown
# ADR-001: Supabase PKCE Client-Side Auth Callback

**Status:** Accepted
**Date:** 2026-03-28
**Author:** Solo dev

## Context

Supabase Auth uses PKCE flow for email magic links and password resets. The PKCE `code_verifier` is stored in the browser's `localStorage` by `createBrowserClient`. When a user clicks a magic link, the redirect URL must exchange the authorization code using this `code_verifier`.

Originally, the auth callback was a Next.js server-side Route Handler (`src/app/auth/callback/route.tsx`). This failed 100% of the time because server-side code cannot access browser `localStorage`.

## Decision

Replace the server-side Route Handler with a client-side React page (`src/app/auth/callback/page.tsx`). The page:
1. Reads `code` from URL search params
2. Calls `supabase.auth.exchangeCodeForSession(code)` using the browser client (which has `localStorage` access)
3. Falls back to checking `getUser()` for implicit flow sessions
4. Handles errors with recovery UI

## Consequences

- **Easier:** Magic links, password resets, and all PKCE flows work correctly
- **Harder:** Callback page shows a brief loading state (not instant redirect). This is acceptable for auth flows.
- **Risk:** If Supabase changes PKCE storage from `localStorage` to cookies, this ADR should be revisited
```

- [ ] **Step 3: Write ADR-002 (10-Joint Fitness Skeleton)**

```markdown
# ADR-002: 10-Joint Fitness Skeleton

**Status:** Accepted
**Date:** 2026-03
**Author:** Solo dev

## Context

MediaPipe Pose provides 33 landmarks per frame. Most landmarks are irrelevant for fitness form coaching (face mesh points, individual finger joints). Rendering all 33 creates visual clutter and makes form correction highlighting ambiguous.

## Decision

Reduce to 10 fitness-relevant joints: shoulders, elbows, wrists, hips, knees, ankles. Plus derived joints (head_center, torso_center) calculated from raw landmarks. This is defined in `src/lib/pose/contracts.ts` as `FitnessJointId` and `DerivedJointId`.

Skeleton edges are defined as `FITNESS_SKELETON_EDGES` — a curated list of connections between these joints.

## Consequences

- **Easier:** Clean skeleton overlay, easier to highlight specific joints for form corrections, less computation per frame
- **Harder:** Cannot coach fine motor movements (wrist angle in yoga, finger placement in climbing)
- **Revisit when:** Adding exercises that need face, hands, or feet detail
```

- [ ] **Step 4: Write ADR-003 (Browser-Only Pose)**

```markdown
# ADR-003: Browser-Only Pose Detection, No Cloud LLM in Live Loop

**Status:** Accepted
**Date:** 2026-03
**Author:** Solo dev

## Context

The coaching loop runs at 15-30fps. Each frame needs pose detection + form evaluation + cue generation. Sending frames to a cloud LLM would add 200-500ms latency per frame, making real-time coaching impossible. It would also create per-frame API costs that are incompatible with a freemium model.

## Decision

All pose detection and form evaluation runs in the browser using @mediapipe/tasks-vision (Pose Landmarker Lite model). Coaching cues are generated from deterministic rules (angle thresholds, rep state machines) defined in `src/lib/coach/`. No cloud API calls during the active coaching session.

Google Generative AI (Gemini) via `@google/generative-ai` is available for **async** features only — post-session analysis, workout plan generation, and conversational coaching review. These are not part of the live frame loop. Future phases may add Claude for more advanced async analysis.

## Consequences

- **Easier:** Zero latency for coaching, works offline, no per-frame cost, privacy-preserving (video never leaves device)
- **Harder:** Coaching quality is limited by rule complexity (no LLM reasoning about novel movement patterns)
- **Revisit when:** WebGPU enables fast on-device LLM inference, or a streaming API achieves <50ms latency
```

- [ ] **Step 5: Write ADR-004 (Design Token Strategy)**

```markdown
# ADR-004: CSS Custom Properties + Tailwind Config for Design Tokens

**Status:** Accepted
**Date:** 2026-04-01
**Author:** Solo dev

## Context

The codebase had three competing color/token systems:
1. CSS custom properties in `globals.css` (15 color vars, shadows, fluid type scale)
2. TypeScript `theme` object in `src/ui/theme.ts` (colors, spacing, radii, shadows)
3. Inline Tailwind classes with hardcoded values (`rounded-[1.35rem]`, `bg-slate-950/72`)

This fragmentation caused visual inconsistency: 14 different border-radius values, no single source of truth, and every component styled independently.

## Decision

- **Source of truth:** `@theme` block in `globals.css` (Tailwind v4 CSS-first approach). References CSS custom properties for runtime-switchable values (colors, shadows) and defines static tokens (radii) directly.
- **CSS custom properties** remain in `globals.css` `:root` / `.dark` blocks for values that change between light/dark mode. The `@theme` block references these via `var()`.
- **`tailwind.config.js`** is minimal — only content paths and dark mode strategy. Tokens are NOT in the JS config.
- **`theme.ts` is deprecated** — kept for backward compatibility but new code uses Tailwind classes
- **No arbitrary values** — use the defined token stops. `rounded-token-xl` not `rounded-[1.35rem]`

## Consequences

- **Easier:** One place to check for allowed values (`@theme` block at top of globals.css). IDE autocomplete via Tailwind IntelliSense. Consistent visual output. Tailwind v4 native approach — no legacy JS config debt.
- **Harder:** Migrating existing arbitrary values to tokens requires a sweep (tracked as tech debt). Some Tailwind v4 `@theme` syntax may differ from v3 tutorials — team must reference v4 docs.
- **Risk:** Canvas-rendered elements (PoseOverlay) can't use Tailwind — skeleton colors remain as a `SKELETON_COLORS` constant in the component file. This is acceptable as canvas has different rendering semantics.
```

- [ ] **Step 6: Write ADR-005 (Mobile-First Camera Hero)**

```markdown
# ADR-005: Mobile-First Camera Hero Layout

**Status:** Accepted
**Date:** 2026-04-01
**Author:** Solo dev

## Context

Users perform exercises in front of their phone camera. The camera viewport is the primary interface during coaching — everything else (cues, stats, controls) is secondary. Early UI iterations had overlays that covered 40-60% of the camera, making it hard to see your own body and the skeleton overlay.

## Decision

- Camera stage is always the hero element — occupies maximum available viewport
- All overlays are translucent (`bg-slate-950/50` not `bg-slate-950/82`), minimal, and avoid the center body area
- Progressive disclosure: phone shows minimum UI, larger screens add info panels
- Active session on mobile: hide non-essential elements (stage alert, hero header, support rails)
- Framing guide renders BELOW skeleton (z-10 vs z-20) so pose feedback is always visible
- Bottom controls use fixed tray (mobile) or inline footer (desktop)

Layout specifics documented in `docs/design/RESPONSIVE_STRATEGY.md`.

## Consequences

- **Easier:** Users can see their body and skeleton clearly. Premium feel.
- **Harder:** Limited screen real estate for coaching text on mobile — cues must be very concise
- **Revisit when:** Adding AR-style overlays that need to coexist with the skeleton
```

- [ ] **Step 7: Commit all ADRs**

```bash
git add docs/adr/
git commit -m "docs: add ADR system with 5 initial architecture decision records"
```

---

## Task 6: Generate Supabase Database Types

**Files:**
- Create: `src/lib/supabase/database.types.ts`

- [ ] **Step 1: Check if Supabase CLI is available**

Run: `npx supabase --version`

If not installed: `npm install -D supabase`

- [ ] **Step 2: Generate types from live database**

Run: `npx supabase gen types typescript --project-id kqmjhjtfogplhmzzbxnw > src/lib/supabase/database.types.ts`

Note: This requires `SUPABASE_ACCESS_TOKEN` to be set. If not available, create a placeholder file:

```typescript
/**
 * Auto-generated Supabase database types.
 *
 * Regenerate with:
 *   npx supabase gen types typescript --project-id $PROJECT_ID > src/lib/supabase/database.types.ts
 *
 * This file prevents schema mismatches like the is_demo column bug.
 * Always regenerate after running migrations.
 */
export type Database = {
  // TODO: Run `npx supabase gen types` with access token to populate
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "chore: add Supabase database types (regenerate after migrations)"
```

---

## Task 7: Update docs/INDEX.md with New Sections

**Files:**
- Modify: `docs/INDEX.md`

- [ ] **Step 1: Add Design System and ADR sections to INDEX.md**

Add after the existing "Deployment & Configuration" section:

```markdown
## Design System

| Document | What it covers |
| --- | --- |
| [Design System Spec](design/DESIGN_SYSTEM.md) | Colors, typography, spacing, radii, shadows, z-index, interaction states |
| [Component Spec](design/COMPONENT_SPEC.md) | Visual spec for Button, Badge, Card, Input, Stage Shell |
| [Responsive Strategy](design/RESPONSIVE_STRATEGY.md) | Viewport targets, breakpoint rationale, layout per device class |

## Architecture Decision Records

| # | Decision |
| --- | --- |
| [001](adr/001-supabase-pkce-client-side-callback.md) | Supabase PKCE: client-side auth callback |
| [002](adr/002-10-joint-fitness-skeleton.md) | 10-joint fitness skeleton (not 33 landmarks) |
| [003](adr/003-browser-only-pose-no-cloud-llm.md) | Browser-only pose, no cloud LLM in live loop |
| [004](adr/004-css-vars-plus-tailwind-tokens.md) | CSS vars + Tailwind config for design tokens |
| [005](adr/005-mobile-first-camera-hero.md) | Mobile-first camera hero layout |
```

- [ ] **Step 2: Commit**

```bash
git add docs/INDEX.md
git commit -m "docs: add design system and ADR sections to docs index"
```

---

## Self-Review

**Spec coverage:**
- Design tokens consolidation: Task 2 (Tailwind config) + Task 3 (spec doc)
- Design spec: Task 3 (DESIGN_SYSTEM.md + COMPONENT_SPEC.md)
- Responsive strategy (mobile + tablet + PC): Task 4
- ADRs as guardrails: Task 5 (5 ADRs covering the major decisions)
- Schema validation: Task 6 (Supabase types generation)
- Project context file: Task 1 (CLAUDE.md)
- All gaps identified in war room audit addressed

**Placeholder scan:** No TBD/TODO except the intentional Supabase types placeholder (requires access token).

**Type consistency:** No code types introduced — this is primarily a documentation plan with one config change (tailwind.config.js).

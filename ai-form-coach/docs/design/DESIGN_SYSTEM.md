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

| Token | Dark (Universal) | Usage |
|-------|------------------|-------|
| `surface` | `#020617` (slate-950) | Page backgrounds |
| `surface-secondary` | `#0f172a` (slate-900) | Card/glass backgrounds |
| `brand` / `primary` | `#f8fafc` (slate-50) | Primary text, headings |
| `brand-light` | `#e2e8f0` (slate-200) | Secondary text |
| `accent` | `#10b981` (emerald-500) | Core branding, focus rings |
| `success` | `#34d399` (emerald-400) | Good form, framing OK |
| `warning` | `#fbbf24` (amber-400) | Attention needed |
| `error` | `#ef4444` (red-500) | Bad form, camera issues |
| `info` | `#3b82f6` (blue-500) | Neutral badges, tips |

**Skeleton overlay palette** (canvas, not Tailwind — defined in `PoseOverlay.tsx` `SKELETON_COLORS`):

| Token | Value | Usage |
|-------|-------|-------|
| `edge` | `rgba(45, 212, 191, 0.85)` teal-400 | Normal skeleton lines |
| `edgeGlow` | `rgba(45, 212, 191, 0.25)` | Soft glow around lines |
| `joint` | `rgba(255, 255, 255, 0.95)` | Joint center dot |
| `jointRing` | `rgba(45, 212, 191, 0.7)` | Joint outer ring |
| `errorEdge` | `rgba(239, 68, 68, 0.9)` | Correction highlight |

## Typography

**Font Stack:** Google Fonts `Inter` (loaded via `next/font/google`).
```
font-family: var(--font-inter), sans-serif;
```

**Fluid Scale** (clamp-based, responsive):

| Token | Min | Max | Usage |
|-------|-----|-----|-------|
| `fluid-xs` | 0.79rem | 0.89rem | Captions, badges |
| `fluid-sm` | 0.89rem | 1rem | Body small |
| `fluid-base` | 1rem | 1.13rem | Body |
| `fluid-lg` | 1.13rem | 1.27rem | Subheadings |
| `fluid-xl` | 1.27rem | 1.42rem | Section titles |
| `fluid-2xl` | 1.42rem | 1.6rem | Page titles |

**Weight Scale:** regular(400), medium(500), semibold(600), bold(700), black(900)

## Spacing

**Base unit:** 8px (Tailwind default `space-2` = 8px)

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
| `rounded-token-xs` | 4px | Tiny elements |
| `rounded-token-sm` | 8px | Badges, small pills |
| `rounded-token-md` | 12px | Inputs, small cards |
| `rounded-token-lg` | 16px | Cards, panels |
| `rounded-token-xl` | 24px | Stage shell, modals |
| `rounded-token-2xl` | 32px | Hero containers |
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

# ADR-004: CSS Custom Properties + Tailwind v4 CSS-First Design Tokens

**Status:** Accepted
**Date:** 2026-04-01
**Author:** Solo dev

## Context

The codebase had three competing color/token systems:
1. CSS custom properties in `globals.css` (15 color vars, shadows, fluid type scale)
2. TypeScript `theme` object in `src/ui/theme.ts` (colors, spacing, radii, shadows)
3. Inline Tailwind classes with hardcoded values (`rounded-[1.35rem]`, `bg-slate-950/72`)

This fragmentation caused visual inconsistency: 14+ different border-radius values, no single source of truth, and every component styled independently.

## Decision

- **Source of truth:** `@theme` block in `globals.css` (Tailwind v4 CSS-first approach). References CSS custom properties for runtime-switchable values (colors, shadows) and defines static tokens (radii) directly.
- **CSS custom properties** remain in `globals.css` `:root` / `.dark` blocks for values that change between light/dark mode. The `@theme` block references these via `var()`.
- **`tailwind.config.js`** is minimal — only content paths and dark mode strategy. Tokens are NOT in the JS config.
- **`theme.ts` is deprecated** — kept for backward compatibility but new code uses Tailwind classes
- **No arbitrary values** — use the defined token stops. `rounded-token-xl` not `rounded-[1.35rem]`

## Consequences

- **Easier:** One place to check for allowed values (`@theme` block at top of globals.css). IDE autocomplete via Tailwind IntelliSense. Consistent visual output. Tailwind v4 native approach.
- **Harder:** Migrating existing arbitrary values to tokens requires a sweep (tracked as tech debt). Some Tailwind v4 `@theme` syntax may differ from v3 tutorials.
- **Risk:** Canvas-rendered elements (PoseOverlay) can't use Tailwind — skeleton colors remain as a `SKELETON_COLORS` constant in the component file. This is acceptable as canvas has different rendering semantics.

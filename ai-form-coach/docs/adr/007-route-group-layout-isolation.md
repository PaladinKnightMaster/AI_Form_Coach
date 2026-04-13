# ADR-007: Route Group Layout Isolation

**Status:** Accepted
**Date:** 2026-04-12
**Author:** Solo dev

## Context

The coach page needs a full-bleed, immersive camera-stage experience (no header, no footer, no scroll, dark shell filling the viewport). Marketing pages (home, pricing, history, auth, etc.) need the standard SiteHeader/SiteFooter chrome. Both share the same root providers (AuthProvider, ToastProvider).

Before this decision, the root layout rendered SiteHeader and SiteFooter for all routes, and the coach page had to fight against the shared chrome with negative margins, z-index hacks, and `overflow-hidden` on body.

## Decision

Use Next.js App Router **route groups** to isolate layouts without affecting URL structure:

```
src/app/
  layout.tsx              ← Root: providers-only (Auth, Toast, Inter font, dark theme)
  (marketing)/
    layout.tsx            ← SiteHeader + <main> + SiteFooter + ErrorBoundary
    page.tsx              ← / (home)
    pricing/page.tsx      ← /pricing
    history/page.tsx      ← /history
    signin/page.tsx       ← /signin
    ...13 total routes
  (coach)/
    layout.tsx            ← Bare dark shell: h-screen h-[100dvh] overflow-hidden bg-slate-950
    coach/page.tsx        ← /coach
```

**Key principles:**
- Root layout owns only providers and global config (font, theme, analytics). No visual chrome.
- `(marketing)` layout adds header/footer/error boundary — the "website" shell.
- `(coach)` layout adds the immersive dark viewport — the "app" shell.
- URL paths are unchanged: `/coach`, `/pricing`, `/history` etc.
- `h-screen h-[100dvh]` is progressive enhancement — `100dvh` handles mobile browser chrome, `100vh` is the fallback.

## Consequences

- **Easier:** Coach page gets a clean viewport with zero layout inheritance conflicts. Adding new marketing pages doesn't require any coach-specific workarounds. Each layout is simple and self-contained.
- **Harder:** Moving a page between groups requires updating its path in `src/app/` and updating any test imports that reference the old path.
- **Convention:** Named by user intent (`marketing` / `coach`), not implementation detail (`public` / `protected`). This is consistent with Next.js community patterns (Cal.com, Vercel templates).
- **Revisit when:** Adding a third layout variant (e.g., an onboarding flow with its own chrome, or a dashboard with a left sidebar).

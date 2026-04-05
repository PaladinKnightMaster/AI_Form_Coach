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

- **Easier:** Users can see their body and skeleton clearly. Premium feel matches Sword Health / Whoop / Peloton aesthetic.
- **Harder:** Limited screen real estate for coaching text on mobile — cues must be very concise (one line)
- **Revisit when:** Adding AR-style overlays that need to coexist with the skeleton, or adding a split-screen replay mode

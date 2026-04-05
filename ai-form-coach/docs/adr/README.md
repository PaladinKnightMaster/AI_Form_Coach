# Architecture Decision Records

Lightweight ADRs recording **why** decisions were made. When future development conflicts with a past decision, check if the ADR still holds before changing direction.

## Index

| # | Decision | Status | Date |
|---|----------|--------|------|
| 001 | [Supabase PKCE: Client-Side Auth Callback](001-supabase-pkce-client-side-callback.md) | Accepted | 2026-03-28 |
| 002 | [10-Joint Fitness Skeleton](002-10-joint-fitness-skeleton.md) | Accepted | 2026-03 |
| 003 | [Browser-Only Pose, No Cloud LLM in Live Loop](003-browser-only-pose-no-cloud-llm.md) | Accepted | 2026-03 |
| 004 | [CSS Vars + Tailwind v4 Design Tokens](004-css-vars-plus-tailwind-tokens.md) | Accepted | 2026-04-01 |
| 005 | [Mobile-First Camera Hero Layout](005-mobile-first-camera-hero.md) | Accepted | 2026-04-01 |

## Template

When adding a new ADR, copy this format:

```
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

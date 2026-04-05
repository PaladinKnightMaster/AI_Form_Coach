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

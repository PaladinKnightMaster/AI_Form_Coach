# Sentry Error Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate AI Form Coach from `@sentry/browser` (client-only, partially wired) to the full `@sentry/nextjs` SDK capturing client + server + edge errors, then verify on a Vercel preview deploy (war-room concern #3).

**Architecture:** A single shared options module (`getSentryInitOptions()`) feeds `Sentry.init` in three runtime entrypoints (`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`); `instrumentation.ts` wires the server/edge configs and exports `onRequestError`. `next.config.ts` is wrapped with `withSentryConfig` for source-map upload. Error-only (no tracing/replay/PII) for Beta 1. A temporary, production-gated `/sentry-check` surface drives preview verification and is torn down at the end.

**Tech Stack:** Next.js 16.0.7 (App Router, Turbopack), `@sentry/nextjs`, TypeScript, Vitest. Repo is npm (not pnpm).

**Config values (known):** org slug `paladinknightmaster`, project slug `ai-form-coach`. Env vars: `NEXT_PUBLIC_SENTRY_DSN` (already in Vercel), `SENTRY_AUTH_TOKEN` (user creates Org token, adds to Vercel build env).

**Branch:** `feat/sentry-error-monitoring` (already cut from `dev`; spec committed at `8bee3d8`).

**Note on commits:** all commit messages in this plan should end with the project's `Co-Authored-By` trailer.

---

## File Structure

**Create:**
- `src/lib/observability/sentryConfig.ts` — shared `getSentryInitOptions()` (single source of truth).
- `src/__tests__/mvp/sentryConfig.test.ts` — unit test for the options gating logic (in `mvp/` so it runs in `npm run test` + CI gate).
- `instrumentation-client.ts` — browser `Sentry.init`.
- `sentry.server.config.ts` — Node runtime `Sentry.init`.
- `sentry.edge.config.ts` — edge runtime `Sentry.init`.
- `instrumentation.ts` — `register()` + `onRequestError`.
- `src/app/api/sentry-check/route.ts` — TEMP server-error trigger (gated).
- `src/app/(marketing)/sentry-check/page.tsx` — TEMP verification page (server, gated).
- `src/app/(marketing)/sentry-check/SentryCheckButtons.tsx` — TEMP client buttons.
- `docs/technical/observability.md` — what's captured + env + re-verification procedure.

**Modify:**
- `package.json` — add then later prune Sentry deps.
- `src/app/error.tsx` — import `@sentry/nextjs`, drop `initSentry`.
- `src/app/global-error.tsx` — same.
- `src/components/ErrorBoundary.tsx` — forward to Sentry in `componentDidCatch`.
- `src/components/LogSilencer.tsx` — remove eager `initSentry()` import.
- `next.config.ts` — wrap with `withSentryConfig`.
- `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` — #3 → 🟡 then 🟢.

**Delete:**
- `src/lib/observability/sentry.ts` — replaced by auto-init + direct `@sentry/nextjs` imports (Task 5).
- The TEMP `/sentry-check` surface (Task 10 teardown).

---

## Task 1: Add `@sentry/nextjs` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package (keeps `@sentry/browser` for now so every commit builds)**

Run:
```bash
npm install @sentry/nextjs@^8
```
Expected: `package.json` gains `"@sentry/nextjs"` under dependencies; `package-lock.json` updated. No `pnpm-lock.yaml` created.

- [ ] **Step 2: Verify install**

Run: `node -e "require('@sentry/nextjs'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add @sentry/nextjs dependency"
```

---

## Task 2: Shared init options module (TDD)

**Files:**
- Create: `src/lib/observability/sentryConfig.ts`
- Test: `src/__tests__/mvp/sentryConfig.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/mvp/sentryConfig.test.ts`:
```ts
import { afterEach, describe, expect, it } from "vitest";
import { getSentryInitOptions } from "@/lib/observability/sentryConfig";

describe("getSentryInitOptions", () => {
  const original = process.env.NEXT_PUBLIC_SENTRY_DSN;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    else process.env.NEXT_PUBLIC_SENTRY_DSN = original;
  });

  it("is disabled and dsn-less when no DSN is set", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    const opts = getSentryInitOptions();
    expect(opts.enabled).toBe(false);
    expect(opts.dsn).toBeUndefined();
  });

  it("is enabled and error-only when a DSN is set", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    const opts = getSentryInitOptions();
    expect(opts.enabled).toBe(true);
    expect(opts.tracesSampleRate).toBe(0);
    expect(opts.sendDefaultPii).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/mvp/sentryConfig.test.ts`
Expected: FAIL — cannot resolve `@/lib/observability/sentryConfig`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/observability/sentryConfig.ts`:
```ts
/**
 * Single source of truth for Sentry.init options across the browser, Node
 * server, and edge runtimes. Error-only for Beta 1 — no performance tracing,
 * no session replay, no PII (war-room concern #3; PII stays off until the
 * liability waiver, concern #2). No-ops when NEXT_PUBLIC_SENTRY_DSN is unset.
 */
export interface SentryRuntimeOptions {
  dsn: string | undefined;
  enabled: boolean;
  environment: string | undefined;
  release: string | undefined;
  tracesSampleRate: number;
  sendDefaultPii: boolean;
}

export function getSentryInitOptions(): SentryRuntimeOptions {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/mvp/sentryConfig.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/observability/sentryConfig.ts src/__tests__/mvp/sentryConfig.test.ts
git commit -m "feat(observability): shared error-only Sentry init options"
```

---

## Task 3: Browser instrumentation entrypoint

**Files:**
- Create: `instrumentation-client.ts` (project root, `ai-form-coach/`)

- [ ] **Step 1: Create the file**

Create `instrumentation-client.ts`:
```ts
import * as Sentry from "@sentry/nextjs";
import { getSentryInitOptions } from "@/lib/observability/sentryConfig";

Sentry.init(getSentryInitOptions());
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `instrumentation-client.ts` (pre-existing test-file TS errors per CLAUDE.md are tolerated).

- [ ] **Step 3: Commit**

```bash
git add instrumentation-client.ts
git commit -m "feat(observability): browser Sentry init via instrumentation-client"
```

---

## Task 4: Server + edge configs and instrumentation hook

**Files:**
- Create: `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` (all project root)

- [ ] **Step 1: Create `sentry.server.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs";
import { getSentryInitOptions } from "@/lib/observability/sentryConfig";

Sentry.init(getSentryInitOptions());
```

- [ ] **Step 2: Create `sentry.edge.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs";
import { getSentryInitOptions } from "@/lib/observability/sentryConfig";

Sentry.init(getSentryInitOptions());
```

- [ ] **Step 3: Create `instrumentation.ts`**

```ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors from Server Components, route handlers, and middleware.
export const onRequestError = Sentry.captureRequestError;
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors referencing the three new files.

- [ ] **Step 5: Commit**

```bash
git add instrumentation.ts sentry.server.config.ts sentry.edge.config.ts
git commit -m "feat(observability): server + edge Sentry init and onRequestError"
```

---

## Task 5: Reconcile existing wiring and prune `@sentry/browser`

**Files:**
- Modify: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/components/ErrorBoundary.tsx`, `src/components/LogSilencer.tsx`, `package.json`
- Delete: `src/lib/observability/sentry.ts`

- [ ] **Step 1: Update `src/app/error.tsx`**

Replace the import line (currently line 5):
```ts
import { initSentry, Sentry } from "@/lib/observability/sentry";
```
with:
```ts
import * as Sentry from "@sentry/nextjs";
```
Replace the `useEffect` body (currently lines 15-19) — remove the `initSentry()` call:
```ts
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Route error boundary caught:", error);
  }, [error]);
```

- [ ] **Step 2: Update `src/app/global-error.tsx`**

Replace the import line (currently line 4):
```ts
import { initSentry, Sentry } from "@/lib/observability/sentry";
```
with:
```ts
import * as Sentry from "@sentry/nextjs";
```
Replace the `useEffect` body (currently lines 13-17):
```ts
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Global error boundary caught:", error);
  }, [error]);
```

- [ ] **Step 3: Update `src/components/ErrorBoundary.tsx`**

Add the import after line 3 (`import React, { Component, ErrorInfo, ReactNode } from "react";`):
```ts
import * as Sentry from "@sentry/nextjs";
```
Replace `componentDidCatch` (currently lines 25-27):
```ts
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }
```

- [ ] **Step 4: Update `src/components/LogSilencer.tsx`**

Remove the eager init line (currently line 7):
```ts
			import('@/lib/observability/sentry').then(m => m.initSentry()).catch(() => {});
```
Also remove the now-stale comment on line 6 (`// Initialize Sentry (no-op if DSN missing)`). The `useEffect` keeps only the console-silencing logic.

- [ ] **Step 5: Delete the obsolete helper**

Run:
```bash
git rm src/lib/observability/sentry.ts
```

- [ ] **Step 6: Confirm no remaining importers of the deleted file**

Run: `grep -rn "observability/sentry\"" src/ || echo "no importers"`
Expected: `no importers` (the only matches were the four files updated above).

- [ ] **Step 7: Remove `@sentry/browser`**

Run:
```bash
npm uninstall @sentry/browser
```
Expected: `@sentry/browser` removed from `package.json`; no `pnpm-lock.yaml`.

- [ ] **Step 8: Lint, type-check, unit tests**

Run:
```bash
npm run lint
npx tsc --noEmit
npm run test
```
Expected: lint clean; no new TS errors; `npm run test` → all pass (includes new `sentryConfig.test.ts`).

- [ ] **Step 9: Commit**

```bash
git add src/app/error.tsx src/app/global-error.tsx src/components/ErrorBoundary.tsx src/components/LogSilencer.tsx package.json package-lock.json
git commit -m "refactor(observability): route error capture through @sentry/nextjs, drop browser SDK"
```

---

## Task 6: Wrap `next.config.ts` with `withSentryConfig`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add the import at the top of `next.config.ts`**

After the existing imports, add:
```ts
import { withSentryConfig } from "@sentry/nextjs";
```

- [ ] **Step 2: Replace the final export line**

Replace:
```ts
export default nextConfig;
```
with:
```ts
export default withSentryConfig(nextConfig, {
  org: "paladinknightmaster",
  project: "ai-form-coach",
  // Source-map upload (readable stack traces). Build-time secret in Vercel.
  // When unset (e.g. local/CI without the token), upload is skipped and the
  // build still succeeds.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
```

- [ ] **Step 3: Verify the build succeeds without a token (upload skipped)**

Run: `npm run build`
Expected: build completes successfully; Sentry plugin logs that source-map upload was skipped (no auth token). No fatal error.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "build(observability): wrap next config with withSentryConfig for source maps"
```

---

## Task 7: Temporary verification surface (gated)

**Files:**
- Create: `src/app/api/sentry-check/route.ts`
- Create: `src/app/(marketing)/sentry-check/page.tsx`
- Create: `src/app/(marketing)/sentry-check/SentryCheckButtons.tsx`

- [ ] **Step 1: Create the server-error route**

Create `src/app/api/sentry-check/route.ts`:
```ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// TEMP (war-room #3 verification). Removed in the teardown task once the
// preview-deploy verification has confirmed errors reach Sentry.
export function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  throw new Error("[sentry-check] Intentional server-side error for Sentry verification");
}
```

- [ ] **Step 2: Create the client buttons component**

Create `src/app/(marketing)/sentry-check/SentryCheckButtons.tsx`:
```tsx
"use client";

import { useState } from "react";

// TEMP (war-room #3 verification). Removed in the teardown task.
export default function SentryCheckButtons() {
  const [serverStatus, setServerStatus] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 420 }}>
      <button
        type="button"
        onClick={() => {
          // Uncaught in an event handler -> captured by Sentry's global handler.
          throw new Error("[sentry-check] Intentional client-side error for Sentry verification");
        }}
        style={{ padding: "0.625rem 1rem", borderRadius: 8, border: "1px solid #334155", cursor: "pointer" }}
      >
        Throw client error
      </button>
      <button
        type="button"
        onClick={async () => {
          setServerStatus("calling /api/sentry-check…");
          const res = await fetch("/api/sentry-check");
          setServerStatus(`server responded: ${res.status}`);
        }}
        style={{ padding: "0.625rem 1rem", borderRadius: 8, border: "1px solid #334155", cursor: "pointer" }}
      >
        Trigger server error
      </button>
      <p style={{ fontSize: "0.875rem", color: "#64748b" }}>{serverStatus}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create the gated page (server component)**

Create `src/app/(marketing)/sentry-check/page.tsx`:
```tsx
import SentryCheckButtons from "./SentryCheckButtons";

// TEMP (war-room #3 verification). Removed in the teardown task.
export const dynamic = "force-dynamic";

export default function SentryCheckPage() {
  if (process.env.VERCEL_ENV === "production") {
    return <main style={{ padding: "2rem" }}>Not available.</main>;
  }
  return (
    <main style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Sentry verification</h1>
      <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: 480 }}>
        Temporary page for war-room #3. Click each button on a preview deploy, then confirm
        the two issues appear in Sentry with readable stack traces.
      </p>
      <SentryCheckButtons />
    </main>
  );
}
```

- [ ] **Step 4: Verify build + that the route is reachable unauthenticated**

Run: `npm run build`
Expected: build succeeds; `/sentry-check` and `/api/sentry-check` appear in the route manifest. (Middleware does not redirect them — the path is neither MVP-disabled nor auth-only, confirmed in `src/middleware.ts`.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/sentry-check/route.ts" "src/app/(marketing)/sentry-check/page.tsx" "src/app/(marketing)/sentry-check/SentryCheckButtons.tsx"
git commit -m "test(observability): temporary gated /sentry-check verification surface"
```

---

## Task 8: Documentation + tracker to 🟡

**Files:**
- Create: `docs/technical/observability.md`
- Modify: `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`

- [ ] **Step 1: Write `docs/technical/observability.md`**

```markdown
# Observability — Error Monitoring (Sentry)

AI Form Coach uses `@sentry/nextjs` for error monitoring. Beta 1 is **error-only**:
no performance tracing, no session replay, no PII (`sendDefaultPii: false`).

## What is captured

| Layer | Mechanism |
|-------|-----------|
| Browser uncaught errors / rejections | `instrumentation-client.ts` (global handlers) |
| React render errors (route) | `app/error.tsx`, `app/global-error.tsx` |
| React render errors (marketing tree) | `components/ErrorBoundary.tsx` → `captureException` |
| Server components, route handlers, middleware | `instrumentation.ts` → `onRequestError` |
| Node + edge runtime errors | `sentry.server.config.ts`, `sentry.edge.config.ts` |

All init flows through `src/lib/observability/sentryConfig.ts` (`getSentryInitOptions`),
which no-ops when `NEXT_PUBLIC_SENTRY_DSN` is unset.

## Environment variables

| Var | Where | Secret | Purpose |
|-----|-------|--------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel (all envs) | No | Runtime: destination for events |
| `SENTRY_AUTH_TOKEN` | Vercel build env | **Yes** | Build: source-map upload (readable traces) |

`org`/`project` slugs are in `next.config.ts` (`paladinknightmaster` / `ai-form-coach`).

## Re-verifying capture

Restore a throwing client action and a throwing route handler (see git history of the
temporary `/sentry-check` surface), deploy to a preview, trigger both, and confirm two
issues appear in Sentry with source-mapped stack traces.
```

- [ ] **Step 2: Flip tracker #3 to 🟡**

In `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`, change the `### 3.` block status line:
```
**Status:** 🔴 open
```
to:
```
**Status:** 🟡 in progress — full @sentry/nextjs wiring shipped; awaiting preview-deploy verification
```
And append to the Resolution Log table:
```
| 2026-05-29 | #3 Sentry verification | 🔴 → 🟡 | Full @sentry/nextjs (client+server+edge) wired; preview verification pending |
```

- [ ] **Step 3: Commit**

```bash
git add docs/technical/observability.md docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
git commit -m "docs(observability): document Sentry wiring; war-room #3 to in-progress"
```

---

## Task 9: Full local verification gate

**Files:** none (verification only)

- [ ] **Step 1: Run lint, unit tests, and build**

Run:
```bash
npm run lint
npm run test
npm run build
```
Expected: lint clean; `npm run test` all pass; build succeeds (source-map upload skipped without token).

- [ ] **Step 2: Push the branch**

Run:
```bash
git push -u origin feat/sentry-error-monitoring
```
Expected: branch pushed; remote prints the compare URL. **Do NOT run `gh pr create`** — the user opens the PR manually.

- [ ] **Step 3: STOP — hand off for preview verification**

Report to the user:
- Branch pushed; provide a paste-ready PR body.
- User to: (a) confirm `SENTRY_AUTH_TOKEN` is in Vercel, (b) open the PR, (c) on the Vercel preview, visit `/sentry-check`, click both buttons, and confirm two issues land in Sentry with readable stack traces.
- Await the user's confirmation before Task 10.

---

## Task 10: Teardown + tracker to 🟢 (AFTER user confirms verification)

**Files:**
- Delete: `src/app/api/sentry-check/route.ts`, `src/app/(marketing)/sentry-check/page.tsx`, `src/app/(marketing)/sentry-check/SentryCheckButtons.tsx`
- Modify: `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`

- [ ] **Step 1: Remove the temporary surface**

Run:
```bash
git rm "src/app/api/sentry-check/route.ts" "src/app/(marketing)/sentry-check/page.tsx" "src/app/(marketing)/sentry-check/SentryCheckButtons.tsx"
```
(The `src/app/api/sentry-check/` and `src/app/(marketing)/sentry-check/` folders are then empty — git drops them automatically.)

- [ ] **Step 2: Flip tracker #3 to 🟢**

In `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`, change the `### 3.` block status line to:
```
**Status:** 🟢 resolved — full @sentry/nextjs capture verified on preview deploy (client + server errors land with source-mapped traces)
```
Append to the Resolution Log table:
```
| 2026-05-29 | #3 Sentry verification | 🟡 → 🟢 | Client + server errors verified in Sentry with readable stack traces on Vercel preview |
```

- [ ] **Step 3: Verify build still green after teardown**

Run:
```bash
npm run lint
npm run build
```
Expected: lint clean; build succeeds; `/sentry-check` routes no longer in the manifest.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore(observability): remove temporary sentry-check surface; war-room #3 resolved"
git push
```

- [ ] **Step 5: Invoke finishing-a-development-branch**

The implementation is complete and verified. Use the superpowers:finishing-a-development-branch skill to present completion options.

---

## Self-Review

**Spec coverage:** dependency swap (T1, T5) ✓; shared options (T2) ✓; client/server/edge init + onRequestError (T3, T4) ✓; ErrorBoundary/error.tsx/global-error.tsx/LogSilencer reconcile + sentry.ts delete (T5) ✓; withSentryConfig source maps (T6) ✓; temporary gated verification surface (T7) ✓; docs + tracker 🟡 (T8) ✓; preview verification gate (T9) ✓; teardown + tracker 🟢 (T10) ✓. Non-goals (tracing/replay/PII/tunnelRoute off) encoded in `getSentryInitOptions` (T2) ✓.

**Placeholder scan:** no TBD/TODO-without-code; the `[sentry-check]` strings are intentional error messages, not placeholders. Org/project slugs are concrete.

**Type consistency:** `getSentryInitOptions()` returns `SentryRuntimeOptions` (T2) and is the only consumer signature used in T3/T4; `onRequestError`/`register` match the Sentry Next.js convention; `Sentry.captureException` signature consistent across T5 edits.

**Middleware correction:** spec assumed a middleware exemption was needed; the read of `src/middleware.ts` showed unknown public paths pass through, so no middleware edit is in the plan (noted in T7 Step 4).

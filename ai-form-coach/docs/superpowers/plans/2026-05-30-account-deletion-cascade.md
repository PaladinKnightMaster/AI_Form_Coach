# Account Deletion Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make account deletion provably complete — change `events.user_id` to `ON DELETE CASCADE`, add an MCP-verifiable `account_deletion_completeness()` audit function + a gated RPC regression test, add a same-origin check to the delete route, document the GDPR follow-ups, and flip war-room #14 → 🟢.

**Architecture:** One idempotent SQL migration fixes the `events` FK and creates a `SECURITY DEFINER` audit function that returns any user-scoped table that won't cascade-delete (empty == complete). A Vitest test calls that function via the existing Supabase service client (auto-skips without real creds). No new npm dependency.

**Tech Stack:** Supabase Postgres, `@supabase/supabase-js` (already a dep), Next 16 App Router, Vitest. npm (not pnpm).

**Branch:** `fix/account-deletion-cascade` (cut from `dev`; spec `726e7eb`).

**Commit trailer:** every commit ends with a blank line then `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

> **Controller-run tasks:** Tasks 1 and 5 call the Supabase MCP (apply_migration / execute_sql) and must be run by the controller (the main session), not a subagent — subagents cannot reach the MCP. Tasks 2–4 are subagent-implementable.

---

## File Structure

- **Create** `supabase/migrations/10_account_deletion_events_cascade.sql` — events FK fix + audit function.
- **Create** `src/__tests__/mvp/accountDeletionCompleteness.test.ts` — gated RPC regression test.
- **Create** `docs/technical/account-deletion.md` — flow, chokepoint, how to run the gated test, GDPR follow-ups.
- **Modify** `src/app/api/auth/delete-account/route.ts` — same-origin (CSRF) check.
- **Modify** `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` — #14 → 🟢.

---

## Task 1 (CONTROLLER / MCP): migration — events cascade + audit function

**Files:**
- Create: `supabase/migrations/10_account_deletion_events_cascade.sql`

- [ ] **Step 1: Write the migration file** with EXACTLY this content:
```sql
-- war-room #14: events analytics must be DELETED on account deletion, not
-- anonymized. Change events.user_id FK from SET NULL to CASCADE, and add an
-- audit function that proves every user-scoped table cascade-deletes.

-- 1. Scrub any pre-existing orphan events so the new FK validates (NOT EXISTS
--    avoids the NULL-subquery footgun of NOT IN).
DELETE FROM public.events e
 WHERE e.user_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = e.user_id);

-- 2. Drop whatever FK currently sits on events.user_id (name-agnostic), re-add CASCADE.
DO $$
DECLARE c text;
BEGIN
  SELECT con.conname INTO c
  FROM pg_constraint con
  WHERE con.conrelid = 'public.events'::regclass
    AND con.contype = 'f'
    AND con.conkey = (
      SELECT array_agg(att.attnum)
      FROM pg_attribute att
      WHERE att.attrelid = 'public.events'::regclass AND att.attname = 'user_id'
    );
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.events DROP CONSTRAINT %I', c);
  END IF;
END $$;

ALTER TABLE public.events
  ADD CONSTRAINT events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Audit function: returns any public base table whose user_id column does NOT
--    cascade-delete to profiles/auth.users. Empty result == deletion is complete.
CREATE OR REPLACE FUNCTION public.account_deletion_completeness()
RETURNS TABLE(table_name text, references_table text, on_delete text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT cl.relname::text,
         COALESCE(rf.relname::text, '(no fk)'),
         CASE con.confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'a' THEN 'NO ACTION'
              WHEN 'r' THEN 'RESTRICT' WHEN 'n' THEN 'SET NULL'
              WHEN 'd' THEN 'SET DEFAULT' ELSE '(no fk)' END
  FROM pg_class cl
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
  JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attname = 'user_id'
       AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_constraint con ON con.conrelid = cl.oid AND con.contype = 'f'
       AND a.attnum = ANY(con.conkey)
  LEFT JOIN pg_class rf ON rf.oid = con.confrelid
  WHERE cl.relkind = 'r'
    AND NOT (con.oid IS NOT NULL AND con.confdeltype = 'c'
             AND rf.relname IN ('profiles', 'users'));
$$;

REVOKE EXECUTE ON FUNCTION public.account_deletion_completeness() FROM public;
GRANT EXECUTE ON FUNCTION public.account_deletion_completeness() TO service_role;
```

- [ ] **Step 2: Apply via Supabase MCP** — `apply_migration(project_id="kqmjhjtfogplhmzzbxnw", name="account_deletion_events_cascade", query=<the SQL above>)`. Expect `{"success": true}`.

- [ ] **Step 3: Verify via Supabase MCP** — `execute_sql("SELECT * FROM public.account_deletion_completeness();")`.
  Expected: **zero rows** (proves the `events` fix landed and no other user table is non-cascading). If any row returns, STOP — investigate that table before continuing.

- [ ] **Step 4: Confirm the events FK specifically** — `execute_sql` to read `events.user_id` FK on_delete; expect `CASCADE` referencing `profiles`.

- [ ] **Step 5: Commit the migration file**
```bash
git add supabase/migrations/10_account_deletion_events_cascade.sql
git commit -m "feat(db): events cascade-deletes on account deletion + completeness audit fn (war-room #14)"
```

---

## Task 2: gated RPC regression test

**Files:**
- Create: `src/__tests__/mvp/accountDeletionCompleteness.test.ts`

- [ ] **Step 1: Create the test** with EXACTLY this content:
```ts
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Runs only with REAL service creds. CI uses placeholders, so it auto-skips.
const canRun =
  !!url && !!key &&
  url.startsWith("https://") && !url.includes("placeholder") &&
  !key.includes("placeholder");

describe.skipIf(!canRun)("account deletion completeness (DB schema)", () => {
  it("every user_id table cascade-deletes (no orphans)", async () => {
    const supabase = createClient(url!, key!, { auth: { persistSession: false } });
    const { data, error } = await supabase.rpc("account_deletion_completeness");
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]); // any row = a table that won't be deleted
  });
});
```

- [ ] **Step 2: Run it, confirm it SKIPS cleanly** (no real creds in this env):
  `npx vitest run src/__tests__/mvp/accountDeletionCompleteness.test.ts`
  Expected: the suite is reported skipped (0 failures). A skipped suite is the
  correct outcome here — the audit logic itself is verified via the MCP in Task 1,
  not by this test running locally. Confirm `npm run lint` is clean for the file.

- [ ] **Step 3: Commit**
```bash
git add src/__tests__/mvp/accountDeletionCompleteness.test.ts
git commit -m "test(db): gated account-deletion completeness RPC guard"
```

---

## Task 3: same-origin (CSRF) check on the delete route

**Files:**
- Modify: `src/app/api/auth/delete-account/route.ts`

Current file (for reference) starts `export async function POST() {` and uses
`getSupabaseServerClient()` then `serviceClient.auth.admin.deleteUser(user.id)`.

- [ ] **Step 1: Add a same-origin guard.** Change the handler signature to accept
  the request and reject cross-site POSTs before doing anything else. Replace:
```ts
export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
```
with:
```ts
export async function POST(request: Request) {
  try {
    // Defense-in-depth against CSRF (Supabase cookies are SameSite=Lax, which
    // already blocks cross-site POSTs; this rejects any that slip through).
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const supabase = await getSupabaseServerClient();
```
  Leave the rest of the handler unchanged.

- [ ] **Step 2: Verify** — `npm run lint`, `npx tsc --noEmit` (no new error in this
  file), `npm run build` (green). The route still compiles as a POST handler.

- [ ] **Step 3: Commit**
```bash
git add "src/app/api/auth/delete-account/route.ts"
git commit -m "fix(security): reject cross-origin POST to delete-account (CSRF defense-in-depth)"
```

---

## Task 4: documentation + secret-hygiene check

**Files:**
- Create: `docs/technical/account-deletion.md`
- (Check only) `.gitignore` / `ai-form-coach/.gitignore`

- [ ] **Step 1: Verify `.env*.local` is gitignored** —
  `git check-ignore .env.local ai-form-coach/.env.local` should print the paths
  (meaning they are ignored). If EITHER is not ignored, add a line `.env*.local`
  to the appropriate `.gitignore` and note it in the doc. Report what you found.

- [ ] **Step 2: Write `docs/technical/account-deletion.md`:**
```markdown
# Account Deletion (GDPR right-to-erasure)

## Flow
`DeleteAccountModal` → `POST /api/auth/delete-account` (same-origin checked) →
`auth.admin.deleteUser(user.id)`.

## Why it's complete
`profiles.id → auth.users(id) ON DELETE CASCADE` is the chokepoint. Every
user-scoped table cascade-deletes to `auth.users` directly or via `profiles`, so
deleting the auth user removes all of the user's rows. `events.user_id` was changed
from `SET NULL` to `ON DELETE CASCADE` (war-room #14) so analytics are deleted, not
just anonymized.

## Regression guard
`public.account_deletion_completeness()` returns any user-scoped base table that
would NOT cascade-delete. **Empty result == deletion is complete.**

- Verify anytime via the Supabase SQL editor / MCP:
  `SELECT * FROM public.account_deletion_completeness();`
- Automated: `src/__tests__/mvp/accountDeletionCompleteness.test.ts` calls it via
  the service client and asserts empty. It **auto-skips** without real creds (CI
  uses placeholders). To run it locally, set real values in gitignored `.env.local`:
  `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard →
  Project Settings → API). Run before promoting `dev → main`.

## Not covered by DB cascade (GDPR follow-ups)
- `auth.audit_log_entries` — Supabase-managed; may retain email/IP.
- Stripe — no payments in Beta; when added, delete the customer on erasure.
- Sentry — PII capture is off (`sendDefaultPii: false`); Umami analytics.
- Supabase PITR backups — deleted data ages out of the backup window (standard).
- **Separate future item:** data *access/portability* (GDPR Art. 15/20) — not part
  of erasure.
```

- [ ] **Step 3: Commit**
```bash
git add docs/technical/account-deletion.md
git commit -m "docs(legal): document account-deletion completeness + GDPR follow-ups"
```
(If a `.gitignore` line was added in Step 1, include it in this commit.)

---

## Task 5 (CONTROLLER): tracker → 🟢, full gate, push

**Files:**
- Modify: `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`

- [ ] **Step 1: Flip tracker #14** — in `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`,
  change concern #14's `**Status:**` line to:
  `**Status:** 🟢 resolved (2026-05-30) — deletion verified complete (profiles-cascade chokepoint); events now CASCADE-deletes; audit fn + gated test guard regressions`
  and append a Resolution Log row:
  `| 2026-05-30 | #14 Account deletion | 🔴 → 🟢 | Audit: all user tables cascade via profiles chokepoint; fixed events SET NULL → CASCADE; added account_deletion_completeness() fn (MCP-verified empty) + gated RPC test + same-origin check + GDPR follow-up docs |`

- [ ] **Step 2: Full local gate** — `npm run lint` (clean), `npm run test` (all pass;
  the new RPC test skips), `npm run build` (green).

- [ ] **Step 3: Commit + push**
```bash
git add docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
git commit -m "docs(war-room): #14 resolved — account deletion verified complete + guarded"
git push -u origin fix/account-deletion-cascade
```
(Do NOT run `gh pr create`.)

- [ ] **Step 4: Invoke superpowers:finishing-a-development-branch** and present completion options with a paste-ready PR body. Note for the PR: the migration was already applied to the live DB via MCP (the committed `.sql` documents/reproduces it and is idempotent).

---

## Self-Review

**Spec coverage:** events → CASCADE migration (T1) ✓; orphan scrub via NOT EXISTS (T1) ✓; name-agnostic drop-then-add FK (T1) ✓; `account_deletion_completeness()` SECURITY DEFINER + REVOKE/GRANT (T1) ✓; MCP apply + verify-empty (T1 steps 2–4) ✓; gated RPC test, no new dep (T2) ✓; same-origin CSRF check (T3) ✓; `.env*.local` gitignore check (T4) ✓; docs incl. auth.audit_log_entries + Art 15/20 + how-to-run (T4) ✓; tracker → 🟢 (T5) ✓. Non-goals (no pg dep, no CI signup→delete e2e, no external-processor erasure now) respected.

**Placeholder scan:** no TBD/implement-later; every code/SQL step shows full content. The gated test *skipping* in this env is the documented expected outcome (the logic is MCP-verified in T1), not a gap.

**Type/identifier consistency:** the function name `account_deletion_completeness` is identical in the migration (T1), the verify query (T1), the RPC test (T2), and the docs (T4). The new FK is named `events_user_id_fkey` consistently. The route stays a `POST` handler (now taking `request: Request`).

**Controller vs subagent:** T1 and T5 are controller-run (MCP + final gate/push); T2–T4 are subagent-implementable. Marked at top + per task.
```

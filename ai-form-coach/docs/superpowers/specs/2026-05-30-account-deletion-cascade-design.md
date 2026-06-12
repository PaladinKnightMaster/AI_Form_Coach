# Account Deletion Completeness — `events` cascade + regression guard (war-room #14)

**Date:** 2026-05-30 (rev. 2 after specialist re-review)
**Branch:** `fix/account-deletion-cascade`
**War-room concern:** #14 — Account deletion not E2E tested (GDPR: risk of incomplete deletion).
**Goal:** close the one real deletion gap (`events` anonymizes instead of deletes), add a durable, *verifiable* regression guard that deletion stays complete, and flip #14 → 🟢.

## Background & audit (Supabase project `kqmjhjtfogplhmzzbxnw`)

Account deletion: `DeleteAccountModal` → `POST /api/auth/delete-account` →
`getSupabaseServiceClient().auth.admin.deleteUser(user.id)`. Completeness depends
entirely on FK cascade behavior.

A full schema audit (every public base table with a `user_id` column — 42 tables)
found the cascade design is **sound**: `profiles.id → auth.users(id) ON DELETE
CASCADE` is the chokepoint, and every user table cascades to `auth.users` either
directly or via `profiles` — **with one exception**:

- **`events.user_id → profiles ON DELETE SET NULL`** (261 rows). On deletion the
  event rows are kept with `user_id`/`session_id` nulled (anonymized) rather than
  deleted.

(An earlier pass that only checked *direct* FKs to `auth.users` wrongly flagged
`sessions`, `user_subscriptions`, etc. as orphaned — they cascade via `profiles`.
Corrected by the second audit.)

`events` columns: `id, user_id, name, payload(jsonb), session_id, created_at`.
Because `payload` could in principle hold residual identifiers, the chosen
remediation is a clean delete rather than relying on anonymization.

## Decisions (brainstorm + two specialist reviews, 2026-05-30)

- **`events` → CASCADE.** Change `events.user_id` FK from `SET NULL` to
  `ON DELETE CASCADE`. Unambiguous right-to-erasure; no `payload`-PII reasoning needed.
- **No other schema change** — every other user table already cascades.
- **Regression guard = a Postgres function + service-client RPC test** (NOT a `pg`
  dependency). The audit logic lives in `public.account_deletion_completeness()`,
  callable from the test via the existing Supabase service client AND verifiable
  immediately via the Supabase MCP. No new npm dependency.
- **Status target:** #14 → 🟢 (active deletion complete + guarded + verified).

## Remediation migration

`supabase/migrations/10_account_deletion_events_cascade.sql` (applied via Supabase
MCP, then committed — same pattern as `09_user_consents.sql`). Idempotent and
re-runnable. It does two things: fix the `events` FK, and create the audit function.

```sql
-- war-room #14: events analytics must be DELETED on account deletion, not
-- anonymized. Change events.user_id FK from SET NULL to CASCADE.

-- 1. Scrub any pre-existing orphan events so the new FK validates.
--    NOT EXISTS (not NOT IN) to avoid the NULL-subquery footgun.
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
    -- offender == NOT (has a CASCADE fk on user_id to profiles or auth.users)
    AND NOT (con.oid IS NOT NULL AND con.confdeltype = 'c'
             AND rf.relname IN ('profiles', 'users'));
$$;

REVOKE EXECUTE ON FUNCTION public.account_deletion_completeness() FROM public;
GRANT EXECUTE ON FUNCTION public.account_deletion_completeness() TO service_role;
```

(`events.session_id → sessions ON DELETE SET NULL` is left unchanged — it governs
*session* deletion, not account deletion, and is correct there.)

**Verification (immediate, via MCP):** after applying, run
`SELECT * FROM public.account_deletion_completeness();` — it MUST return **zero
rows** (proves the `events` fix landed and nothing else regressed).

## One-time end-to-end proof (optional, during implementation)

The cascade is proven *structurally* by the function above (MCP-verified empty).
If a live round-trip is also wanted, use the Supabase **admin API** as a throwaway
script — `admin.createUser` → seed a `sessions` + `events` row for it →
`admin.deleteUser` → assert both rows are gone → done. Do NOT hand-insert synthetic
`auth.users` rows via raw SQL (that table has many `NOT NULL`/trigger requirements
and is fiddly). This live proof is belt-and-suspenders, not required for 🟢.

## Regression guard — gated RPC test

`src/__tests__/mvp/accountDeletionCompleteness.test.ts`:

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

- Reuses `@supabase/supabase-js` (already a dependency) + the service client. **No
  new dependency.**
- Auto-skips in CI (placeholder creds) and runs when real service creds are present
  (locally / pre-release). The audit *logic* is independently MCP-verified, so the
  guard's correctness does not depend on the test ever executing in our env.
- Catches a future table that forgets to cascade (it would appear in the result).

## Documentation

- `docs/technical/account-deletion.md`: the deletion flow, the `profiles`-cascade
  chokepoint, the `account_deletion_completeness()` function + how to run the gated
  test (set real `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in
  gitignored `.env.local`), and a **GDPR follow-up list for data NOT covered by DB
  cascade**:
  - `auth.audit_log_entries` (Supabase-managed; may retain email/IP).
  - Stripe (no payments in Beta; when added, delete the customer on erasure).
  - Sentry (PII capture is off — `sendDefaultPii: false`), Umami analytics.
  - Supabase PITR backups (deleted data ages out of the backup window — standard).
  - **Separate future item:** GDPR data *access/portability* (Art. 15/20) — not part
    of erasure (#14).
- War-room tracker #14 → 🟢 + Resolution Log row.

## Security notes (scoped)

- **CSRF on `/api/auth/delete-account`:** it's a credentialed POST that deletes the
  caller's account. Supabase `@supabase/ssr` sets auth cookies `SameSite=Lax` by
  default, which blocks cross-site POSTs (`getUser()` → 401), so CSRF is largely
  mitigated. The plan will **confirm the cookie SameSite setting** and add a cheap
  `Origin`-header check to the route as defense-in-depth. (If this grows, split it
  into a separate hardening task — it is adjacent to, not core to, #14.)
- **Secret hygiene:** the plan verifies `.env*.local` is gitignored before the DB
  service key / connection details are used locally.

## Non-goals

- Touching the 25 already-cascading user tables (no change needed).
- A real signup→delete Playwright e2e in CI (CI uses placeholder Supabase; the RPC
  test + MCP verification cover it without that infra change).
- Implementing external-processor erasure or data-access/portability now (documented
  follow-ups; Beta has no payments and Sentry PII is off).

## Rollout

Branch `fix/account-deletion-cascade` from `dev`, one purpose. User opens the PR
manually.

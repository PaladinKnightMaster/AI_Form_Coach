# Account Deletion Completeness — `events` cascade + regression guard (war-room #14)

**Date:** 2026-05-30
**Branch:** `fix/account-deletion-cascade`
**War-room concern:** #14 — Account deletion not E2E tested (GDPR: risk of incomplete deletion).
**Goal:** close the one real deletion gap (`events` anonymizes instead of deletes), add a durable regression guard that deletion stays complete, and flip #14 → 🟢.

## Background & audit (Supabase project `kqmjhjtfogplhmzzbxnw`)

Account deletion: `DeleteAccountModal` → `POST /api/auth/delete-account` →
`getSupabaseServiceClient().auth.admin.deleteUser(user.id)`. Completeness depends
entirely on FK cascade behavior.

A full schema audit (every public base table with a `user_id` column, 42 tables)
found the cascade design is **sound**: `profiles.id → auth.users(id) ON DELETE
CASCADE` is the chokepoint, and every user table cascades to `auth.users` either
directly or via `profiles` — **with one exception**:

- **`events.user_id → profiles ON DELETE SET NULL`** (261 rows). On deletion the
  event rows are kept with `user_id`/`session_id` nulled (anonymized) rather than
  deleted.

(An earlier, flawed pass that only checked *direct* FKs to `auth.users` wrongly
flagged `sessions`, `user_subscriptions`, etc. as orphaned. They cascade via
`profiles`. Corrected.)

`events` columns: `id, user_id, name, payload(jsonb), session_id, created_at`.
Because `payload` could in principle hold residual identifiers, the chosen
remediation is a clean delete rather than relying on anonymization.

## Decision (brainstorm + specialist review, 2026-05-30)

- **`events` → CASCADE.** Change `events.user_id` FK from `SET NULL` to
  `ON DELETE CASCADE` so a deleted user's analytics rows are removed entirely
  (unambiguous right-to-erasure; no need to reason about `payload` PII).
- **No other schema change** — every other user table already cascades.
- **Regression guard:** a gated schema-completeness test (runs locally / when DB
  creds are present; auto-skips in CI which uses placeholder Supabase creds).
- **Status target:** #14 → 🟢 (active deletion complete + guarded).

## Remediation migration

`supabase/migrations/10_account_deletion_events_cascade.sql` (applied via Supabase
MCP, then committed — same pattern as `09_user_consents.sql`). Idempotent and
re-runnable:

```sql
-- war-room #14: events analytics must be DELETED on account deletion,
-- not anonymized. Change events.user_id FK from SET NULL to CASCADE.

-- 1. Scrub any pre-existing orphan events so the new FK validates.
DELETE FROM public.events
 WHERE user_id IS NOT NULL
   AND user_id NOT IN (SELECT id FROM public.profiles);

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
```

(`events.session_id → sessions ON DELETE SET NULL` is left unchanged — that
governs *session* deletion, not account deletion, and is the correct semantics
there.)

## One-time end-to-end proof (during implementation, via Supabase MCP)

Inside a single transaction that is **rolled back** (so nothing persists), insert a
synthetic `auth.users` row + `profiles` + `sessions` + `events` for it, `DELETE`
the `auth.users` row, and assert the `sessions` and `events` rows are gone (cascade
chain works). Roll back. This proves the chain live without leaving test data; if a
transactional rollback isn't supported by the SQL tool, do explicit insert →
delete-user → assert → cleanup instead.

## Regression guard — gated schema-completeness test

`src/__tests__/mvp/accountDeletionCompleteness.test.ts`:

- Add dev dependency **`pg`** (node-postgres). Connect with
  `process.env.SUPABASE_DB_URL` (a direct Postgres connection string).
- `describe.skipIf(!process.env.SUPABASE_DB_URL)(...)` so the suite **auto-skips
  in CI** (placeholder creds, no DB URL) and runs locally / pre-release.
- Assertions (querying `pg_constraint`):
  1. `profiles.id` has an `ON DELETE CASCADE` FK to `auth.users` (the chokepoint).
  2. **Every** public base table (`relkind='r'`) with a `user_id` column has an
     `ON DELETE CASCADE` FK on `user_id` (to `profiles` or `auth.users`). Fails if
     any user table uses `SET NULL` / `NO ACTION` / no FK — catching a future
     table that forgets to cascade, and confirming the `events` fix.
- Document in the test file how to set `SUPABASE_DB_URL` (Supabase dashboard →
  Project Settings → Database → connection string). It is a **secret**: it lives in
  gitignored `.env.local`, never committed.

## Documentation

- `docs/technical/account-deletion.md` (or a section): the deletion flow, the
  profiles-cascade chokepoint, how to run the gated completeness test, and a
  **GDPR follow-up list for external processors** not covered by DB cascade:
  Stripe (no payments in Beta — when added, delete the customer on erasure),
  Sentry (PII capture is off), Umami analytics, and Supabase PITR backups (deleted
  data ages out of the backup window — standard, documented).
- War-room tracker #14 → 🟢 + Resolution Log row.

## Non-goals

- Touching the 25 already-cascading user tables (no change needed).
- A real signup→delete Playwright e2e in CI (CI uses placeholder Supabase; the
  schema test + one-time MCP proof cover it without that infra change).
- Implementing external-processor erasure now (documented follow-up; Beta has no
  payments and Sentry PII is off).

## Rollout

Branch `fix/account-deletion-cascade` from `dev`, one purpose. User opens the PR
manually.

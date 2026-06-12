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

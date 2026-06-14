-- =====================================================
-- MIGRATION 11: USER CONSENTS UNIQUE CONSTRAINT (war-room #2 follow-up)
-- One proof-of-consent row per (user_id, context, disclaimer_version). Backs the
-- idempotent ON CONFLICT DO NOTHING upsert in recordConsent(), so multi-tab /
-- re-entry can no longer create duplicate consent rows. Re-runnable.
-- =====================================================

-- 1. Remove any pre-existing duplicates, keeping the earliest accepted_at (id as
--    tiebreak) so the unique index can be created cleanly.
DELETE FROM public.user_consents a
USING public.user_consents b
WHERE a.user_id = b.user_id
  AND a.context = b.context
  AND a.disclaimer_version = b.disclaimer_version
  AND (a.accepted_at, a.id) > (b.accepted_at, b.id);

-- 2. Unique index backing the (user, context, version) conflict target.
CREATE UNIQUE INDEX IF NOT EXISTS user_consents_user_context_version_uidx
  ON public.user_consents (user_id, context, disclaimer_version);

-- 3. Drop the now-redundant non-unique index from migration 09 (same columns).
DROP INDEX IF EXISTS public.user_consents_user_idx;

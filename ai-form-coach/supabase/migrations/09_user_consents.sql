-- =====================================================
-- MIGRATION 09: USER CONSENTS (war-room #2)
-- Proof-of-consent record. NO health data is stored.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    disclaimer_version TEXT NOT NULL,
    context TEXT NOT NULL CHECK (context IN ('signup', 'first_session')),
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_consents_user_idx
    ON public.user_consents (user_id, context, disclaimer_version);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Users can read their own consent rows.
CREATE POLICY "user_consents_select_own" ON public.user_consents
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own consent rows.
CREATE POLICY "user_consents_insert_own" ON public.user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

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

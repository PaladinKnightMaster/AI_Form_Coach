"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let cancelled = false;

    /**
     * Resolve the signed-in user in two passes.
     *
     * `getSession()` only reads the locally stored token — it never asks the auth
     * server whether that token is still good. The middleware guards /coach,
     * /history and /session with `getUser()`, which does verify. When the two
     * disagree (expired token, failed refresh-token rotation) the header happily
     * renders "Coach" links that immediately bounce to /signin.
     *
     * So: paint from the stored session for speed, then verify. A session the
     * server rejects is cleared locally, which drops the UI to signed-out and
     * lets the user sign in again instead of looping through the redirect.
     */
    const resolveUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        setUser(session?.user ?? null);
        setLoading(false);

        if (!session) return;

        const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
        if (cancelled) return;

        if (error || !verifiedUser) {
          // scope: 'local' clears the stored session without a network round-trip
          // to revoke — the token the server already rejects is not worth a call.
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch {
            /* best effort — the state reset below is what the UI depends on */
          }
          if (!cancelled) setUser(null);
          return;
        }

        setUser(verifiedUser);
      } catch (error) {
        console.error('Error resolving session:', error);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    resolveUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

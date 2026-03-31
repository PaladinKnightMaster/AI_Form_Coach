"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { normalizeAuthNext, DEFAULT_AUTH_NEXT } from "@/lib/auth/utils";
import AuthCard from "@/components/AuthCard";
import { Suspense } from "react";

/**
 * Client-side auth callback handler.
 *
 * Why client-side instead of a Route Handler?
 * -------------------------------------------
 * Supabase PKCE flow stores the `code_verifier` in the browser's localStorage
 * via `createBrowserClient`. A server-side Route Handler cannot access
 * localStorage, so `exchangeCodeForSession(code)` always fails with:
 *   "invalid request: both auth code and code verifier should be non-empty"
 *
 * By handling the exchange client-side, the browser client has full access to
 * the stored code_verifier and the exchange succeeds reliably — even when the
 * magic link opens in a new tab (localStorage is shared across tabs on the
 * same origin).
 */

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    const code = searchParams.get("code");
    const next = normalizeAuthNext(searchParams.get("next"));

    async function handleCallback() {
      const supabase = getSupabaseClient();

      if (code) {
        // PKCE flow: exchange code for session using browser client
        // (browser client has access to localStorage where code_verifier lives)
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Auth code exchange failed:", exchangeError.message);
          setError(exchangeError.message);
          return;
        }

        // Ensure profile exists
        if (data.user) {
          try {
            await supabase
              .from("profiles")
              .upsert({ id: data.user.id }, { onConflict: "id" });
          } catch (err) {
            console.error("Profile upsert error:", err);
          }
        }
      } else {
        // No code — check if session was established via hash fragment (implicit flow)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError("No authentication code or session found.");
          return;
        }

        // Ensure profile exists
        try {
          await supabase
            .from("profiles")
            .upsert({ id: session.user.id }, { onConflict: "id" });
        } catch (err) {
          console.error("Profile upsert error:", err);
        }
      }

      // Redirect to intended destination
      router.replace(next || DEFAULT_AUTH_NEXT);
    }

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    const next = normalizeAuthNext(searchParams.get("next"));
    const signinHref = `/signin?redirect=${encodeURIComponent(next)}`;

    return (
      <AuthCard title="Sign in failed">
        <div className="space-y-5 text-sm opacity-90">
          <p>
            The sign-in link could not be verified. This can happen if the link
            expired or was already used. Please request a fresh link.
          </p>
          {error && (
            <p className="rounded-lg border border-amber-300/40 bg-amber-100/40 px-3 py-2 text-xs dark:border-amber-300/20 dark:bg-amber-900/20">
              Details: {error}
            </p>
          )}
          <div className="space-y-3">
            <a href={signinHref} className="w-full btn btn-primary text-center block">
              Try sign in again
            </a>
            <a
              href={`${signinHref}&mode=magic-link`}
              className="w-full btn btn-secondary text-center block"
            >
              Send a fresh magic link
            </a>
            <a
              href="/"
              className="block text-center text-sm opacity-70 hover:opacity-100 underline"
            >
              Return to home
            </a>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Signing you in…">
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Verifying your authentication…
        </p>
      </div>
    </AuthCard>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Signing you in…">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          </div>
        </AuthCard>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import AuthCard from "@/components/AuthCard";
import { Suspense } from "react";

type ResetState = "loading" | "ready" | "success" | "error";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetState, setResetState] = useState<ResetState>("loading");
  const exchanged = useRef(false);

  // On mount: exchange auth code from the reset email link to establish a session
  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    async function establishSession() {
      const supabase = getSupabaseClient();
      const code = searchParams.get("code");

      if (code) {
        // PKCE flow: exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Reset password code exchange failed:", error.message);
          setStatus(
            "The password reset link is invalid or expired. Please request a new one."
          );
          setResetState("error");
          return;
        }
        setResetState("ready");
        return;
      }

      // No code param — check if we already have a session (e.g. from hash fragment)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setResetState("ready");
      } else {
        setStatus(
          "No valid reset session found. Please request a new password reset link."
        );
        setResetState("error");
      }
    }

    // Also listen for PASSWORD_RECOVERY event (fired for implicit flow)
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setResetState("ready");
      }
    });

    establishSession();

    return () => subscription.unsubscribe();
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      if (password.length < 6) {
        setStatus("Password must be at least 6 characters");
        return;
      }
      if (password !== confirm) {
        setStatus("Passwords do not match");
        return;
      }
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }
      setResetState("success");
      setStatus("Password updated successfully!");
      setTimeout(() => router.push("/coach"), 2000);
    } finally {
      setLoading(false);
    }
  }

  if (resetState === "loading") {
    return (
      <AuthCard title="Password reset">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Verifying your reset link…
          </p>
        </div>
      </AuthCard>
    );
  }

  if (resetState === "error") {
    return (
      <AuthCard title="Reset link expired">
        <div className="space-y-5 text-sm">
          <p className="text-slate-600 dark:text-slate-300">{status}</p>
          <div className="space-y-3">
            <a
              href="/signin?mode=reset-request"
              className="w-full btn btn-primary text-center block"
            >
              Request a new reset link
            </a>
            <a
              href="/signin"
              className="block text-center text-sm opacity-70 hover:opacity-100 underline"
            >
              Back to sign in
            </a>
          </div>
        </div>
      </AuthCard>
    );
  }

  if (resetState === "success") {
    return (
      <AuthCard title="Password updated">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your password has been updated. Redirecting to the coach…
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setStatus("");
            }}
            placeholder="New password (min 6 characters)"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-3 bg-slate-50 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
        <div>
          <input
            type="password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setStatus("");
            }}
            placeholder="Confirm new password"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-3 bg-slate-50 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary py-3 disabled:opacity-50"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
        {status && (
          <p className="text-sm text-red-600 dark:text-red-400">{status}</p>
        )}
      </form>
    </AuthCard>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Password reset">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          </div>
        </AuthCard>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPublicHistorySessions } from "@/lib/history/publicHistory";
import { getTestHistoryFixture } from "@/lib/history/testHistoryFixtures";
import { isLoopbackAutomationAllowed, withLoopbackAutomationParams } from "@/lib/mvp/e2eAccess";
import { getSupabaseClient } from "@/lib/supabase/client";

type Session = {
  id: string;
  exercise: string;
  started_at: string;
  total_reps: number | null;
  total_time_seconds: number | null;
  is_demo?: boolean | null;
};

type Rep = {
  session_id: string;
  rom_score: number | null;
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const loopbackHostname = typeof window !== "undefined" ? window.location.hostname : null;
  const historyScriptKey = searchParams?.get("history-script") ?? null;
  const loopbackAutomationEnabled = isLoopbackAutomationAllowed(searchParams, loopbackHostname);
  const scriptedHistoryFixture = useMemo(() => {
    if (process.env.NODE_ENV === "production" && !loopbackAutomationEnabled) {
      return null;
    }

    return getTestHistoryFixture(historyScriptKey);
  }, [historyScriptKey, loopbackAutomationEnabled]);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (scriptedHistoryFixture) {
        if (!active) {
          return;
        }

        setRequiresAuth(false);
        setError(null);
        setSessions(getPublicHistorySessions(scriptedHistoryFixture.sessions));
        setReps(scriptedHistoryFixture.reps.map((rep) => ({ session_id: rep.session_id, rom_score: rep.rom_score })));
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (!user) {
          setRequiresAuth(true);
          setSessions([]);
          setReps([]);
          return;
        }

        const { data: sessionRows, error: sessionsError } = await supabase
          .from("sessions")
          .select("id, exercise, started_at, total_reps, total_time_seconds, is_demo")
          .order("started_at", { ascending: false });

        if (sessionsError) {
          throw sessionsError;
        }

        const publicSessions = getPublicHistorySessions((sessionRows ?? []) as Session[]);
        if (!active) {
          return;
        }

        setSessions(publicSessions);

        if (publicSessions.length === 0) {
          setReps([]);
          return;
        }

        const recentIds = publicSessions.slice(0, 20).map((session) => session.id);
        const { data: repRows, error: repsError } = await supabase
          .from("reps")
          .select("session_id, rom_score")
          .in("session_id", recentIds);

        if (repsError) {
          throw repsError;
        }

        if (!active) {
          return;
        }

        setReps((repRows ?? []) as Rep[]);
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Failed to load history.");
        setSessions([]);
        setReps([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [scriptedHistoryFixture]);

  const summary = useMemo(() => {
    const totalSessions = sessions.length;
    const totalReps = sessions.reduce((sum, session) => sum + (session.total_reps ?? 0), 0);
    const totalMinutes = Math.round(sessions.reduce((sum, session) => sum + (session.total_time_seconds ?? 0), 0) / 60);
    const romValues = reps.map((rep) => rep.rom_score).filter((value): value is number => typeof value === "number");
    const averageRom = romValues.length > 0 ? romValues.reduce((sum, value) => sum + value, 0) / romValues.length : null;

    return {
      totalSessions,
      totalReps,
      totalMinutes,
      averageRom,
    };
  }, [reps, sessions]);

  if (requiresAuth) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 p-10 text-center dark:border-slate-800">
          <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
            Signed-in beta history
          </div>
          <h1 className="mt-4 text-3xl font-bold">Sign in to view your history</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            History is part of the motion coaching MVP for signed-in beta users. Only real sessions saved from the coach should appear here.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/signin" className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container py-16">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              Coach history
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Saved coaching sessions</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              This page is limited to real sessions saved from the public coach. Demo history and synthetic trends are intentionally excluded from the MVP release.
            </p>
          </div>

          {loading ? (
            <MetricSkeletonRow />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Sessions" value={String(summary.totalSessions)} />
              <MetricCard label="Reps" value={String(summary.totalReps)} />
              <MetricCard label="Minutes" value={String(summary.totalMinutes)} />
              <MetricCard label="Average ROM" value={summary.averageRom === null ? "-" : summary.averageRom.toFixed(2)} />
            </div>
          )}

          {loading ? (
            <HistorySkeletonList />
          ) : error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <h2 className="text-2xl font-bold">No saved sessions yet</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Start a coaching session, finish the save flow, and your first real history entry will show up here.
              </p>
              <div className="mt-6">
                <Link href="/coach" className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                  Start session
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-4" data-testid="history-session-list">
              {sessions.map((session) => {
                const sessionHref = scriptedHistoryFixture
                  ? withLoopbackAutomationParams(`/session/${session.id}`, { "session-script": scriptedHistoryFixture.key })
                  : `/session/${session.id}`;

                return (
                  <li key={session.id} data-testid="history-session-row" className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold capitalize">{session.exercise}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{new Date(session.started_at).toLocaleString()}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {session.total_reps ?? 0} reps - {Math.round((session.total_time_seconds ?? 0) / 60)} min
                      </div>
                    </div>
                    <Link data-testid="history-session-link" href={sessionHref} className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                      View session
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className || ""}`} />;
}

function MetricSkeletonRow() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
          <SkeletonPulse className="h-4 w-16 mb-3" />
          <SkeletonPulse className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

function HistorySkeletonList() {
  return (
    <ul className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <SkeletonPulse className="h-5 w-24" />
            <SkeletonPulse className="h-4 w-40" />
            <SkeletonPulse className="h-4 w-32" />
          </div>
          <SkeletonPulse className="h-10 w-28 rounded-lg" />
        </li>
      ))}
    </ul>
  );
}
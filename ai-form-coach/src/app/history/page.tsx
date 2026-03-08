"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPublicHistorySessions } from "@/lib/history/publicHistory";
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

  useEffect(() => {
    let active = true;

    async function loadHistory() {
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
  }, []);

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
          <h1 className="text-3xl font-bold">Sign in to view your history</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            History is part of the coaching MVP for signed-in beta users. Demo sessions have been removed from the public product.
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">History</p>
            <h1 className="text-4xl font-extrabold tracking-tight">Saved coaching sessions</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              This view only shows real saved sessions from the coaching MVP. Demo history and synthetic trends are not part of the public beta.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Sessions" value={String(summary.totalSessions)} />
            <MetricCard label="Reps" value={String(summary.totalReps)} />
            <MetricCard label="Minutes" value={String(summary.totalMinutes)} />
            <MetricCard label="Average ROM" value={summary.averageRom === null ? "-" : summary.averageRom.toFixed(2)} />
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 p-8 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              Loading session history...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <h2 className="text-2xl font-bold">No saved sessions yet</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Start a coaching session to create your first real history entry.
              </p>
              <div className="mt-6">
                <Link href="/coach" className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                  Start session
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {sessions.map((session) => (
                <li key={session.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold capitalize">{session.exercise}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{new Date(session.started_at).toLocaleString()}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {session.total_reps ?? 0} reps · {Math.round((session.total_time_seconds ?? 0) / 60)} min
                    </div>
                  </div>
                  <Link href={`/session/${session.id}`} className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                    View session
                  </Link>
                </li>
              ))}
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

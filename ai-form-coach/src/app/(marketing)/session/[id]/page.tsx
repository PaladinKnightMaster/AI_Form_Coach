"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SessionChart from "@/components/SessionChart";
import { getTestSessionFixture } from "@/lib/history/testHistoryFixtures";
import { isLoopbackAutomationAllowed } from "@/lib/mvp/e2eAccess";
import { getSupabaseClient } from "@/lib/supabase/client";

type SessionRecord = {
  id: string;
  exercise: string;
  started_at: string;
  total_reps: number | null;
  total_time_seconds: number | null;
  is_demo?: boolean | null;
};

type RepRecord = {
  idx: number;
  start_ms: number;
  end_ms: number;
  peak_depth: number | null;
  rom_score: number | null;
};

type SaveState = "idle" | "saved" | "error";

function formatDuration(totalSeconds: number | null) {
  const seconds = Math.max(0, totalSeconds ?? 0);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes === 0) {
    return `${remainder}s`;
  }

  return `${minutes}m ${remainder}s`;
}

function getRomLabel(score: number | null) {
  if (score === null) {
    return "Unscored";
  }

  if (score >= 0.85) {
    return "Strong ROM";
  }

  if (score >= 0.65) {
    return "Good ROM";
  }

  return "Needs depth";
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const sessionId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [reps, setReps] = useState<RepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesState, setNotesState] = useState<SaveState>("idle");
  const [shareState, setShareState] = useState<SaveState>("idle");

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const loopbackHostname = typeof window !== "undefined" ? window.location.hostname : null;
  const sessionScriptKey = searchParams?.get("session-script") ?? null;
  const loopbackAutomationEnabled = isLoopbackAutomationAllowed(searchParams, loopbackHostname);
  const scriptedSessionFixture = useMemo(() => {
    if (process.env.NODE_ENV === "production" && !loopbackAutomationEnabled) {
      return null;
    }

    return getTestSessionFixture(sessionScriptKey, sessionId);
  }, [loopbackAutomationEnabled, sessionId, sessionScriptKey]);

  useEffect(() => {
    if (!sessionId || typeof window === "undefined") {
      return;
    }

    const savedNote = window.localStorage.getItem(`coach-session-note:${sessionId}`) ?? "";
    setNotesDraft(savedNote);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setError("Missing session id.");
      return;
    }

    let active = true;

    async function loadSession() {
      if (scriptedSessionFixture) {
        if (!active) {
          return;
        }

        setRequiresAuth(false);
        setError(null);
        setSession(scriptedSessionFixture.session);
        setReps(scriptedSessionFixture.reps);
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
          setSession(null);
          setReps([]);
          return;
        }

        const { data: sessionRow, error: sessionError } = await supabase
          .from("sessions")
          .select("id, exercise, started_at, total_reps, total_time_seconds")
          .eq("id", sessionId)
          .maybeSingle();

        if (sessionError) {
          throw sessionError;
        }

        if (!sessionRow) {
          throw new Error("This saved session is not available in the public beta.");
        }

        const { data: repRows, error: repsError } = await supabase
          .from("reps")
          .select("idx, start_ms, end_ms, peak_depth, rom_score")
          .eq("session_id", sessionId)
          .order("idx", { ascending: true });

        if (repsError) {
          throw repsError;
        }

        if (!active) {
          return;
        }

        setSession(sessionRow as SessionRecord);
        setReps((repRows ?? []) as RepRecord[]);
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Failed to load session.");
        setSession(null);
        setReps([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [scriptedSessionFixture, sessionId]);

  const summary = useMemo(() => {
    const romValues = reps.map((rep) => rep.rom_score).filter((value): value is number => typeof value === "number");
    const averageRom = romValues.length > 0 ? romValues.reduce((sum, value) => sum + value, 0) / romValues.length : null;
    const bestDepth = reps.reduce((best, rep) => Math.max(best, rep.peak_depth ?? 0), 0);

    return {
      averageRom,
      bestDepth,
      strongReps: reps.filter((rep) => (rep.rom_score ?? 0) >= 0.85).length,
    };
  }, [reps]);

  if (requiresAuth) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 p-10 text-center dark:border-slate-800">
          <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
            Signed-in beta session review
          </div>
          <h1 className="mt-4 text-3xl font-bold">Sign in to view this session</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Session detail is limited to real saved coach sessions from signed-in beta accounts.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 p-8 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          Loading session details...
        </div>
      </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error ?? "Session not found."}
          <div className="mt-6">
            <Link
              href="/history"
              className="inline-flex items-center justify-center rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-900 dark:border-rose-800 dark:text-rose-200 dark:hover:border-rose-600 dark:hover:text-white"
            >
              Back to history
            </Link>
          </div>
        </div>
      </div>
      </div>
    );
  }

  const sessionRecord = session;

  const handleDownloadCsv = () => {
    const csvRows = [
      "rep_idx,start_ms,end_ms,peak_depth,rom_score",
      ...reps.map((rep) => [rep.idx, rep.start_ms, rep.end_ms, rep.peak_depth ?? "", rep.rom_score ?? ""].join(",")),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sessionRecord.exercise}-${sessionRecord.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareSummary = async () => {
    const shareText = [
      `${sessionRecord.exercise.toUpperCase()} session`,
      `${sessionRecord.total_reps ?? 0} reps`,
      `${formatDuration(sessionRecord.total_time_seconds)}`,
      summary.averageRom === null ? null : `Average ROM ${summary.averageRom.toFixed(2)}`,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "AI Form Coach session",
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      }

      setShareState("saved");
      window.setTimeout(() => setShareState("idle"), 2500);
    } catch {
      setShareState("error");
      window.setTimeout(() => setShareState("idle"), 3000);
    }
  };

  const handleSaveNote = () => {
    if (!sessionId || typeof window === "undefined") {
      setNotesState("error");
      return;
    }

    try {
      window.localStorage.setItem(`coach-session-note:${sessionId}`, notesDraft);
      setNotesState("saved");
      window.setTimeout(() => setNotesState("idle"), 2500);
    } catch {
      setNotesState("error");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                Session review
              </div>
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{sessionRecord.exercise}</div>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Saved coach session</h1>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Review the reps captured during your session, export the raw rep data, and keep a short private note on this device.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/history"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
              >
                Back to history
              </Link>
              <button
                data-testid="session-export-csv"
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleShareSummary}
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {shareState === "saved" ? "Shared" : shareState === "error" ? "Share failed" : "Share summary"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Date" value={new Date(sessionRecord.started_at).toLocaleString()} />
            <MetricCard label="Reps" value={String(sessionRecord.total_reps ?? reps.length)} />
            <MetricCard label="Duration" value={formatDuration(sessionRecord.total_time_seconds)} />
            <MetricCard
              label="Average ROM"
              value={summary.averageRom === null ? "-" : summary.averageRom.toFixed(2)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Rep quality</div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Session chart</h2>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <div>{summary.strongReps} strong ROM reps</div>
                  <div className="mt-1">Best depth {summary.bestDepth.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <SessionChart reps={reps} />
              </div>

              <div className="mt-6 space-y-3">
                {reps.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    No rep rows were saved for this session.
                  </div>
                ) : (
                  reps.map((rep) => (
                    <div
                      key={rep.idx}
                      className="flex flex-col gap-3 rounded-3xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-950 dark:text-white">Rep {rep.idx + 1}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {Math.max(0, rep.end_ms - rep.start_ms)} ms captured
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatChip label="Peak depth" value={rep.peak_depth === null ? "-" : rep.peak_depth.toFixed(2)} />
                        <StatChip label="ROM" value={rep.rom_score === null ? "-" : rep.rom_score.toFixed(2)} />
                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                          {getRomLabel(rep.rom_score)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <p>
                    This session detail page is intentionally limited to real saved beta sessions. Legacy verification,
                    embeddings, and report-generation modules are excluded from the current release.
                  </p>
                  <p>
                    Use this page to review rep quality, export the raw rep rows, and keep a short note tied to this
                    session on your current device.
                  </p>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Private note</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Device-local note</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Saved locally in this browser only. Use it for setup reminders, recovery notes, or what to improve next session.
                </p>
                <textarea
                  data-testid="session-note-field"
                  value={notesDraft}
                  onChange={(event) => {
                    setNotesDraft(event.target.value);
                    if (notesState !== "idle") {
                      setNotesState("idle");
                    }
                  }}
                  rows={6}
                  placeholder="Example: Camera one step farther back for better ankle visibility."
                  className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-white"
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {notesState === "saved" ? "Saved on this device." : notesState === "error" ? "Could not save this note." : "Not synced to your account."}
                  </div>
                  <button
                    data-testid="session-save-note"
                    type="button"
                    onClick={handleSaveNote}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    Save note
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-bold text-slate-950 dark:text-white">{value}</div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      {label}: {value}
    </span>
  );
}
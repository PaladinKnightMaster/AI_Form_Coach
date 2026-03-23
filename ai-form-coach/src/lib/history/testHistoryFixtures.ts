export type HistoryFixtureSession = {
  id: string;
  exercise: "squat" | "pushup" | "plank";
  started_at: string;
  total_reps: number;
  total_time_seconds: number;
  is_demo: false;
};

export type HistoryFixtureRep = {
  session_id: string;
  idx: number;
  start_ms: number;
  end_ms: number;
  peak_depth: number | null;
  rom_score: number | null;
};

export type HistoryFixtureBundle = {
  key: "coach-beta-history";
  sessions: HistoryFixtureSession[];
  reps: HistoryFixtureRep[];
};

const coachBetaHistoryFixture: HistoryFixtureBundle = {
  key: "coach-beta-history",
  sessions: [
    {
      id: "session-squat-001",
      exercise: "squat",
      started_at: "2026-03-15T14:00:00.000Z",
      total_reps: 4,
      total_time_seconds: 96,
      is_demo: false,
    },
    {
      id: "session-pushup-001",
      exercise: "pushup",
      started_at: "2026-03-15T13:40:00.000Z",
      total_reps: 3,
      total_time_seconds: 88,
      is_demo: false,
    },
  ],
  reps: [
    { session_id: "session-squat-001", idx: 0, start_ms: 0, end_ms: 1300, peak_depth: 0.71, rom_score: 0.92 },
    { session_id: "session-squat-001", idx: 1, start_ms: 1450, end_ms: 2820, peak_depth: 0.69, rom_score: 0.88 },
    { session_id: "session-squat-001", idx: 2, start_ms: 2980, end_ms: 4410, peak_depth: 0.67, rom_score: 0.82 },
    { session_id: "session-squat-001", idx: 3, start_ms: 4560, end_ms: 6040, peak_depth: 0.73, rom_score: 0.94 },
    { session_id: "session-pushup-001", idx: 0, start_ms: 0, end_ms: 1540, peak_depth: 0.62, rom_score: 0.9 },
    { session_id: "session-pushup-001", idx: 1, start_ms: 1700, end_ms: 3300, peak_depth: 0.59, rom_score: 0.84 },
    { session_id: "session-pushup-001", idx: 2, start_ms: 3440, end_ms: 5080, peak_depth: 0.61, rom_score: 0.87 },
  ],
};

function cloneFixture(bundle: HistoryFixtureBundle): HistoryFixtureBundle {
  return {
    key: bundle.key,
    sessions: bundle.sessions.map((session) => ({ ...session })),
    reps: bundle.reps.map((rep) => ({ ...rep })),
  };
}

export function getTestHistoryFixture(name: string | null): HistoryFixtureBundle | null {
  if (name === coachBetaHistoryFixture.key) {
    return cloneFixture(coachBetaHistoryFixture);
  }

  return null;
}

export function getTestSessionFixture(name: string | null, sessionId: string | null | undefined) {
  const fixture = getTestHistoryFixture(name);
  if (!fixture || !sessionId) {
    return null;
  }

  const session = fixture.sessions.find((entry) => entry.id === sessionId);
  if (!session) {
    return null;
  }

  return {
    key: fixture.key,
    session,
    reps: fixture.reps.filter((rep) => rep.session_id === sessionId),
  };
}

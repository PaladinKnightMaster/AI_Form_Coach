import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const authGetUser = vi.fn();
const sessionMaybeSingle = vi.fn();
const repsOrder = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "session-123" }),
}));

vi.mock("@/components/SessionChart", () => ({
  default: ({ reps }: { reps: Array<{ idx: number }> }) => <div data-testid="session-chart">{reps.length}</div>,
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({
    auth: {
      getUser: authGetUser,
    },
    from: (table: string) => {
      if (table === "sessions") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: sessionMaybeSingle,
            }),
          }),
        };
      }

      if (table === "reps") {
        return {
          select: () => ({
            eq: () => ({
              order: repsOrder,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

import SessionDetailPage from "@/app/session/[id]/page";

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("session detail MVP page", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    authGetUser.mockReset();
    sessionMaybeSingle.mockReset();
    repsOrder.mockReset();
    window.localStorage.clear();
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
    }

    container?.remove();
    container = null;
    root = null;
  });

  async function renderPage() {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<SessionDetailPage />);
    });

    await flushEffects();
    return container;
  }

  it("requires sign-in before showing a saved session", async () => {
    authGetUser.mockResolvedValue({ data: { user: null } });

    const page = await renderPage();

    expect(page.textContent).toContain("Sign in to view this session");
    expect(page.textContent).toContain("Signed-in beta session review");
    expect(sessionMaybeSingle).not.toHaveBeenCalled();
    expect(repsOrder).not.toHaveBeenCalled();
  });

  it("keeps the session page focused on MVP session review content", async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    sessionMaybeSingle.mockResolvedValue({
      data: {
        id: "session-123",
        exercise: "squat",
        started_at: "2026-03-15T10:00:00.000Z",
        total_reps: 3,
        total_time_seconds: 92,
        is_demo: false,
      },
      error: null,
    });
    repsOrder.mockResolvedValue({
      data: [
        { idx: 0, start_ms: 0, end_ms: 1400, peak_depth: 0.72, rom_score: 0.91 },
        { idx: 1, start_ms: 1600, end_ms: 3000, peak_depth: 0.69, rom_score: 0.83 },
      ],
      error: null,
    });
    window.localStorage.setItem("coach-session-note:session-123", "Keep the camera lower next time.");

    const page = await renderPage();
    const noteField = page.querySelector("textarea") as HTMLTextAreaElement | null;

    expect(page.textContent).toContain("Saved coach session");
    expect(page.textContent).toContain("Session chart");
    expect(page.textContent).toContain("Device-local note");
    expect(page.textContent).toContain("Strong ROM");
    expect(page.querySelector('[data-testid="session-chart"]')?.textContent).toBe("2");
    expect(noteField?.value).toBe("Keep the camera lower next time.");
    expect(page.textContent).not.toContain("Verification");
    expect(page.textContent).not.toContain("Similar sessions");
    expect(page.textContent).not.toContain("Report");
  });
});
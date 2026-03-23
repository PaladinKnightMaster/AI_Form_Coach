import { describe, expect, it } from "vitest";
import { getPublicHistorySessions } from "@/lib/history/publicHistory";

describe("public history", () => {
  it("filters demo sessions and sorts newest first", () => {
    const sessions = getPublicHistorySessions([
      { id: "1", started_at: "2026-03-02T10:00:00.000Z", is_demo: false },
      { id: "2", started_at: "2026-03-04T10:00:00.000Z", is_demo: true },
      { id: "3", started_at: "2026-03-05T10:00:00.000Z" },
    ]);

    expect(sessions.map((session) => session.id)).toEqual(["3", "1"]);
  });
});

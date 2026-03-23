import { describe, expect, it } from "vitest";
import { createCueCadenceState, resolveCueCadence } from "@/lib/coach/cueCadence";

describe("coach cue cadence", () => {
  it("holds the current cue until a new cue repeats enough times", () => {
    let state = createCueCadenceState("Keep chest up", "Stack shoulders", 0);

    const first = resolveCueCadence(state, "Drive through the floor", "Brace", 400);
    state = first.state;
    const second = resolveCueCadence(state, "Drive through the floor", "Brace", 800);
    state = second.state;
    const third = resolveCueCadence(state, "Drive through the floor", "Brace", 1200);

    expect(first.primary).toBe("Keep chest up");
    expect(second.primary).toBe("Keep chest up");
    expect(third.primary).toBe("Drive through the floor");
    expect(third.primaryChanged).toBe(true);
  });

  it("updates secondary guidance immediately when the primary cue stays the same", () => {
    const state = createCueCadenceState("Hold line", "Shoulders stacked", 0);
    const result = resolveCueCadence(state, "Hold line", "Hips level", 300);

    expect(result.primary).toBe("Hold line");
    expect(result.secondary).toBe("Hips level");
    expect(result.primaryChanged).toBe(false);
  });
});

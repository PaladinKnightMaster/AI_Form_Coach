/**
 * Exponential moving average smoother for phase-detection angle signals.
 *
 * Replaces the broken Savitzky-Golay filter (war-room #1). Properties:
 *  - seed-first: the first sample is passed through, so a constant input
 *    round-trips exactly (no warm-up error).
 *  - output is a convex combination of inputs, so it stays within the input
 *    range — for normalized [0,1] angles the HMM observation means remain valid.
 */
export class EmaSmoother {
  private smoothed: number | null = null;

  /** @param alpha smoothing factor in (0, 1]; higher = more responsive. */
  constructor(private alpha: number) {}

  addPoint(_timestamp: number, value: number): number {
    this.smoothed =
      this.smoothed === null
        ? value
        : this.alpha * value + (1 - this.alpha) * this.smoothed;
    return this.smoothed;
  }

  clear(): void {
    this.smoothed = null;
  }
}

/** Map an effective window size to an EMA alpha via the standard 2/(N+1). */
export function alphaFromWindow(windowSize: number): number {
  return 2 / (Math.max(1, windowSize) + 1);
}

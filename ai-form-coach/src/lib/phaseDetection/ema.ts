/**
 * Exponential moving average smoother for phase-detection angle signals.
 *
 * Replaces the broken Savitzky-Golay filter (war-room #1). Properties:
 *  - seed-first: the first sample is passed through, so a constant input
 *    round-trips exactly (no warm-up error).
 *  - output is a convex combination of inputs, so it stays within the input
 *    range — for normalized [0,1] angles the HMM observation means remain valid.
 *
 * Smoothing is intentionally PER-SAMPLE, not time-aware: alpha applies once per
 * frame regardless of the gap since the last frame (hence the unused timestamp).
 * This matches the rep-detection tuning validated in war-room #1 and the prior
 * SG filter's sample-based behavior. The trade-off is that effective smoothing
 * scales with frame rate; that's acceptable for Beta 1 (the HMM debounce absorbs
 * it). If smoothing ever feels inconsistent across very different device frame
 * rates, switch addPoint to a dt-based alpha (1 - exp(-dt/tau)) and re-validate
 * the rep-count tests before shipping.
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

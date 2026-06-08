/** Versioned so a future tips refresh can re-prompt. */
export const COACH_TIPS_SEEN_KEY = "carriage.coachTipsSeenV1";

/** Show the one-time tips card only when unseen and not under the e2e bypass. */
export function shouldShowCoachTips(seen: boolean, isE2E: boolean): boolean {
  return !seen && !isE2E;
}

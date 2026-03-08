/**
 * Haptic feedback patterns for Forma.
 * Uses the Vibration API — supported on Android; silently ignored on iOS.
 * All calls are SSR-safe (guarded against missing navigator).
 */

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export const haptic = {
  /** Set logged, exercise complete — positive confirmation */
  success: () => vibrate([50, 30, 50, 30, 80]),

  /** Rest timer ended, missed target — attention required */
  alert: () => vibrate([100, 50, 100]),

  /** Soft double-pulse for timer tick signals */
  timer: () => vibrate([30, 20, 30]),

  /** Workout finished — strong single pulse */
  heavy: () => vibrate([200]),

  /** Onboarding handoff — double-pulse confirmation */
  handoff: () => vibrate([40, 80, 40]),
};

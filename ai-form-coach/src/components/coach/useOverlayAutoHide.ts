"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseOverlayAutoHideOptions {
  /** Milliseconds of inactivity before controls hide (default: 3500) */
  timeout?: number;
  /** Whether auto-hide is enabled (typically only during active session) */
  enabled?: boolean;
}

interface UseOverlayAutoHideReturn {
  /** Whether overlay controls should be visible */
  visible: boolean;
  /** Call on user interaction to reset the hide timer */
  poke: () => void;
  /** Props to spread on the camera stage container for pointer/keyboard detection */
  containerProps: {
    tabIndex: number;
    onPointerMove: () => void;
    onPointerDown: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

/** Minimum ms between consecutive poke() calls from pointer movement */
const POINTER_THROTTLE_MS = 120;

/**
 * Zoom-like auto-hide overlay controls.
 *
 * - Controls appear on any pointer movement, touch, or keypress
 * - After `timeout` ms of inactivity, controls fade out
 * - Escape key always reveals controls
 * - When `enabled` is false, controls are always visible
 * - Pointer moves are throttled to avoid excessive timer churn
 */
export function useOverlayAutoHide({
  timeout = 3500,
  enabled = false,
}: UseOverlayAutoHideOptions = {}): UseOverlayAutoHideReturn {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPokeRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poke = useCallback(() => {
    setVisible(true);
    clearTimer();
    if (enabled) {
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, timeout);
    }
  }, [enabled, timeout, clearTimer]);

  /** Throttled version of poke for high-frequency events like pointer move */
  const throttledPoke = useCallback(() => {
    const now = Date.now();
    if (now - lastPokeRef.current < POINTER_THROTTLE_MS) return;
    lastPokeRef.current = now;
    poke();
  }, [poke]);

  // Reset when enabled changes — setState in effect is intentional here
  // to synchronize visibility state with the enabled prop.
  useEffect(() => {
    if (!enabled) {
      clearTimer();
      setVisible(true); // eslint-disable-line react-hooks/set-state-in-effect -- syncing visibility with enabled prop
      return;
    }
    // Start the first hide timer when enabled
    poke();
    return clearTimer;
  }, [enabled, poke, clearTimer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape always reveals
      if (e.key === "Escape") {
        poke();
        return;
      }
      // Any other key while controls are hidden → reveal
      if (!visible) {
        poke();
      }
    },
    [visible, poke],
  );

  const containerProps = {
    tabIndex: -1,
    onPointerMove: throttledPoke,
    onPointerDown: poke,
    onKeyDown: handleKeyDown,
  };

  return {
    visible: enabled ? visible : true,
    poke,
    containerProps,
  };
}

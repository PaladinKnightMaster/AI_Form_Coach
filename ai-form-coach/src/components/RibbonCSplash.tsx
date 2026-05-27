"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/* ─────────────────────────────────────────────────────────────────────────
 * Carriage signature splash — the Ribbon C draws itself.
 *
 * Frame plan (locked · Design System Vol. 01 § 10):
 *
 *   0 →  200 ms · calibration node 2 appears
 *   200 → 800 ms · line draws C (ease-out, stroke-dashoffset)
 *   800 →1100 ms · nodes 1 & 3 appear; node 2 settles to champagne
 *  1100 →1400 ms · wordmark + descriptor fade in
 *  1400 →1600 ms · hold (200 ms)
 *  1600 →1840 ms · overlay fades out, unmounts
 *
 * Triggers:
 *   • First load per browser tab (sessionStorage gate · key `carriage:splash:v1`).
 *   • Esc or tap anywhere skips.
 *   • prefers-reduced-motion → final frame painted instantly, holds 400 ms,
 *     fades 200 ms. The line does not draw; the colour does not animate.
 *
 * All animation lives in globals.css under the .ribbon-splash-* selectors.
 * This component is just orchestration + the SVG markup.
 * ──────────────────────────────────────────────────────────────────────── */

const SESSION_KEY = "carriage:splash:v1";

type Phase = "hidden" | "playing" | "dismissing";

interface RibbonCSplashProps {
  /** Override the sessionStorage gate — useful for previewing in dev. */
  forceShow?: boolean;
}

export default function RibbonCSplash({ forceShow = false }: RibbonCSplashProps) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("hidden");
  const pathRef = useRef<SVGPathElement>(null);

  // 1) First-load gate. Runs once on mount; sessionStorage scoped to this tab.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!forceShow && sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "shown");
    // Intentional post-mount state set: sessionStorage isn't available during
    // SSR/hydration, so we render `hidden` first and transition to `playing`
    // once we know the gate. This is the documented escape hatch for
    // react-hooks/set-state-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("playing");
  }, [forceShow]);

  // 2) Measure the path once so the dashoffset draw lands precisely.
  //    The locked Bézier produces ~540 SVG units; we read the real number
  //    at mount so any future tweak to the path stays in sync.
  useEffect(() => {
    if (phase !== "playing" || !pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    pathRef.current.style.setProperty("--ribbon-len", String(len));
  }, [phase]);

  // 3) Auto-dismiss after the timeline. Honour reduced motion.
  useEffect(() => {
    if (phase !== "playing") return;
    const total = reduced ? 600 : 1600;   // hold time before fade starts
    const fade = window.setTimeout(() => setPhase("dismissing"), total);
    const unmount = window.setTimeout(() => setPhase("hidden"), total + 260);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(unmount);
    };
  }, [phase, reduced]);

  // 4) Skip controls — Esc, tap. We attach to the whole window so the
  //    overlay is fully bypassed at any moment.
  useEffect(() => {
    if (phase !== "playing") return;
    const skip = () => setPhase("dismissing");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-phase={phase}
      data-reduced={reduced ? "true" : "false"}
      onClick={() => setPhase("dismissing")}
      className="ribbon-splash"
    >
      <div className="ribbon-splash-inner">
        <svg
          viewBox="0 0 220 220"
          width="220"
          height="220"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            ref={pathRef}
            d="M 168 56 C 138 30, 86 30, 60 70 C 34 110, 34 156, 70 184 C 102 208, 156 200, 178 168"
            fill="none"
            stroke="#149A80"
            strokeWidth="9"
            strokeLinecap="round"
            className="ribbon-splash-path"
          />
          {/* Order matters for staggered fade — middle node first. */}
          <circle className="ribbon-splash-node ribbon-splash-node-mid" cx="44" cy="130" r="5.5" />
          <circle className="ribbon-splash-node ribbon-splash-node-top" cx="60" cy="70" r="5.5" />
          <circle className="ribbon-splash-node ribbon-splash-node-btm" cx="102" cy="200" r="5.5" />
        </svg>

        <div className="ribbon-splash-text">
          <div className="ribbon-splash-word">Carriage</div>
          <div className="ribbon-splash-desc">AI Form Coach</div>
        </div>
      </div>
    </div>
  );
}

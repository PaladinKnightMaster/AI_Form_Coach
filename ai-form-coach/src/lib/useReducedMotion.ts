"use client";
import { useState, useEffect } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getInitialState(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

/**
 * Returns true when the user prefers reduced motion.
 * Listens for changes (e.g., user toggles the OS setting mid-session).
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(getInitialState);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduceMotion;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { safetyScreening } from "@/lib/legal/legalContent";

/**
 * One-time pre-session safety self-attestation, as an accessible modal dialog.
 * Show-don't-store: criteria are displayed for self-evaluation; only the single
 * attestation is required. No health answers are collected. `onAccept` records
 * consent + dismisses. Acceptance is required, so Escape does NOT dismiss.
 */
export default function FirstSessionSafetyGate({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    headingRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Acceptance is required — do not allow Escape to dismiss.
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused.current?.focus?.();
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-gate-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-md space-y-5 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100">
        <h2
          id="safety-gate-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-bold outline-none"
        >
          Before you start
        </h2>
        <p className="text-sm text-slate-300">{safetyScreening.intro}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {safetyScreening.criteria.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <label className="flex items-start gap-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 shrink-0"
          />
          <span>{safetyScreening.attestationLabel}</span>
        </label>
        <button
          type="button"
          disabled={!checked}
          onClick={onAccept}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition enabled:hover:bg-emerald-500 disabled:opacity-50"
        >
          Begin
        </button>
      </div>
    </div>
  );
}

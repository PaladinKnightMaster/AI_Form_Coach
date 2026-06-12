"use client";

import { useEffect, useRef } from "react";

const INTRO =
  "Carriage reads your form from a single camera. A clear, side-on view is all it needs to coach you well — a quiet minute of setup makes every session sharper.";

const TIPS = [
  { label: "Turn side-on", detail: "Stand about 30–45° to the camera so each working joint stays in view." },
  { label: "Light it softly", detail: "Face an even light; keep bright windows ahead of you, not behind." },
  { label: "Wear something fitted", detail: "Close-fitting layers let the coach trace your true line." },
  { label: "Make space", detail: "Step back roughly six feet, until shoulders to ankles rest comfortably in frame." },
] as const;

const LIMITS =
  "Carriage is a single-camera companion, not a clinic — read its counts and angles as considered guidance, a mirror for your practice rather than a precise measurement.";

export default function CoachTipsCard({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    headingRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
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
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-tips-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-md space-y-5 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100">
        <h2 id="coach-tips-heading" ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none">
          Set the scene
        </h2>
        <p className="text-sm text-slate-300">{INTRO}</p>
        <ul className="space-y-3">
          {TIPS.map((t) => (
            <li key={t.label} className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-white">{t.label}</span>
              <span className="text-sm text-slate-300">{t.detail}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-5 text-slate-400">{LIMITS}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          I&apos;m ready
        </button>
      </div>
    </div>
  );
}

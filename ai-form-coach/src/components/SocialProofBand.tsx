"use client";

const betaSignals = [
  {
    label: "Launch focus",
    value: "3 exercises",
    detail: "Squat, pushup, and plank only.",
  },
  {
    label: "Coaching loop",
    value: "Browser-based",
    detail: "Live pose feedback stays in the browser during sessions.",
  },
  {
    label: "Cue pack",
    value: "Human-reviewed",
    detail: "Launch cues are authored and reviewed by humans.",
  },
];

export default function SocialProofBand() {
  return (
    <div className="section">
      <div className="grid gap-4 lg:grid-cols-3">
        {betaSignals.map((signal) => (
          <article key={signal.label} className="card p-4">
            <div className="text-xs uppercase tracking-[0.2em] opacity-70">{signal.label}</div>
            <div className="mt-2 text-xl font-semibold">{signal.value}</div>
            <p className="mt-2 text-sm leading-6 opacity-80">{signal.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
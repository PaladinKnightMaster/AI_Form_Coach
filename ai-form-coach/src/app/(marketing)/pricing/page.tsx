import Link from "next/link";

const included = [
  "Live coaching for squat, pushup, and plank",
  "Private browser-based pose analysis during live sessions",
  "Saved history for signed-in beta users",
  "Human-reviewed cue pack and tutorial samples",
];

const excluded = [
  "Nutrition tracking and food scan",
  "AI-generated workout plans",
  "Health integrations and readiness scoring",
  "Paid subscriptions or checkout flow",
  "Community challenges and creator packs",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="space-y-4 text-center">
            <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              Free public beta
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">No paid plans at launch.</h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600">
              This is a focused motion coaching beta. We are not collecting payment details or selling extra modules while the live coach is still being tuned for reliable session quality.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <h2 className="text-2xl font-bold">Included today</h2>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
                {included.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8">
              <h2 className="text-2xl font-bold">Not part of the beta</h2>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
                {excluded.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="rounded-3xl border border-slate-200 p-8 text-center">
            <h2 className="text-2xl font-bold">What happens after beta?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Pricing will only be revisited after the beta proves activation, session completion, and repeat usage on the core coach. Until then, the job is product quality, not monetization.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signin?mode=signup" className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Create account
              </Link>
              <Link href="/coach" className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950">
                Open coach
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

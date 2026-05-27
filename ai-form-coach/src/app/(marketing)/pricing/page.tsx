import Link from "next/link";

/* ─────────────────────────────────────────────────────────────────────────
 * Carriage pricing page — beta scope, not a price sheet.
 * Surface: bone (#F4EFE6) · ink (#17120D) · malachite accents.
 * Voice rule: do not display a $0/mo card. Beta is free, full stop.
 * ──────────────────────────────────────────────────────────────────────── */

const included = [
  "Live coaching cues for squat, pushup, and plank.",
  "Browser-based pose analysis during live sessions.",
  "Saved history for signed-in beta users.",
  "Human-reviewed cue pack and tutorial samples.",
];

const excluded = [
  "Nutrition tracking and food scan.",
  "AI-generated plans.",
  "Health integrations and readiness scoring.",
  "Paid subscriptions or checkout flow.",
  "Community, challenges, and creator packs.",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#17120D]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-14">

          {/* Hero */}
          <header className="space-y-6 text-center">
            <div className="eyebrow !text-[#0E6F5C]">Free, while in beta</div>
            <h1
              className="font-display italic text-[#17120D]"
              style={{
                fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
                fontWeight: 500,
              }}
            >
              No paid plans at launch.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[#4B423A]">
              Carriage is a focused motion-coaching beta. We are not collecting payment details or selling add-ons while the live coach is still being tuned for session quality.
            </p>
          </header>

          {/* Included / excluded */}
          <div className="grid gap-px overflow-hidden border border-[#C7B796] bg-[#C7B796] lg:grid-cols-2">
            <section className="bg-[#FAF6EF] p-8 lg:p-12">
              <div className="eyebrow !text-[#0E6F5C]">In the beta</div>
              <h2
                className="mt-4 font-display italic text-[#17120D]"
                style={{
                  fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                  fontSize: "1.75rem",
                  lineHeight: 1.15,
                  letterSpacing: "-0.018em",
                  fontWeight: 500,
                }}
              >
                Included today.
              </h2>
              <ul className="mt-6 space-y-3 text-base leading-7 text-[#17120D]">
                {included.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-[#E5DDCD] pb-3 last:border-b-0">
                    <span className="mt-3 h-[5px] w-[5px] flex-shrink-0 rounded-full bg-[#0E6F5C]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-[#F4EFE6] p-8 lg:p-12">
              <div className="eyebrow !text-[#8A6F4A]">Not in the beta</div>
              <h2
                className="mt-4 font-display italic text-[#17120D]"
                style={{
                  fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                  fontSize: "1.75rem",
                  lineHeight: 1.15,
                  letterSpacing: "-0.018em",
                  fontWeight: 500,
                }}
              >
                Held back, on purpose.
              </h2>
              <ul className="mt-6 space-y-3 text-base leading-7 text-[#4B423A]">
                {excluded.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-[#E5DDCD] pb-3 last:border-b-0">
                    <span className="mt-3 h-[5px] w-[5px] flex-shrink-0 rounded-full bg-[#B99A7A]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Post-beta */}
          <section className="border border-[#17120D] bg-[#FAF6EF] p-8 lg:p-12 text-center">
            <div className="eyebrow !text-[#0E6F5C]">After beta</div>
            <h2
              className="mt-4 font-display italic text-[#17120D]"
              style={{
                fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                fontWeight: 500,
              }}
            >
              Pricing revisits, after the line settles.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#4B423A]">
              We will revisit pricing only after the beta proves activation, session completion, and repeat usage on the core coach. Until then, the job is product quality.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signin?mode=signup"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-[#F4EFE6] shadow-md transition hover:-translate-y-px"
                style={{ background: "linear-gradient(135deg, #149A80 0%, #094B3F 100%)" }}
              >
                Create account
              </Link>
              <Link
                href="/coach"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#17120D] px-6 py-3 text-base font-semibold text-[#17120D] transition hover:bg-[#17120D] hover:text-[#F4EFE6]"
              >
                Open coach
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

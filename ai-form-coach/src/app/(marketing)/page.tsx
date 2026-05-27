import Link from "next/link";
import { launchBetaTutorialSamples, launchBetaVoiceCuePack } from "@/lib/mvp/content";
import { MVP_EXERCISES } from "@/lib/mvp/featureRegistry";
import { Container, Section } from "@/ui/DS";

/* ─────────────────────────────────────────────────────────────────────────
 * Carriage marketing homepage — bone editorial surface.
 *
 * Surface:  #F4EFE6 bone · ink text (#17120D) · malachite accents
 * Voice:    Calm. Precise. Private. Direct. No hype.
 * Hero:     italic Fraunces "Return to your line." · single malachite CTA.
 * ──────────────────────────────────────────────────────────────────────── */

const betaIncludes = [
  "Live coaching cues for squat, pushup, and plank.",
  "Rep counting and session summaries.",
  "A human-authored cue pack — no LLM in the live loop.",
  "Saved history when you sign in.",
];

const betaExcludes = [
  "Nutrition tracking and food scan.",
  "AI-generated plans.",
  "Health integrations and readiness scoring.",
  "Community, challenges, and creator packs.",
];

const systemCards = [
  {
    eyebrow: "On-device",
    title: "Your video stays on your device.",
    body: "MediaPipe runs in the browser. Camera frames never leave your laptop or phone during a session.",
  },
  {
    eyebrow: "Human-authored",
    title: "A teacher's cues. Not an LLM's.",
    body: "Every coaching cue in the live loop was written and reviewed by a human. We do not generate them at runtime.",
  },
  {
    eyebrow: "Real history",
    title: "Sessions, saved when you sign in.",
    body: "Signed-in beta users see their own sessions in history. No demo data, no fake counts.",
  },
];

export default function Home() {
  return (
    <div className="bg-[#F4EFE6] text-[#17120D]">
      {/* ─── Hero · bone editorial ─────────────────────────────────────── */}
      <section className="relative">
        <Container className="py-20 sm:py-24 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-10">
              <div className="eyebrow !text-[#0E6F5C]">Public beta · On-device</div>

              <div className="space-y-6">
                <h1
                  className="font-display italic text-[#17120D]"
                  style={{
                    fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                    fontSize: "clamp(2.75rem, 6vw, 5.5rem)",
                    lineHeight: 0.95,
                    letterSpacing: "-0.025em",
                    fontWeight: 500,
                  }}
                >
                  Return to your line.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[#4B423A]">
                  AI Form Coach watches your squat, pushup, and plank — and gives you the cues a good teacher would. Your video stays on your device.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/coach"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-[#F4EFE6] shadow-md transition hover:-translate-y-px"
                  style={{ background: "linear-gradient(135deg, #149A80 0%, #094B3F 100%)" }}
                >
                  Start beta session
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#17120D] px-6 py-3 text-base font-semibold text-[#17120D] transition hover:bg-[#17120D] hover:text-[#F4EFE6]"
                >
                  See beta scope
                </Link>
              </div>

              {/* Three movements, exact — never "exercises" */}
              <div className="grid gap-3 sm:grid-cols-3">
                {MVP_EXERCISES.map((exercise) => (
                  <div
                    key={exercise}
                    className="rounded-md border border-[#C7B796] bg-[#FAF6EF] px-4 py-4"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A6F4A]">
                      Launch movement
                    </div>
                    <div
                      className="mt-1 font-display italic capitalize text-[#17120D]"
                      style={{
                        fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1',
                        fontSize: "1.5rem",
                        lineHeight: 1.1,
                        letterSpacing: "-0.012em",
                        fontWeight: 500,
                      }}
                    >
                      {exercise}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column · single editorial trust card.
                Replaces the legacy three-glass-card grid; HeroCanvas stays
                dormant per Step 04 follow-up. */}
            <aside className="border border-[#17120D] bg-[#FAF6EF] p-8 sm:p-10">
              <div className="eyebrow !text-[#0E6F5C]">Trust line</div>
              <p
                className="mt-4 font-display italic text-[#17120D]"
                style={{
                  fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1',
                  fontSize: "clamp(1.5rem, 2.4vw, 2rem)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.012em",
                  fontWeight: 500,
                }}
              >
                Your video stays on your device.
              </p>
              <hr className="my-6 border-0 border-t border-[#C7B796]" />
              <p className="text-sm leading-7 text-[#4B423A]">
                Pose detection runs entirely in your browser. Camera frames are not uploaded during a live session. Session summaries — counts, cues, the line you held — save only when you sign in.
              </p>
              <hr className="my-6 border-0 border-t border-[#C7B796]" />
              <dl className="grid grid-cols-2 gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8A6F4A]">
                <div>
                  <dt>In beta</dt>
                  <dd className="mt-1 text-[#17120D] tracking-[0.12em]">Squat · Pushup · Plank</dd>
                </div>
                <div>
                  <dt>Not in beta</dt>
                  <dd className="mt-1 text-[#17120D] tracking-[0.12em]">Plans · Nutrition · Health</dd>
                </div>
                <div>
                  <dt>Cost</dt>
                  <dd className="mt-1 text-[#17120D] tracking-[0.12em]">Free, while in beta</dd>
                </div>
                <div>
                  <dt>Account</dt>
                  <dd className="mt-1 text-[#17120D] tracking-[0.12em]">Optional · for history</dd>
                </div>
              </dl>
            </aside>
          </div>
        </Container>
      </section>

      {/* ─── Three system cards ───────────────────────────────────────── */}
      <Section className="bg-[#F4EFE6] border-t border-[#E5DDCD]">
        <Container>
          <div className="mb-12 max-w-3xl">
            <div className="eyebrow !text-[#0E6F5C]">Beta scope</div>
            <h2
              className="mt-4 font-display italic text-[#17120D]"
              style={{
                fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.022em",
                fontWeight: 500,
              }}
            >
              Three movements. One promise.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#4B423A]">
              Carriage is motion coaching, not a wellness bundle. Everything below is what we ship today. Everything we do not ship is named on the right.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-[#C7B796] bg-[#C7B796] lg:grid-cols-3">
            {systemCards.map((card) => (
              <article key={card.title} className="bg-[#FAF6EF] p-8 lg:p-10">
                <div className="eyebrow !text-[#0E6F5C]">{card.eyebrow}</div>
                <h3
                  className="mt-4 font-display italic text-[#17120D]"
                  style={{
                    fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1',
                    fontSize: "1.5rem",
                    lineHeight: 1.15,
                    letterSpacing: "-0.012em",
                    fontWeight: 500,
                  }}
                >
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#4B423A]">{card.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* ─── In beta / Not in beta ────────────────────────────────────── */}
      <Section className="bg-[#FAF6EF] border-t border-[#E5DDCD]">
        <Container>
          <div className="grid gap-px overflow-hidden border border-[#C7B796] bg-[#C7B796] lg:grid-cols-2">
            <article className="bg-[#FAF6EF] p-8 lg:p-12">
              <div className="eyebrow !text-[#0E6F5C]">In the public beta</div>
              <h2
                className="mt-4 font-display italic text-[#17120D]"
                style={{
                  fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                  fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.018em",
                  fontWeight: 500,
                }}
              >
                What you can use today.
              </h2>
              <ul className="mt-6 space-y-3 text-base leading-7 text-[#17120D]">
                {betaIncludes.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-[#E5DDCD] pb-3 last:border-b-0">
                    <span className="mt-3 h-[5px] w-[5px] flex-shrink-0 rounded-full bg-[#0E6F5C]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="bg-[#F4EFE6] p-8 lg:p-12">
              <div className="eyebrow !text-[#8A6F4A]">Not in the public beta</div>
              <h2
                className="mt-4 font-display italic text-[#17120D]"
                style={{
                  fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                  fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.018em",
                  fontWeight: 500,
                }}
              >
                What we deliberately held back.
              </h2>
              <ul className="mt-6 space-y-3 text-base leading-7 text-[#4B423A]">
                {betaExcludes.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-[#E5DDCD] pb-3 last:border-b-0">
                    <span className="mt-3 h-[5px] w-[5px] flex-shrink-0 rounded-full bg-[#B99A7A]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </Container>
      </Section>

      {/* ─── Voice cue pack + tutorial samples ────────────────────────── */}
      <Section className="bg-[#F4EFE6] border-t border-[#E5DDCD]">
        <Container>
          <div className="mb-12 max-w-3xl">
            <div className="eyebrow !text-[#0E6F5C]">Today&apos;s cues</div>
            <h2
              className="mt-4 font-display italic text-[#17120D]"
              style={{
                fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.022em",
                fontWeight: 500,
              }}
            >
              A teacher&apos;s voice. Written by hand.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#4B423A]">
              The cues you hear in the live loop are scripted and reviewed by a human coach. We do not generate them at runtime. A sample from the beta cue pack —
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Cue pack */}
            <div className="border border-[#C7B796] bg-[#FAF6EF] p-8">
              <div className="eyebrow !text-[#0E6F5C]">Cue pack · sample</div>
              <ul className="mt-6 space-y-3">
                {launchBetaVoiceCuePack.cues.map((cue) => (
                  <li
                    key={cue.id}
                    className="border-l-2 border-[#0E6F5C] bg-[#F4EFE6] px-4 py-3"
                  >
                    <p
                      className="font-display italic text-[#17120D]"
                      style={{
                        fontVariationSettings: '"opsz" 144, "SOFT" 80, "WONK" 1',
                        fontSize: "1.0625rem",
                        lineHeight: 1.45,
                        letterSpacing: "-0.005em",
                        fontWeight: 500,
                      }}
                    >
                      {cue.message}
                    </p>
                    <span className="mt-1 inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A6F4A]">
                      {cue.category}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tutorial samples */}
            <div className="border border-[#C7B796] bg-[#FAF6EF] p-8">
              <div className="eyebrow !text-[#0E6F5C]">Tutorial samples</div>
              <p className="mt-4 text-sm leading-7 text-[#4B423A]">
                Real human sessions remain the source of truth. Movement-by-movement notes from the launch sample set —
              </p>
              <ul className="mt-6 space-y-4">
                {launchBetaTutorialSamples.map((sample) => (
                  <li
                    key={sample.id}
                    className="border-t border-[#E5DDCD] pt-4 first:border-t-0 first:pt-0"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A6F4A]">
                      {sample.exercise}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#17120D]">{sample.notes}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-[#E5DDCD] pt-6">
                <Link
                  href="/coach"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-[#F4EFE6] shadow-md transition hover:-translate-y-px"
                  style={{ background: "linear-gradient(135deg, #149A80 0%, #094B3F 100%)" }}
                >
                  Open coach
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ─── Closing line ─────────────────────────────────────────────── */}
      <Section className="bg-[#FAF6EF] border-t border-[#E5DDCD]">
        <Container>
          <div className="mx-auto max-w-3xl py-6 text-center">
            <p
              className="font-display italic text-[#17120D]"
              style={{
                fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1',
                fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
                lineHeight: 1.2,
                letterSpacing: "-0.022em",
                fontWeight: 500,
              }}
            >
              Form, carried.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#8A6F4A]">
              Carriage — AI Form Coach · Public beta
            </p>
          </div>
        </Container>
      </Section>
    </div>
  );
}

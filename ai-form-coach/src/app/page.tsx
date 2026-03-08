import Link from "next/link";
import {
  HeroGradientBackground,
  NutritionGradientBackground,
  PlansGradientBackground,
} from "@/components/AnimatedGradientBackground";
import { launchBetaTutorialSamples, launchBetaVoiceCuePack } from "@/lib/mvp/content";
import { MVP_EXERCISES } from "@/lib/mvp/featureRegistry";
import { Badge, Button, Card, Container, Icon, Section } from "@/ui/DS";

const betaIncludes = [
  "Live pose feedback in the browser",
  "Rep counting and session summaries",
  "Human-authored cue pack for common corrections",
  "History for signed-in beta users",
];

const betaExcludes = [
  "Nutrition tracking and food scan",
  "AI workout plan generation",
  "Health integrations and readiness scoring",
  "Community, challenges, and packs",
];

const systemCards = [
  {
    title: "On-device motion loop",
    body: "MediaPipe runs in the browser so live camera frames do not need to be uploaded for coaching.",
    icon: "cpu" as const,
  },
  {
    title: "Human cue pack",
    body: "Launch voice cues are scripted and reviewed by humans instead of generated live by an LLM.",
    icon: "volume" as const,
  },
  {
    title: "Coach-first history",
    body: "Signed-in beta users get saved session summaries and real history instead of demo data.",
    icon: "bar-chart-2" as const,
  },
];

export default function Home() {
  return (
    <div className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <HeroGradientBackground className="relative overflow-hidden">
        <Container className="py-20 sm:py-24 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <Badge tone="info" size="lg" className="border-white/20 bg-white/10 text-white backdrop-blur">
                Public beta: motion coaching only
              </Badge>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Private form coaching in your browser.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-200">
                  AI Form Coach is now centered on one honest promise: stable live feedback for squat, pushup, and plank with a clean motion overlay, low-latency cues, and real saved sessions.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/coach">
                  <Button variant="primary" size="xl" className="w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto">
                    Start beta session
                    <Icon name="arrow-right" className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="secondary" size="xl" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15 sm:w-auto">
                    See beta scope
                  </Button>
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {MVP_EXERCISES.map((exercise) => (
                  <div key={exercise} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Launch exercise</div>
                    <div className="mt-2 text-xl font-semibold capitalize text-white">{exercise}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <Card className="border-white/10 bg-slate-950/55 text-white backdrop-blur-xl">
                <div className="space-y-3">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Release truth</div>
                  <p className="text-lg leading-8 text-slate-100">
                    No fake user counts. No fake ratings. No hidden nutrition or planning claims. The public beta is focused on motion quality.
                  </p>
                </div>
              </Card>
              <Card className="border-white/10 bg-white/10 text-white backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Icon name="lock" className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Private live loop</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-200">
                      Live coaching stays in the browser. Session summaries save when you sign in. Voice cues and tutorial content are human-reviewed.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="border-white/10 bg-white/10 text-white backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-rose-500/20 p-3">
                    <Icon name="check-circle" className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Performance first</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-200">
                      The core release bar is stable pose streaming, low-latency coaching cues, and a cleaner fitness skeleton with derived neck and pelvis points.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </HeroGradientBackground>

      <Section className="bg-white dark:bg-slate-950">
        <Container>
          <div className="mb-10 text-center">
            <Badge tone="neutral" className="mb-4 uppercase tracking-[0.2em]">
              System focus
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">The MVP is a motion product, not a broad wellness bundle.</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {systemCards.map((card) => (
              <Card key={card.title} className="h-full border-slate-200 bg-slate-50/80 shadow-xl dark:border-slate-800 dark:bg-slate-900/80" hover>
                <div className="space-y-4">
                  <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-white dark:bg-white dark:text-slate-950">
                    <Icon name={card.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold">{card.title}</h3>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{card.body}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <NutritionGradientBackground className="relative overflow-hidden">
        <Section>
          <Container>
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="border-white/15 bg-white/10 text-white backdrop-blur-xl">
                <div className="space-y-5">
                  <Badge tone="success" className="border-white/10 bg-white/10 text-white">
                    Included in beta
                  </Badge>
                  <h2 className="text-3xl font-bold">What you can use right now</h2>
                  <ul className="space-y-4 text-sm leading-7 text-slate-100">
                    {betaIncludes.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-emerald-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card className="border-white/15 bg-slate-950/45 text-white backdrop-blur-xl">
                <div className="space-y-5">
                  <Badge tone="warning" className="border-white/10 bg-white/10 text-white">
                    Not in beta
                  </Badge>
                  <h2 className="text-3xl font-bold">What we are deliberately holding back</h2>
                  <ul className="space-y-4 text-sm leading-7 text-slate-100">
                    {betaExcludes.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-rose-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>
          </Container>
        </Section>
      </NutritionGradientBackground>

      <PlansGradientBackground className="relative overflow-hidden">
        <Section>
          <Container>
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <Card className="border-white/15 bg-white/10 text-white backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Voice coach pack</div>
                  <h2 className="text-3xl font-bold">Human-authored coaching, not LLMs in the live loop.</h2>
                  <ul className="space-y-3 text-sm leading-7 text-slate-100">
                    {launchBetaVoiceCuePack.cues.map((cue) => (
                      <li key={cue.id} className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
                        <span className="font-medium">{cue.message}</span>
                        <span className="ml-2 text-slate-300">{cue.category}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card className="border-white/15 bg-slate-950/45 text-white backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Tutorial pipeline</div>
                  <h2 className="text-3xl font-bold">Real human sample sessions remain the source of truth.</h2>
                  <ul className="space-y-3 text-sm leading-7 text-slate-100">
                    {launchBetaTutorialSamples.map((sample) => (
                      <li key={sample.id} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <div className="font-semibold capitalize">{sample.exercise}</div>
                        <div className="text-slate-200">{sample.notes}</div>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-3">
                    <Link href="/coach">
                      <Button variant="primary" size="lg" className="bg-white text-slate-950 hover:bg-slate-100">
                        Open coach
                        <Icon name="play" className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </Container>
        </Section>
      </PlansGradientBackground>
    </div>
  );
}

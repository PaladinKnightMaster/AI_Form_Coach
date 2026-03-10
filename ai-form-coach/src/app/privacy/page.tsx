import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Container } from "@/ui/DS";

const UPDATED_AT = "March 10, 2026";

const principles = [
  {
    label: "Camera frames",
    value: "Stay on your device",
    detail: "The beta coach processes pose locally in the browser and does not upload workout video for live feedback.",
  },
  {
    label: "Saved data",
    value: "Session summaries only",
    detail: "If you sign in, we save exercise, rep count, duration, and quality summaries so history can reflect real sessions.",
  },
  {
    label: "Beta scope",
    value: "Motion coaching only",
    detail: "Nutrition, food scan, workout plans, and health integrations are outside the current public release surface.",
  },
] as const;

const sections = [
  {
    id: "on-device",
    title: "1. Camera processing stays local",
    paragraphs: [
      "AI Form Coach uses in-browser pose detection for the live coaching loop. The camera stream is analyzed on your device so the motion overlay and live cues can react quickly.",
      "We do not need to upload workout video to provide the current beta coaching experience. If camera permission is denied, the coach simply cannot start until you allow access.",
    ],
  },
  {
    id: "saved-data",
    title: "2. What we save if you sign in",
    paragraphs: [
      "The public beta can save session summaries such as exercise type, rep count or hold count, total duration, and pose-quality metrics. This is the data used to populate history.",
      "We do not seed fake demo sessions into the public history page. If you have not completed a saved session, history should stay empty.",
    ],
  },
  {
    id: "offline",
    title: "3. Offline buffering and sync retry",
    paragraphs: [
      "If your network drops during a session, the app may keep pending writes in local browser storage and retry sync later. This helps preserve real coaching sessions instead of discarding them immediately.",
      "Until a retry succeeds, your session may show as pending sync rather than fully saved. The camera feed itself is not stored as part of that retry path.",
    ],
  },
  {
    id: "analytics",
    title: "4. Product telemetry in the beta",
    paragraphs: [
      "We may record product events such as coach page visits, stage readiness, retries, session start and completion, and cue feedback. These events help tune the beta experience.",
      "This telemetry is about product behavior, not raw video capture. We use it to improve session completion, cue clarity, and recovery flows.",
    ],
  },
  {
    id: "choices",
    title: "5. Your choices and controls",
    paragraphs: [
      "You can stop using the coach at any time, revoke camera permission in your browser, and choose whether to sign in for history. Without sign-in, the app cannot attach saved sessions to your account.",
      "You can request account and stored-session deletion through support. During the beta, support channels are the practical path for deletion and export requests.",
    ],
  },
  {
    id: "safety",
    title: "6. Safety and limits",
    paragraphs: [
      "AI Form Coach is fitness software, not medical care. The live cues are intended to support general exercise form awareness for squat, pushup, and plank in this beta.",
      "Stop immediately if you feel pain, dizziness, or discomfort. If you have health concerns or injury history, consult a qualified professional before exercising.",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How the AI Form Coach motion beta handles camera access, saved sessions, and product telemetry.",
  openGraph: {
    title: "Privacy Policy - AI Form Coach",
    description: "How the motion coaching beta handles camera access, saved sessions, and product telemetry.",
    images: ["/og-image?title=Privacy Policy&subtitle=Camera frames stay on your device"],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="space-y-4 text-center">
            <Badge tone="info" className="mx-auto uppercase tracking-[0.2em]">
              Private motion coaching beta
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Privacy policy
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: {UPDATED_AT}</p>
            <p className="mx-auto max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
              The current MVP is intentionally narrow: live pose coaching for squat, pushup, and plank. This page explains what stays on your device, what can be saved if you sign in, and what is deliberately outside the beta scope.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {principles.map((item) => (
              <Card key={item.label} className="h-full rounded-[1.8rem] border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/70" padding="lg">
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{item.label}</div>
                  <div className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{item.value}</div>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{item.detail}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4">
            {sections.map((section) => (
              <Card key={section.id} className="rounded-[1.9rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70" padding="lg">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{section.title}</h2>
                  <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="rounded-[1.9rem] border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/70" padding="lg">
            <div className="space-y-3 text-center sm:text-left">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Questions or deletion requests</div>
              <div className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Contact the beta team</div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                For privacy questions, data export requests, or account deletion, contact <a className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 dark:text-white dark:decoration-slate-700" href="mailto:privacy@aiformcoach.com">privacy@aiformcoach.com</a>.
              </p>
              <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row sm:justify-start">
                <Link href="/coach" className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                  Open coach
                </Link>
                <Link href="/terms" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
                  Read terms
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}

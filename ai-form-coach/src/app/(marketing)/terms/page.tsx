import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Container } from "@/ui/DS";
import { termsSafety, termsLiability, termsEligibility } from "@/lib/legal/legalContent";

const UPDATED_AT = "March 10, 2026";

const summaryCards = [
  {
    label: "Service",
    value: "Motion coaching beta",
    detail: "The public release is limited to browser-based coaching for squat, pushup, and plank.",
  },
  {
    label: "Payments",
    value: "No paid plan at launch",
    detail: "The current beta does not require a subscription or payment method to use the core coach.",
  },
  {
    label: "Safety",
    value: "Fitness guidance only",
    detail: "The product is not medical advice or supervised care, and it cannot replace a qualified professional.",
  },
] as const;

const sections = [
  {
    id: "service",
    title: "1. What this beta is",
    paragraphs: [
      "AI Form Coach currently provides browser-based motion coaching for squat, pushup, and plank. The service is intentionally narrow while the beta is being tuned for real session quality.",
      "Features outside that launch surface, including nutrition, food scan, workout plans, and health integrations, are not part of the current public beta promise.",
    ],
  },
  {
    id: "accounts",
    title: "2. Accounts and saved history",
    paragraphs: [
      "You can browse the public product without an account, but sign-in is required to attach saved sessions to your history. If you do not sign in, your completed coaching sessions cannot be stored as account history.",
      "You are responsible for keeping your login credentials secure and for the activity that occurs under your account.",
    ],
  },
  {
    id: "acceptable-use",
    title: "3. Acceptable use",
    paragraphs: [
      "Use the service for lawful personal fitness purposes. Do not attempt to abuse, disrupt, reverse engineer, resell, or scrape the product, and do not interfere with other users or the beta infrastructure.",
      "If we believe an account or client is harming the service, we may suspend or limit access while we investigate.",
    ],
  },
  {
    id: "privacy",
    title: "4. Privacy and data",
    paragraphs: [
      "The live coaching loop processes pose locally in the browser. Session summaries and product telemetry may be stored as described in the privacy policy.",
      "By using the beta, you agree to the data practices described in the Privacy Policy. If you do not agree, do not use the service.",
    ],
  },
  { ...termsSafety, title: "5. " + termsSafety.title },
  {
    id: "payments",
    title: "6. Beta access and pricing",
    paragraphs: [
      "No paid subscription is required for the current beta. We are not promising paid tiers, Stripe-backed plans, or premium feature bundles as part of this release.",
      "If pricing changes after the beta, those terms will be presented separately before any purchase is required.",
    ],
  },
  {
    id: "availability",
    title: "7. Availability and product changes",
    paragraphs: [
      "Because this is a beta, features may change, be interrupted, or be removed. We may also update the product to improve motion quality, session reliability, and safety messaging.",
      "We do not guarantee uninterrupted availability, and we may perform maintenance or issue fixes without prior notice.",
    ],
  },
  {
    id: "ip",
    title: "8. Intellectual property",
    paragraphs: [
      "The product, software, brand, design system, and related content remain the property of AI Form Coach or its licensors. Your use of the beta does not transfer ownership of the product to you.",
      "Your saved session summaries remain associated with your account, subject to the product's storage and deletion processes.",
    ],
  },
  { ...termsLiability, title: "9. " + termsLiability.title },
  { ...termsEligibility, title: "10. " + termsEligibility.title },
];

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for the AI Form Coach motion beta, including safety, privacy, and beta access conditions.",
  openGraph: {
    title: "Terms of Service - AI Form Coach",
    description: "Terms for the motion coaching beta, including safety, privacy, and beta access conditions.",
    images: ["/og-image?title=Terms of Service&subtitle=Motion coaching beta terms"],
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="space-y-4 text-center">
            <Badge tone="neutral" className="mx-auto uppercase tracking-[0.2em]">
              Motion coaching beta terms
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Terms of service
            </h1>
            <p className="text-sm text-slate-500">Last updated: {UPDATED_AT}</p>
            <p className="mx-auto max-w-3xl text-base leading-8 text-slate-600">
              These terms are written for the current beta release, not a broader platform that has not shipped. They describe the coach as it exists today: a browser-based motion beta with optional sign-in for saved history.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {summaryCards.map((item) => (
              <Card key={item.label} className="h-full rounded-[1.8rem] border border-slate-200 bg-slate-50/80 shadow-sm" padding="lg">
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
                  <div className="text-2xl font-black tracking-tight text-slate-950">{item.value}</div>
                  <p className="text-sm leading-7 text-slate-600">{item.detail}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4">
            {sections.map((section) => (
              <Card key={section.id} className="rounded-[1.9rem] border border-slate-200 bg-white shadow-sm" padding="lg">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">{section.title}</h2>
                  <div className="space-y-3 text-sm leading-7 text-slate-600">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="rounded-[1.9rem] border border-slate-200 bg-slate-50/80 shadow-sm" padding="lg">
            <div className="space-y-3 text-center sm:text-left">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Need help?</div>
              <div className="text-2xl font-black tracking-tight text-slate-950">Contact support or review privacy details</div>
              <p className="text-sm leading-7 text-slate-600">
                Terms questions can be sent to <a className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4" href="mailto:legal@aiformcoach.com">legal@aiformcoach.com</a>. For privacy details, review the privacy policy or contact the beta team directly.
              </p>
              <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row sm:justify-start">
                <Link href="/privacy" className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Read privacy policy
                </Link>
                <Link href="/coach" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950">
                  Open coach
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}

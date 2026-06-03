import type { Metadata } from "next";
import Link from "next/link";
import { Card, Container } from "@/ui/DS";
import {
  DISCLAIMER_VERSION,
  medicalDisclaimer,
  assumptionOfRisk,
  type LegalSection,
} from "@/lib/legal/legalContent";

export const metadata: Metadata = {
  title: "Medical Disclaimer & Assumption of Risk",
  description: "Medical disclaimer, assumption of risk, and release for the AI Form Coach motion beta.",
};

const SECTIONS: LegalSection[] = [medicalDisclaimer, assumptionOfRisk];

export default function MedicalDisclaimerPage() {
  return (
    <div className="min-h-screen bg-white">
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Medical Disclaimer &amp; Assumption of Risk
            </h1>
            <p className="text-sm text-slate-500">Version: {DISCLAIMER_VERSION}</p>
          </div>
          <div className="grid gap-4">
            {SECTIONS.map((section) => (
              <Card key={section.id} className="rounded-[1.9rem] border border-slate-200 bg-white shadow-sm" padding="lg">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">{section.title}</h2>
                  <div className="space-y-3 text-sm leading-7 text-slate-600">
                    {section.paragraphs.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500">
            See also the <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </Container>
    </div>
  );
}

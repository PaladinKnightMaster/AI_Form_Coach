# Medical Disclaimer & Liability Waiver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the war-room #2 medical-disclaimer + liability-waiver surface — a single versioned legal-content module, a `/medical-disclaimer` page, strengthened `/terms` + `/privacy`, a signup clickwrap + 18+ gate, a one-time first-session safety self-attestation, a persistent in-session micro-disclaimer, and a `{version, timestamp, context}` consent record — all copy placeholder pending real legal review.

**Architecture:** All legal strings live in one versioned module (`src/lib/legal/legalContent.ts`, exporting `DISCLAIMER_VERSION`). Pages and UI render from it (no hardcoded legal prose). Consent is recorded in a new `user_consents` Supabase table (no health data). The first-session gate re-prompts whenever `DISCLAIMER_VERSION` changes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (client SDK + RLS), Vitest. npm (not pnpm).

**Branch:** `feat/medical-disclaimer-waiver` (cut from `dev`; spec `774d1dc`).

> ⚠️ **NOT LEGAL ADVICE.** Every user-facing legal string created here MUST carry a
> `[LAWYER REVIEW REQUIRED]` marker until a qualified attorney reviews/replaces it.
> This plan produces a *reviewable draft + consent UX*, not legal sign-off. War-room
> #2 stays 🔴 until the lawyer signs off; this work moves it to 🟡 at most.

**Commit trailer:** every commit message ends with a blank line then
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## Phases & the two HARD STOPS

- **Phase A (Tasks 1–4):** content module + the three legal pages. → **HARD STOP: content review** (user + lawyer read the copy).
- **Phase B (Task 5):** UI design doc/mockups for the three interactive surfaces. → **HARD STOP: UI-design review**.
- **Phase C (Tasks 6–11):** consent data model + service, signup checkbox/18+, first-session gate, micro-disclaimer, tracker + verify. Build ONLY after both stops are approved.

---

## File Structure

**Create:**
- `src/lib/legal/legalContent.ts` — single source of truth for all legal copy + `DISCLAIMER_VERSION`.
- `src/__tests__/mvp/legalContent.test.ts` — guards version format + presence of required sections/markers.
- `src/app/(marketing)/medical-disclaimer/page.tsx` — renders the disclaimer from the module.
- `docs/design/2026-05-30-disclaimer-ui-design.md` — Phase B design doc (mockups).
- `supabase/migrations/09_user_consents.sql` — consent table + RLS.
- `src/lib/legal/consent.ts` — record/check consent helpers.
- `src/__tests__/mvp/consent.test.ts` — consent helper logic tests.
- `src/components/coach/FirstSessionSafetyGate.tsx` — one-time pre-session self-attestation gate.

**Modify:**
- `src/app/(marketing)/terms/page.tsx` — add Assumption-of-Risk/Release + 18+ + governing-law (from module).
- `src/app/(marketing)/privacy/page.tsx` — add camera/on-device + no-health-data + GDPR + 18+ (from module).
- `src/app/(marketing)/signin/page.tsx` — signup clickwrap checkbox + 18+; block submit; record consent.
- `src/components/coach/CoachExperienceView.tsx` — mount `FirstSessionSafetyGate` + persistent micro-disclaimer.
- `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md` — #2 → 🟡.

---

## Task 1: Versioned legal-content module (TDD)

**Files:**
- Create: `src/lib/legal/legalContent.ts`
- Test: `src/__tests__/mvp/legalContent.test.ts`

- [ ] **Step 1: Write the failing test**

`src/__tests__/mvp/legalContent.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  DISCLAIMER_VERSION,
  medicalDisclaimer,
  assumptionOfRisk,
  safetyScreening,
  inSessionMicroDisclaimer,
  signupConsentLabel,
} from "@/lib/legal/legalContent";

describe("legalContent module", () => {
  it("exposes a date-stamped DISCLAIMER_VERSION", () => {
    expect(DISCLAIMER_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("every long-form legal section carries a [LAWYER REVIEW REQUIRED] marker", () => {
    for (const section of [medicalDisclaimer, assumptionOfRisk]) {
      expect(section.reviewPending).toBe(true);
      expect(section.paragraphs.join(" ")).toContain("[LAWYER REVIEW REQUIRED]");
    }
  });

  it("safety screening is show-don't-store: criteria list + a single attestation label", () => {
    expect(safetyScreening.criteria.length).toBeGreaterThanOrEqual(5);
    expect(safetyScreening.attestationLabel).toContain("healthy enough");
  });

  it("provides the signup consent label and the in-session micro-disclaimer", () => {
    expect(signupConsentLabel).toContain("18");
    expect(inSessionMicroDisclaimer.toLowerCase()).toContain("not medical advice");
  });
});
```

- [ ] **Step 2: Run it, confirm FAIL** — `npx vitest run src/__tests__/mvp/legalContent.test.ts` → module not found.

- [ ] **Step 3: Implement** `src/lib/legal/legalContent.ts`:
```ts
/**
 * SINGLE SOURCE OF TRUTH for all user-facing legal / disclaimer copy.
 *
 * ⚠️ [LAWYER REVIEW REQUIRED] — every string here is PLACEHOLDER copy authored by
 * a non-lawyer (war-room #2). A qualified attorney must review and replace this
 * before relying on it. Do not delete the [LAWYER REVIEW REQUIRED] markers until
 * that review is done.
 *
 * Editing later: change strings here; bump DISCLAIMER_VERSION to re-prompt the
 * one-time first-session safety gate for everyone.
 */

// Bump on any material change to disclaimer/waiver/screening copy.
export const DISCLAIMER_VERSION = "2026-05-30";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  reviewPending: boolean;
}

export const medicalDisclaimer: LegalSection = {
  id: "medical-disclaimer",
  title: "Medical Disclaimer",
  reviewPending: true,
  paragraphs: [
    "[LAWYER REVIEW REQUIRED] Carriage (AI Form Coach) provides general fitness information and movement feedback only. It is not medical advice, diagnosis, treatment, physical therapy, or a substitute for professional medical care. Using the app does not create a doctor-patient, therapist-patient, or trainer-client relationship.",
    "[LAWYER REVIEW REQUIRED] The app's real-time form feedback is generated by an automated, camera-based motion model that has technical limits and may be inaccurate, incomplete, or wrong for your body, environment, or movement. Do not rely on it as a substitute for a qualified trainer or licensed physical therapist, and do not use it to diagnose or treat any condition.",
    "[LAWYER REVIEW REQUIRED] Consult a physician before starting any exercise program, especially if you have a heart condition, high blood pressure, are pregnant, are recovering from injury or surgery, or have any condition that could be affected by exercise. Stop immediately and seek medical attention if you feel pain, dizziness, shortness of breath, chest pain, or any concerning symptom.",
  ],
};

export const assumptionOfRisk: LegalSection = {
  id: "assumption-of-risk",
  title: "Assumption of Risk & Release",
  reviewPending: true,
  paragraphs: [
    "[LAWYER REVIEW REQUIRED] Exercise carries inherent risks, including muscle strain, joint injury, falls, cardiac events, and in rare cases serious or life-threatening injury. By using the app you acknowledge these risks and voluntarily assume full responsibility for them.",
    "[LAWYER REVIEW REQUIRED] You are responsible for exercising within your ability, warming up, using appropriate space and equipment, and choosing movements suited to your condition. To the fullest extent permitted by law, you release and agree not to hold Carriage (AI Form Coach), its creator, and its affiliates liable for any injury, loss, or damage arising from your use of the app.",
    "[LAWYER REVIEW REQUIRED] You confirm you are at least 18 years old and legally able to accept this release. If any part of this release is unenforceable in your jurisdiction, the remainder continues to apply to the maximum extent permitted by law.",
  ],
};

export interface SafetyScreening {
  intro: string;
  criteria: string[];
  attestationLabel: string;
  reviewPending: boolean;
}

// Show-don't-store: criteria are DISPLAYED for self-evaluation; the user's
// answers are NEVER collected or stored — only the single attestation below.
export const safetyScreening: SafetyScreening = {
  reviewPending: true,
  intro:
    "[LAWYER REVIEW REQUIRED] Before you start, please check yourself against the list below. If any apply, talk to a doctor before using the coach.",
  criteria: [
    "A heart condition, or chest pain during physical activity",
    "Dizziness, fainting, or loss of balance",
    "Pregnancy, or recent childbirth",
    "Recent surgery, injury, or a joint/bone problem made worse by exercise",
    "A condition a doctor has told you limits your physical activity",
  ],
  attestationLabel:
    "I am 18 or older, I am healthy enough to exercise, none of the above prevents me from exercising safely, and I will consult a physician if I am unsure.",
};

export const inSessionMicroDisclaimer =
  "Not medical advice · stop if you feel pain or dizziness";

export const signupConsentLabel =
  "I am 18 or older and I have read and agree to the Terms, Privacy Policy, and Medical Disclaimer & Assumption of Risk.";

// Sections added to /terms (strengthened safety + liability), rendered from here.
export const termsSafety: LegalSection = {
  id: "safety",
  title: "Safety and health disclaimer",
  reviewPending: true,
  paragraphs: [
    "[LAWYER REVIEW REQUIRED] The app provides general fitness guidance only and is not medical advice, physical therapy, diagnosis, treatment, or emergency support. Its automated form feedback may be inaccurate; it is not a substitute for a qualified trainer or licensed physical therapist.",
    "[LAWYER REVIEW REQUIRED] Stop exercising if you feel pain, dizziness, or discomfort. You are responsible for exercising safely, warming up, and choosing movements that fit your condition. See the full Medical Disclaimer & Assumption of Risk.",
  ],
};

export const termsLiability: LegalSection = {
  id: "liability",
  title: "Warranty and liability limits",
  reviewPending: true,
  paragraphs: [
    "[LAWYER REVIEW REQUIRED] The app is provided on an as-is and as-available basis. To the maximum extent permitted by law, we disclaim all warranties and are not liable for any injury or for indirect, incidental, or consequential damages arising from use of the service.",
    "[LAWYER REVIEW REQUIRED] You use the app voluntarily and assume the risks of exercise. Where law does not allow some of these limitations, they apply to the maximum extent permitted. Governing law: [LAWYER REVIEW REQUIRED — insert governing state/jurisdiction].",
  ],
};

export const termsEligibility: LegalSection = {
  id: "eligibility",
  title: "Eligibility (18+)",
  reviewPending: true,
  paragraphs: [
    "[LAWYER REVIEW REQUIRED] The beta is available only to adults 18 years or older. By creating an account you confirm you are at least 18.",
  ],
};

export const privacyHealthData: LegalSection = {
  id: "camera-and-health",
  title: "Camera, motion, and health data",
  reviewPending: true,
  paragraphs: [
    "[LAWYER REVIEW REQUIRED] Live pose detection runs on your device in your browser. Your camera video is processed locally and is not transmitted to or stored on our servers.",
    "[LAWYER REVIEW REQUIRED] The pre-exercise safety check is a self-attestation only: we do not collect or store your answers to the health screening questions. We record only that you accepted the current disclaimer version and when.",
    "[LAWYER REVIEW REQUIRED] For users in the EU/UK and similar regions, you have data-subject rights (access, deletion, etc.). The service is for adults 18+. Contact us to exercise your rights.",
  ],
};
```

- [ ] **Step 4: Run it, confirm PASS** (4 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/legal/legalContent.ts src/__tests__/mvp/legalContent.test.ts
git commit -m "feat(legal): versioned legal-content module (placeholder copy)"
```

---

## Task 2: `/medical-disclaimer` page

**Files:**
- Create: `src/app/(marketing)/medical-disclaimer/page.tsx`

- [ ] **Step 1: Implement the page (renders from the module)**

`src/app/(marketing)/medical-disclaimer/page.tsx`:
```tsx
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
```

- [ ] **Step 2: Verify build** — `npm run build`; confirm `/medical-disclaimer` appears in the route manifest. Lint clean.

- [ ] **Step 3: Commit**
```bash
git add "src/app/(marketing)/medical-disclaimer/page.tsx"
git commit -m "feat(legal): /medical-disclaimer page rendered from content module"
```

---

## Task 3: Strengthen `/terms` from the module

**Files:**
- Modify: `src/app/(marketing)/terms/page.tsx`

- [ ] **Step 1: Replace the inline safety + liability section objects and add eligibility**

In `src/app/(marketing)/terms/page.tsx`, add to the imports:
```ts
import { termsSafety, termsLiability, termsEligibility } from "@/lib/legal/legalContent";
```
Then in the `sections` array: (a) replace the inline `{ id: "safety", ... }` object with `termsSafety`; (b) replace the inline `{ id: "liability", ... }` object with `termsLiability` and renumber its title to keep ordinal "9."; (c) insert `termsEligibility` (titled "10. Eligibility (18+)") as a new entry after liability. Keep the other sections (service, accounts, acceptable-use, privacy, payments, availability, ip) as-is. The section objects from the module already match the `{ id, title, paragraphs }` shape the page maps over (the extra `reviewPending` field is ignored by the renderer).

Note: the module titles omit the leading ordinal ("Safety and health disclaimer"). Keep the page's existing numbered style by mapping module sections with a numbered title, e.g. spread `{ ...termsSafety, title: "5. " + termsSafety.title }`.

- [ ] **Step 2: Verify** — `npm run build` + lint clean; visit `/terms` shows the strengthened safety/liability + new eligibility section, all carrying the `[LAWYER REVIEW REQUIRED]` text.

- [ ] **Step 3: Commit**
```bash
git add "src/app/(marketing)/terms/page.tsx"
git commit -m "feat(legal): strengthen /terms safety, liability, 18+ from content module"
```

---

## Task 4: Strengthen `/privacy` from the module

**Files:**
- Modify: `src/app/(marketing)/privacy/page.tsx`

- [ ] **Step 1: Add the health/camera section sourced from the module**

Read `src/app/(marketing)/privacy/page.tsx` first to match its section data shape (it mirrors `/terms`). Import `privacyHealthData` from `@/lib/legal/legalContent` and insert it into the page's sections array (camera on-device, no health data stored, GDPR rights, 18+). Match the page's existing numbered-title convention.

- [ ] **Step 2: Verify** — `npm run build` + lint clean; `/privacy` shows the new section.

- [ ] **Step 3: Commit**
```bash
git add "src/app/(marketing)/privacy/page.tsx"
git commit -m "feat(legal): add camera/on-device + no-health-data + GDPR section to /privacy"
```

---

## ⛔ HARD STOP 1 — CONTENT REVIEW

Do NOT proceed to Phase B. Report to the user:
- The four pages now render placeholder copy from `legalContent.ts`.
- Provide the file path and ask them to review the wording and route it to their lawyer.
- Await explicit approval (and any copy edits) before starting Task 5.

---

## Task 5: UI design doc for the three interactive surfaces (Phase B)

**Files:**
- Create: `docs/design/2026-05-30-disclaimer-ui-design.md`

- [ ] **Step 1: Write the design doc** describing, with simple wireframe sketches (ASCII or prose), all three surfaces:
  1. **Signup clickwrap** — an unchecked checkbox + `signupConsentLabel` (with inline links to /terms, /privacy, /medical-disclaimer) placed inside the signup form, above the submit button; submit disabled until checked. On the bone AuthCard surface.
  2. **First-session safety gate** — a one-time full-screen overlay before the first coach session: heading "Before you start", `safetyScreening.intro`, the criteria list, the single attestation checkbox, and a "Begin" button (disabled until checked). Dark coach surface.
  3. **In-session micro-disclaimer** — a small persistent line in the coach chrome showing `inSessionMicroDisclaimer`.
  Include the acceptance/record behavior and the version-bump re-prompt rule.

- [ ] **Step 2: Commit**
```bash
git add docs/design/2026-05-30-disclaimer-ui-design.md
git commit -m "docs(design): disclaimer consent UI design (signup, first-session, in-session)"
```

---

## ⛔ HARD STOP 2 — UI-DESIGN REVIEW

Do NOT proceed to Phase C. Present the design doc to the user, get approval (or revisions) on placement/UX for all three surfaces before implementing any UI.

---

## Task 6: Consent table migration + types (Phase C)

**Files:**
- Create: `supabase/migrations/09_user_consents.sql`

- [ ] **Step 1: Write the migration**

`supabase/migrations/09_user_consents.sql`:
```sql
-- =====================================================
-- MIGRATION 09: USER CONSENTS (war-room #2)
-- Proof-of-consent record. NO health data is stored.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    disclaimer_version TEXT NOT NULL,
    context TEXT NOT NULL CHECK (context IN ('signup', 'first_session')),
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_consents_user_idx
    ON public.user_consents (user_id, context, disclaimer_version);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Users can read their own consent rows.
CREATE POLICY "user_consents_select_own" ON public.user_consents
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own consent rows.
CREATE POLICY "user_consents_insert_own" ON public.user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Apply locally / note for deploy.** If the local Supabase CLI is available, run the project's migration apply command; otherwise document that this migration must be applied to the Supabase project before the consent writes will succeed. Regenerate types if the project tracks them (`npx supabase gen types ...` per CLAUDE.md) — otherwise the helper in Task 7 uses untyped `.from("user_consents")`.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/09_user_consents.sql
git commit -m "feat(legal): user_consents table + RLS (no health data)"
```

---

## Task 7: Consent helper module (TDD)

**Files:**
- Create: `src/lib/legal/consent.ts`
- Test: `src/__tests__/mvp/consent.test.ts`

- [ ] **Step 1: Write the failing test** (`src/__tests__/mvp/consent.test.ts`) — inject a fake Supabase-like client so no network is needed:
```ts
import { describe, it, expect, vi } from "vitest";
import { recordConsent, hasAcceptedCurrentVersion } from "@/lib/legal/consent";
import { DISCLAIMER_VERSION } from "@/lib/legal/legalContent";

function fakeClient(existingRows: Array<{ disclaimer_version: string }>) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return {
    insert,
    from: () => ({
      insert,
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({ data: existingRows, error: null }),
          }),
        }),
      }),
    }),
  };
}

describe("consent helpers", () => {
  it("records a consent row with the current version and given context", async () => {
    const client = fakeClient([]);
    await recordConsent(client as never, "user-1", "signup");
    expect(client.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      disclaimer_version: DISCLAIMER_VERSION,
      context: "signup",
    });
  });

  it("hasAcceptedCurrentVersion is false when no matching row exists", async () => {
    const client = fakeClient([]);
    expect(await hasAcceptedCurrentVersion(client as never, "user-1", "first_session")).toBe(false);
  });

  it("hasAcceptedCurrentVersion is true when a row for the current version exists", async () => {
    const client = fakeClient([{ disclaimer_version: DISCLAIMER_VERSION }]);
    expect(await hasAcceptedCurrentVersion(client as never, "user-1", "first_session")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, confirm FAIL.**

- [ ] **Step 3: Implement** `src/lib/legal/consent.ts`:
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { DISCLAIMER_VERSION } from "./legalContent";

export type ConsentContext = "signup" | "first_session";

/** Record that the user accepted the CURRENT disclaimer version. No health data. */
export async function recordConsent(
  client: SupabaseClient,
  userId: string,
  context: ConsentContext,
): Promise<void> {
  const { error } = await client.from("user_consents").insert({
    user_id: userId,
    disclaimer_version: DISCLAIMER_VERSION,
    context,
  });
  if (error) {
    console.error("recordConsent failed:", { message: error.message, context });
  }
}

/** True if the user already accepted the current DISCLAIMER_VERSION for this context. */
export async function hasAcceptedCurrentVersion(
  client: SupabaseClient,
  userId: string,
  context: ConsentContext,
): Promise<boolean> {
  const { data, error } = await client
    .from("user_consents")
    .select("disclaimer_version")
    .eq("user_id", userId)
    .eq("context", context)
    .eq("disclaimer_version", DISCLAIMER_VERSION);
  if (error) {
    console.error("hasAcceptedCurrentVersion failed:", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}
```

- [ ] **Step 4: Run it, confirm PASS** (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/legal/consent.ts src/__tests__/mvp/consent.test.ts
git commit -m "feat(legal): consent record/check helpers (TDD)"
```

---

## Task 8: Signup clickwrap checkbox + 18+ gate

**Files:**
- Modify: `src/app/(marketing)/signin/page.tsx`

- [ ] **Step 1: Add consent state + checkbox + submit guard + record** (styling per the approved Task 5 design):
  - Add `const [agreed, setAgreed] = useState(false);` near the other `useState`s.
  - In the `mode === 'signup'` branch of `onSubmit`, before calling `supabase.auth.signUp`, guard: `if (!agreed) { showError('Please agree', 'You must accept the Terms, Privacy Policy, and Medical Disclaimer to create an account.'); return; }`.
  - After a successful signup where a profile is ensured (the `data.session || hasImmediateSessionAccess` branch, right after `await ensureProfile(data.user.id);`), call `await recordConsent(supabase, data.user.id, 'signup');`.
  - Render, inside the form and only when `mode === 'signup'`, above `LoadingButton`, an unchecked checkbox bound to `agreed`/`setAgreed` with `signupConsentLabel` and inline links to `/terms`, `/privacy`, `/medical-disclaimer`. Reset `agreed` to false when `mode` changes (extend the existing mode `useEffect`).
  - Import `recordConsent` from `@/lib/legal/consent` and `signupConsentLabel` from `@/lib/legal/legalContent`.
  - Optional but recommended: pass `agreed` into the submit disabled state for signup, or keep the in-`onSubmit` guard as the gate (either satisfies "blocks signup until ticked"). Match the approved design.

- [ ] **Step 2: Verify** — `npm run build`, lint, `npm run test` all green. Manually reason: signup submit without the box ticked shows the error and does not call signUp.

- [ ] **Step 3: Commit**
```bash
git add "src/app/(marketing)/signin/page.tsx"
git commit -m "feat(legal): signup clickwrap + 18+ consent checkbox; record consent"
```

---

## Task 9: First-session safety gate component

**Files:**
- Create: `src/components/coach/FirstSessionSafetyGate.tsx`

- [ ] **Step 1: Implement the gate** (show-don't-store; styling per approved design):
```tsx
"use client";

import { useState } from "react";
import { safetyScreening } from "@/lib/legal/legalContent";

/**
 * One-time pre-session safety self-attestation. Show-don't-store: the criteria
 * are displayed for self-evaluation; only the single attestation is required.
 * No health answers are collected. `onAccept` records consent + dismisses.
 */
export default function FirstSessionSafetyGate({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100">
        <h2 className="text-xl font-bold">Before you start</h2>
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
            className="mt-1"
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
```

- [ ] **Step 2: Verify** — `npm run build` + lint clean.

- [ ] **Step 3: Commit**
```bash
git add src/components/coach/FirstSessionSafetyGate.tsx
git commit -m "feat(legal): first-session safety self-attestation gate (show-don't-store)"
```

---

## Task 10: Mount the gate + persistent micro-disclaimer in the coach

**Files:**
- Modify: `src/components/coach/CoachExperienceView.tsx`

- [ ] **Step 1: Read `CoachExperienceView.tsx`** to find the authenticated user id source and a stable place to render an overlay + a chrome line.

- [ ] **Step 2: Wire the gate** — on mount, if a user is present, call `hasAcceptedCurrentVersion(supabase, userId, 'first_session')`; if false, render `<FirstSessionSafetyGate onAccept={...} />` where `onAccept` calls `recordConsent(supabase, userId, 'first_session')` then hides the gate. Because the check keys on `DISCLAIMER_VERSION`, bumping the version re-prompts automatically. Use the existing Supabase client accessor used elsewhere in the coach tree (`getSupabaseClient` from `@/lib/supabase/client`). Gate state via `useState<'loading'|'needed'|'ok'>`.

- [ ] **Step 3: Add the micro-disclaimer** — render `inSessionMicroDisclaimer` (import from `@/lib/legal/legalContent`) as a small persistent line in the coach chrome (a low-emphasis caption that stays visible during sessions). Placement per the approved design.

- [ ] **Step 4: Verify** — `npm run build`, lint, `npm run test` green.

- [ ] **Step 5: Commit**
```bash
git add src/components/coach/CoachExperienceView.tsx
git commit -m "feat(legal): mount first-session safety gate + in-session micro-disclaimer"
```

---

## Task 11: Tracker → 🟡, full verify, push

**Files:**
- Modify: `docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md`

- [ ] **Step 1: Update concern #2** status `🔴 open` → `🟡 in progress — disclaimer/waiver draft + consent UX shipped for legal review (NOT lawyer-approved)`, and append a Resolution Log row:
```
| 2026-05-30 | #2 Liability waiver | 🔴 → 🟡 | Draft medical disclaimer + assumption-of-risk, /medical-disclaimer page, strengthened terms/privacy, signup clickwrap + 18%2B, first-session self-attestation gate, consent record. PLACEHOLDER copy pending lawyer review. |
```
(Write `18+` literally in the file; the `%2B` above is only to avoid a table-parsing edge case in this plan doc.)

- [ ] **Step 2: Full gate** — `npm run lint`, `npm run test`, `npm run build` all green.

- [ ] **Step 3: Commit + push**
```bash
git add docs/war-room-v2/11_BETA1_CONCERNS_TRACKER.md
git commit -m "docs(war-room): #2 -> in-progress (disclaimer draft + consent UX for legal review)"
git push -u origin feat/medical-disclaimer-waiver
```

- [ ] **Step 4: STOP — invoke finishing-a-development-branch** and present completion options. Remind the user the branch ships PLACEHOLDER legal copy that must go to a lawyer before #2 → 🟢.

---

## Self-Review

**Spec coverage:** versioned content module + `DISCLAIMER_VERSION` (T1) ✓; `/medical-disclaimer` (T2) ✓; strengthened `/terms` incl. assumption-of-risk + 18+ + governing-law placeholder (T3) ✓; `/privacy` camera/no-health-data/GDPR/18+ (T4) ✓; content-review STOP (after T4) ✓; UI design doc + UI-review STOP (T5) ✓; consent data model no-health-data (T6) ✓; consent helpers + version-bump check (T7) ✓; signup clickwrap + 18+ (T8) ✓; first-session show-don't-store self-attestation (T9) ✓; mount + persistent micro-disclaimer (T10) ✓; tracker → 🟡 with "stays 🔴 until lawyer" framing (T11) ✓. Layered acceptance (signup + first-session + in-session) ✓. Rejected items (stored PAR-Q, passive-only, every-session gate, under-18) honored ✓.

**Placeholder scan:** the `[LAWYER REVIEW REQUIRED]` markers are intentional content, not plan gaps. No "TBD/implement later" steps. Each code step shows code. (Tasks 3, 4, 8, 10 reference reading the target file first because the edit weaves into existing per-page section arrays / a large coach component — the exact insertion is specified, and the surrounding code was confirmed during planning.)

**Type consistency:** `DISCLAIMER_VERSION`, `LegalSection`, `safetyScreening`, `signupConsentLabel`, `inSessionMicroDisclaimer` (T1) are used with identical names in T2/T3/T4/T8/T9/T10. `recordConsent` / `hasAcceptedCurrentVersion` / `ConsentContext` signatures (T7) match their call sites (T8, T10). Table/columns in the migration (T6) match the helper's insert/select fields (T7).

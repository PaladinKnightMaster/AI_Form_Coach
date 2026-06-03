# Medical Disclaimer & Liability Waiver Strategy (war-room #2)

**Date:** 2026-05-30
**Branch:** `feat/medical-disclaimer-waiver`
**War-room concern:** #2 — Liability waiver and medical disclaimer (catastrophic risk: an injured beta tester with no waiver).
**Status:** strategy approved (council brainstorm); awaiting spec review.

> ⚠️ **NOT LEGAL ADVICE.** This document and everything it produces is *placeholder
> strategy and draft copy* authored by a non-lawyer to make a real attorney review
> faster and cheaper. Every user-facing legal string shipped under this plan MUST
> carry a `[LAWYER REVIEW REQUIRED]` marker until a qualified attorney has reviewed
> and replaced it. The lawyer finalizes; we do not.

## Problem

AI Form Coach gives **affirmative, real-time corrective cues** during exercise
(squat/pushup/plank) from an on-device pose model with known accuracy limits
(single camera; the Savitzky-Golay smoothing bug, war-room #1; imperfect pushup
rep counting). That is higher risk than passively hosting fitness content. Today:

- Acceptance is **passive**: `AuthCard` shows "By continuing, you agree to our
  Terms/Privacy" — no checkbox (sign-in-wrap, weak for an injury waiver).
- `/terms` §5 is a **soft** "fitness guidance only" note; §9 is a generic
  liability limit. There is no explicit assumption-of-risk/release, no medical
  disclaimer page, no health screening, no age gate, and no in-session safety
  reminder.

War room: do not recruit a single tester (even friends) without this.

## Decisions captured (council brainstorm, 2026-05-30)

- **Audience:** design for **US + International** (broadest: injury waiver +
  GDPR/UK-GDPR). Recruitment may start with friends; design for the broad case.
- **Acceptance:** layered (signup clickwrap + one-time first-session gate +
  persistent in-session micro-disclaimer).
- **Screening:** "show, don't store" — display PAR-Q-derived criteria, collect a
  single self-attestation checkbox, **store no health data**.
- **Age:** **18+** for Beta 1 (waivers are generally unenforceable against minors;
  also sidesteps GDPR/COPPA child-consent).
- **Founder refinements:** (1) **content + UI must be reviewed before the UI is
  implemented** — two explicit review gates; (2) **all legal copy lives in one
  easily-editable, versioned content module** so lawyer revisions are a one-file
  edit and a version bump drives re-consent.

## Strategy

### Acceptance (layered)

| Layer | Where | Mechanism |
|------|-------|-----------|
| 1. Account creation | Signup (`AuthCard`) | **Unchecked clickwrap checkbox**, required to submit: "I am 18 or older, and I have read and agree to the Terms, Privacy Policy, and Medical Disclaimer & Assumption of Risk." |
| 2. First exercise | One-time gate before the first `/coach` session | **"Before you start" safety screen**: PAR-Q-derived self-screen list + single attestation checkbox + "Begin". Shown once; re-shown only when `DISCLAIMER_VERSION` changes. |
| 3. Every session | Coach UI chrome | **Persistent micro-disclaimer**: "Not medical advice · stop if you feel pain or dizziness." |

**Consent record:** persist `{ disclaimer_version, accepted_at, context }` per
acceptance — **no health data**. Drives re-prompt on version bump and is the
proof-of-consent record.

### Content (where the language lives)

| Document | Change |
|----------|--------|
| **New `/medical-disclaimer`** | Dedicated, linkable page: not medical advice · no practitioner relationship · **AI feedback may be inaccurate; do not rely on it as a substitute for a qualified trainer/physical therapist** · assumption of risk & release · stop-if-symptoms · consult a physician · pregnancy/condition warnings. |
| **`/terms`** | Add explicit **Assumption of Risk & Release** section; strengthen §5 (health) and §9 (limitation of liability, with health carve-out); add **18+** requirement and a **governing-law placeholder**. |
| **`/privacy`** | Clarify camera/pose is processed **on-device, not transmitted or stored**; state the safety attestation collects **no health data**; GDPR/UK-GDPR lawful basis + data-subject rights; 18+/age note. |

### Screening

Self-attestation only. Show PAR-Q-derived criteria ("If any of these apply, talk
to a doctor before using the coach: heart condition, chest pain, dizziness,
pregnancy, recent surgery/injury, joint problems, or any reason you've been told
not to exercise") followed by one checkbox: "I am healthy enough to exercise,
none of the above prevents me from exercising safely, and I will consult a
physician if unsure." **No answers are collected or stored.**

## Content architecture (editability requirement)

All user-facing legal/disclaimer strings live in **one versioned module**:

- `src/lib/legal/legalContent.ts` — exports structured content objects (sections,
  paragraphs, the screening list, the checkbox labels, the in-session micro-copy)
  and a `DISCLAIMER_VERSION` constant (e.g. `"2026-06-01"` or a semver).
- `/terms`, `/privacy`, `/medical-disclaimer`, `AuthCard`, the first-session gate,
  and the coach micro-disclaimer all **render from this module** — no hardcoded
  legal prose in components.
- Rationale: lawyer revisions = a single-file edit; bumping `DISCLAIMER_VERSION`
  automatically re-prompts the first-session gate. Matches the existing
  data-array pattern already used by `/terms` (`sections`).
- **Rejected for Beta:** MDX/Markdown content files (adds tooling) and CMS/DB
  (overkill). Noted as a possible future upgrade if non-developer prose editing
  becomes a need.

## Consent data model

Store the minimum proof-of-consent. Proposed: a `user_consents` table (or columns
on the user profile) holding `{ user_id, disclaimer_version, accepted_at,
context }` where `context ∈ {'signup', 'first_session'}`. **No health data, no
PAR-Q answers.** Exact shape (table vs. profile columns, Supabase migration) is a
plan-level detail.

## Review gates (per founder refinement)

The implementation plan MUST sequence these as hard checkpoints:

1. **Content review gate** — draft all placeholder copy in `legalContent.ts`
   (every string marked `[LAWYER REVIEW REQUIRED]`). **STOP**: user reviews the
   wording (and routes it to their lawyer) before any UI is built.
2. **UI design review gate** — present the UI design/mockups for the signup
   checkbox, the first-session "Before you start" gate, and the in-session
   micro-disclaimer. **STOP**: user reviews placement/UX before implementation.
3. Only after both approvals: implement the UI + consent record + wiring.

## Non-goals / explicitly rejected

- Stored PAR-Q questionnaire (creates GDPR Art. 9 special-category health-data
  liability) — replaced by show-don't-store self-attestation.
- Passive-only acceptance (too weak for an injury waiver).
- Gating every session (trains blind-clicking; only gate once + on version bump).
- Under-18 users in Beta 1.
- Real legal sign-off (out of scope — this produces the reviewable draft).

## Open items for the lawyer (flag in the draft)

- Governing-law / venue clause (depends on your entity's home jurisdiction).
- Enforceability of the assumption-of-risk/release in target states.
- Whether international recruitment needs jurisdiction-specific consent language.
- Final medical-disclaimer and limitation-of-liability wording.

## Rollout

Branch `feat/medical-disclaimer-waiver` from `dev`, one purpose. User opens PRs
manually. War-room tracker #2 stays 🔴 until the lawyer signs off; this work moves
it to 🟡 ("draft + consent UX shipped for legal review") at most — it does NOT go
🟢 on our say-so.

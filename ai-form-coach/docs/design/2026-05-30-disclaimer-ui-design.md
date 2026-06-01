# Disclaimer Consent UI Design (war-room #2, Phase B)

**Date:** 2026-05-30
**Purpose:** Design the three interactive consent surfaces before implementation
(Phase C). This is the **UI-design review gate** — no UI is built until this is
approved.

All copy is pulled from `src/lib/legal/legalContent.ts` (placeholder, `[LAWYER
REVIEW REQUIRED]`). Nothing here collects or stores health data; only a
`{version, timestamp, context}` consent record is written.

---

## Surface 1 — Signup clickwrap checkbox + 18+

**Where:** the signup form inside `AuthCard` (bone surface: card `#FAF6EF`, ink
`#17120D`, hairlines `#C7B796`). Rendered **only in `mode === 'signup'`**, placed
between the "Confirm password" field and the submit button.

**Behavior:**
- Unchecked by default. Bound to `agreed` state.
- Submit button is **disabled until checked** (primary gate) *and* `onSubmit`
  re-guards as a backstop. Resets to unchecked when the user switches auth mode.
- On successful signup, write `recordConsent(client, userId, 'signup')`.
- Label = `signupConsentLabel`, with inline links to `/terms`, `/privacy`,
  `/medical-disclaimer` (bone underline style: `decoration-[#C7B796]`).

**Wireframe:**
```
┌──────────────── AuthCard (bone) ─────────────────┐
│  [ Sign in | Sign up | Reset ]                    │
│                                                   │
│  email      [ you@example.com               ]     │
│  password   [ ••••••••                       ]     │
│  confirm    [ ••••••••                       ]     │
│                                                   │
│  ☐  I am 18 or older and I have read and agree    │
│     to the Terms, Privacy Policy, and Medical     │
│     Disclaimer & Assumption of Risk.              │
│        └ links: Terms · Privacy · Medical Discl.  │
│                                                   │
│  [        Create account  (disabled ▢)       ]    │  ← enabled once ☐ ticked
└───────────────────────────────────────────────────┘
```
*(The existing footer "By continuing, you agree…" line stays for the other modes;
the checkbox is the binding acceptance for account creation.)*

---

## Surface 2 — First-session "Before you start" safety gate

**Where:** a modal overlay over the coach (dark surface: panel `#0f172a`/slate-900,
border slate-700), mounted by `CoachExperienceView`. Blocks interaction until
accepted.

**When:** on coach mount, if a user is signed in and
`hasAcceptedCurrentVersion(client, userId, 'first_session')` is `false`. Because
the check keys on `DISCLAIMER_VERSION`, **bumping the version re-prompts everyone**.
Shown **once** per version otherwise.

**Behavior:** "Begin" disabled until the single attestation checkbox is ticked.
On Begin → `recordConsent(client, userId, 'first_session')` then dismiss. The
criteria are **displayed for self-evaluation only — no answers collected**.

**Wireframe:**
```
╔════════════ dark scrim (fixed inset-0, black/80) ════════════╗
║      ┌──────────────── slate-900 card ────────────────┐      ║
║      │  Before you start                               │      ║
║      │                                                 │      ║
║      │  Before you start, please check yourself        │      ║
║      │  against the list below. If any apply, talk     │      ║
║      │  to a doctor before using the coach.            │      ║
║      │   • A heart condition, or chest pain …          │      ║
║      │   • Dizziness, fainting, or loss of balance     │      ║
║      │   • Pregnancy, or recent childbirth             │      ║
║      │   • Recent surgery, injury, or joint problem …  │      ║
║      │   • A condition a doctor said limits activity   │      ║
║      │                                                 │      ║
║      │  ☐  I am 18 or older, I am healthy enough to    │      ║
║      │     exercise, none of the above prevents me …   │      ║
║      │                                                 │      ║
║      │  [           Begin  (disabled ▢)           ]    │      ║
║      └─────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Surface 3 — Persistent in-session micro-disclaimer

**Where:** coach chrome. A small, low-emphasis caption showing
`inSessionMicroDisclaimer` → "Not medical advice · stop if you feel pain or
dizziness".

**Behavior:** **persistent** — unlike the auto-hiding overlays
(`useOverlayAutoHide`), this safety line stays visible throughout a session. Low
contrast so it doesn't fight the camera stage, but always legible.

**Recommended placement:** pinned to the **bottom-center of the camera stage**
(or the top of the metrics sidebar on wide layouts), e.g. a `text-xs`,
`text-white/60` caption with a subtle dark backing for legibility.

```
┌──────────── camera stage ─────────────┐
│                                        │
│             (live video)               │
│                                        │
│   Not medical advice · stop if you     │ ← persistent, bottom-center
│   feel pain or dizziness               │
└────────────────────────────────────────┘
```

---

## Open UI decisions for your review

1. **Micro-disclaimer placement** — bottom-center of the camera stage (default
   above), or top of the metrics sidebar? Either works; pick on aesthetics.
2. **Signup gate style** — disabled-until-checked button (recommended; clearest)
   vs. always-enabled with an inline error on submit. Default: disabled.
3. **First-session gate dismissal** — modal blocks the coach until accepted
   (recommended) vs. a non-blocking banner. Default: blocking modal (it's the
   assumption-of-risk moment, so blocking is the stronger posture).

Approve as-is, or tell me which of the three open decisions to change, and I'll
proceed to Phase C implementation.

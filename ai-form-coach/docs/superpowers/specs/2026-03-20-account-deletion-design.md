# Account Deletion Flow — Design Spec

**Date:** 2026-03-20
**Status:** Implemented (Beta 1)
**Priority:** P1 — GDPR requirement for launch

## Overview

GDPR and platform policies require users to be able to delete their accounts and all associated data. This feature adds a settings page with account deletion capability.

## Architecture

### Files

| File | Purpose |
|------|---------|
| `src/app/api/auth/delete-account/route.ts` | API route — verifies session, deletes user via service role |
| `src/components/DeleteAccountModal.tsx` | Confirmation modal requiring typed "DELETE" |
| `src/app/settings/page.tsx` | Settings page with account info and danger zone |
| `src/components/AuthStatus.tsx` | Modified — added Settings link to dropdown |

### Data Flow

```
User → Settings page → "Delete account" → Modal (type "DELETE") → POST /api/auth/delete-account
→ Server verifies session via getSupabaseServerClient()
→ admin.deleteUser(uid) via getSupabaseServiceClient()
→ ON DELETE CASCADE removes all user data from all tables
→ 200 OK → Client signs out → Redirect to /
```

### Security

- **Server-side only** — deletion uses service role client, never exposed to browser
- **Session verification** — API route checks auth before proceeding
- **Typed confirmation** — user must type "DELETE" to enable the button
- **Cascade deletion** — all tables (profiles, sessions, reps, health_data, etc.) have `ON DELETE CASCADE` on the `auth.users` foreign key

### What Gets Deleted

All data associated with the user is permanently removed:
- Profile (username, avatar, plan info)
- Coaching sessions and rep data
- Pose quality metrics, coaching hints, skeleton events
- Health data and progression tracking
- User goals and workout plans
- Organization memberships
- Subscription records

## Phase 2: Data Export

**Not included in Beta 1.** In Phase 2, we will add a "Download my data" feature before the deletion flow, allowing users to export their data as JSON/CSV before account deletion. This satisfies the GDPR "right to data portability" (Article 20) and is a best practice for user trust.

Planned scope:
- Export sessions, reps, and form scores as CSV
- Export profile and settings as JSON
- Download link available on the settings page
- Optional: email delivery of export archive

## UI

### Settings Page (`/settings`)
- Account info section (email, member since)
- Danger zone section with red border accent
- "Delete account" button triggers modal

### Delete Account Modal
- Warning icon and "Delete your account?" heading
- Lists what will be deleted
- Text input requiring exact string "DELETE"
- Cancel and Confirm buttons with loading state
- Error display for failed attempts

### AuthStatus Dropdown
- Added "Settings" link between "History" and "Sign out"

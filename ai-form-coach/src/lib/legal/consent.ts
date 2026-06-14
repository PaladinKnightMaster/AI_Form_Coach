import type { SupabaseClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { DISCLAIMER_VERSION } from "./legalContent";

export type ConsentContext = "signup" | "first_session";

// Set at signup time so the signup-context consent can still be recorded after
// an email-confirmation round-trip (when no session exists yet to insert the
// row). PKCE already requires the confirmation to open in the same browser
// (the code_verifier lives in localStorage), so this flag is reliably present
// when /auth/callback completes. See flushPendingSignupConsent.
const PENDING_SIGNUP_CONSENT_KEY = "carriage.pendingSignupConsentV1";

/**
 * Record that the user accepted the CURRENT disclaimer version. No health data.
 * Idempotent: relies on the (user_id, context, disclaimer_version) unique index
 * (migration 11) + ignoreDuplicates, so re-entry/multi-tab can't create dupes.
 * Returns true on success (including a benign duplicate); false on real failure
 * — callers use this to decide whether a pending-consent marker may be cleared.
 */
export async function recordConsent(
  client: SupabaseClient,
  userId: string,
  context: ConsentContext,
): Promise<boolean> {
  const { error } = await client.from("user_consents").upsert(
    {
      user_id: userId,
      disclaimer_version: DISCLAIMER_VERSION,
      context,
    },
    { onConflict: "user_id,context,disclaimer_version", ignoreDuplicates: true },
  );
  if (error) {
    // Proof-of-consent is legally meaningful, so a silent loss is worth an alert.
    console.error("recordConsent failed:", { message: error.message, context });
    Sentry.captureException(new Error(`recordConsent failed: ${error.message}`), {
      tags: { feature: "consent", consent_context: context },
    });
    return false;
  }
  return true;
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
    .eq("disclaimer_version", DISCLAIMER_VERSION)
    .limit(1);
  if (error) {
    console.error("hasAcceptedCurrentVersion failed:", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

/**
 * Remember (client-side) that the user accepted the disclaimer at signup, so the
 * signup consent can be recorded once a session exists — whether that's the
 * immediate-session path or after an email-confirmation round-trip.
 */
export function markPendingSignupConsent(): void {
  try {
    localStorage.setItem(PENDING_SIGNUP_CONSENT_KEY, DISCLAIMER_VERSION);
  } catch {
    /* private mode / storage unavailable — best effort */
  }
}

/**
 * If a pending signup consent was marked on this browser, record it now that the
 * user is authenticated, then clear the marker. Only clears on a confirmed write
 * so a transient failure is retried on the next authenticated load. No-op when
 * nothing is pending (e.g. an existing user signing in via magic link).
 */
export async function flushPendingSignupConsent(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  let pending: string | null = null;
  try {
    pending = localStorage.getItem(PENDING_SIGNUP_CONSENT_KEY);
  } catch {
    /* private mode / storage unavailable */
  }
  if (!pending) return;

  const ok = await recordConsent(client, userId, "signup");
  if (!ok) return; // leave the marker so we retry next time

  try {
    localStorage.removeItem(PENDING_SIGNUP_CONSENT_KEY);
  } catch {
    /* ignore */
  }
}

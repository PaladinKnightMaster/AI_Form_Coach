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

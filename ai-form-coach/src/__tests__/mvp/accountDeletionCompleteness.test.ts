import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Runs only with REAL service creds. CI uses placeholders, so it auto-skips.
const canRun =
  !!url && !!key &&
  url.startsWith("https://") && !url.includes("placeholder") &&
  !key.includes("placeholder");

describe.skipIf(!canRun)("account deletion completeness (DB schema)", () => {
  it("every user_id table cascade-deletes (no orphans)", async () => {
    const supabase = createClient(url!, key!, { auth: { persistSession: false } });
    const { data, error } = await supabase.rpc("account_deletion_completeness");
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]); // any row = a table that won't be deleted
  });
});

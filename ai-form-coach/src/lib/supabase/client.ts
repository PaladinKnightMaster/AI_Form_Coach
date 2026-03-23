import { createBrowserClient } from "@supabase/ssr";

let hasWarnedMissingSupabaseEnv = false;

export const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!url || !anon) {
    const shouldWarn = process.env.NODE_ENV !== "test" && process.env.VITEST !== "true";
    if (shouldWarn && !hasWarnedMissingSupabaseEnv) {
      console.warn("Supabase env not set; running in offline mode.");
      hasWarnedMissingSupabaseEnv = true;
    }
  }

  return createBrowserClient(url ?? "http://localhost", anon ?? "anon");
};

export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
};
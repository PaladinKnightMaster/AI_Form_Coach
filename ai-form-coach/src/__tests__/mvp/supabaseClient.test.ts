import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createBrowserClientMock = vi.fn(() => ({
  auth: {
    getUser: vi.fn(async () => ({ data: { user: null } })),
  },
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
}));

describe("supabase client MVP behavior", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    vi.resetModules();
    createBrowserClientMock.mockClear();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }

    if (originalAnon === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon;
    }

    vi.restoreAllMocks();
  });

  it("does not spam missing-env warnings in tests", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getSupabaseClient } = await import("@/lib/supabase/client");

    getSupabaseClient();
    getSupabaseClient();

    expect(createBrowserClientMock).toHaveBeenCalledTimes(2);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("passes configured env vars through to the browser client", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    const { getSupabaseClient } = await import("@/lib/supabase/client");

    getSupabaseClient();

    expect(createBrowserClientMock).toHaveBeenCalledWith("https://example.supabase.co", "test-anon-key");
  });
});
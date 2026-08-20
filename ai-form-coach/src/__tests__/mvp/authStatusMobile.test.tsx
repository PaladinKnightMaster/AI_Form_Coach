/**
 * Regression guard for the mobile account block.
 *
 * The mobile drawer used to render no AuthStatus at all, so on a phone a signed-in
 * user had no way to sign out and no route to /settings — which is where account
 * deletion lives (war-room #14). Found during prod smoke QA.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import AuthStatus from "@/components/AuthStatus";

const signOut = vi.fn();
let mockUser: { email: string } | null = null;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, loading: false, signOut }),
}));

beforeEach(() => {
  mockUser = { email: "tester@example.com" };
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("AuthStatus mobile variant", () => {
  it("exposes Settings and Sign out for a signed-in user", () => {
    render(<AuthStatus variant="mobile" />);
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe("/settings");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(screen.getByText("tester@example.com")).toBeTruthy();
  });

  it("signs out and closes the drawer", async () => {
    const onNavigate = vi.fn();
    render(<AuthStatus variant="mobile" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await vi.waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(onNavigate).toHaveBeenCalledTimes(1));
  });

  it("renders nothing when signed out (the drawer shows its own Sign in CTA)", () => {
    mockUser = null;
    const { container } = render(<AuthStatus variant="mobile" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("AuthStatus desktop variant contrast tokens", () => {
  it("uses header-palette text instead of the light-theme slate that failed on the dark header", () => {
    mockUser = null;
    render(<AuthStatus />);
    const signIn = screen.getByRole("link", { name: "Sign in" });
    expect(signIn.className).toContain("text-[#C9C0B2]");
    expect(signIn.className).not.toContain("text-slate-700");
  });
});

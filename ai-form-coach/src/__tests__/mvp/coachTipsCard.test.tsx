import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CoachTipsCard from "@/components/coach/CoachTipsCard";

afterEach(cleanup);

describe("CoachTipsCard accessibility", () => {
  it("is a labelled modal dialog", () => {
    render(<CoachTipsCard onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("coach-tips-heading");
    expect(screen.getByRole("heading", { name: "Set the scene" })).toBeTruthy();
  });

  it("calls onClose from the button", () => {
    const onClose = vi.fn();
    render(<CoachTipsCard onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /i'm ready/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<CoachTipsCard onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

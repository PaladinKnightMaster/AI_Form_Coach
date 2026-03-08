import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CoachPage from "@/app/coach/page";

describe("coach MVP shell", () => {
  it("renders the cleaned beta coach surface without corrupted legacy copy", () => {
    const html = renderToStaticMarkup(<CoachPage />);

    expect(html).toContain("Private motion coaching beta");
    expect(html).toContain("Start session");
    expect(html).toContain("Live coach");
    expect(html).not.toContain("Ã");
  });
});
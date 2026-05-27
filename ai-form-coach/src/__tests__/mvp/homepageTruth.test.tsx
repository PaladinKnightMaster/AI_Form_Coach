import { beforeAll, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/(marketing)/page";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
  }
});

describe("homepage truth and visual content", () => {
  it("keeps the premium beta story while staying truthful", () => {
    const html = renderToStaticMarkup(<Home />);

    // Carriage editorial voice (Step 05). Substrings avoid apostrophes,
    // which renderToStaticMarkup escapes to &#x27;.
    expect(html).toContain("Return to your line.");
    expect(html).toContain("On-device");
    expect(html).toContain("Your video stays on your device.");
    expect(html).toContain("no LLM in the live loop");
    expect(html).toContain("Nutrition tracking and food scan");
    // Anti-hype guardrails — must never appear.
    expect(html).not.toContain("50K+");
    expect(html).not.toContain("Trusted Worldwide");
    expect(html).not.toContain("Real Results");
  });
});

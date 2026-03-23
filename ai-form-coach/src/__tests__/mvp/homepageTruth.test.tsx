import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";

describe("homepage truth and visual content", () => {
  it("keeps the premium beta story while staying truthful", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Private form coaching in your browser");
    expect(html).toContain("Public beta: motion coaching only");
    expect(html).toContain("Human-authored coaching, not LLMs in the live loop.");
    expect(html).toContain("Nutrition tracking and food scan");
    expect(html).not.toContain("50K+");
    expect(html).not.toContain("Trusted Worldwide");
    expect(html).not.toContain("Real Results");
  });
});

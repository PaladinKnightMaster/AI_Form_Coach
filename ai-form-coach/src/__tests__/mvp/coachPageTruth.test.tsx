import { beforeAll, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CoachPage from "@/app/coach/page";

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

describe("coach MVP shell", () => {
  it("renders the cleaned beta coach surface without corrupted legacy copy", () => {
    const html = renderToStaticMarkup(<CoachPage />);

    expect(html).toContain("Camera Access Needed");
    expect(html).toContain("Allow Camera Access");
    expect(html).toContain("on your device");
    expect(html).toContain("never uploaded or stored");
    expect(html).not.toContain("Ãƒ");
  });
});

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HistoryPage from "@/app/history/page";
import PricingPage from "@/app/pricing/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";

describe("public MVP page truth", () => {
  it("keeps pricing focused on a free motion beta", () => {
    const html = renderToStaticMarkup(<PricingPage />);

    expect(html).toContain("No paid plans at launch.");
    expect(html).toContain("We are not collecting payment details");
    expect(html).toContain("Paid subscriptions or checkout flow");
    expect(html).not.toContain("Stripe");
    expect(html).not.toContain("priority support");
  });

  it("keeps history limited to real coach sessions", () => {
    const html = renderToStaticMarkup(<HistoryPage />);

    expect(html).toContain("Saved coaching sessions");
    expect(html).toContain("Demo history and synthetic trends are intentionally excluded");
    expect(html).not.toContain("leaderboard");
  });

  it("keeps privacy aligned with the narrowed beta", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);

    expect(html).toContain("Camera frames");
    expect(html).toContain("Stay on your device");
    expect(html).toContain("Motion coaching only");
    expect(html).toContain("Offline buffering and sync retry");
    expect(html).not.toContain("Nutrition Data Privacy");
    expect(html).not.toContain("Leaderboard inclusion");
    expect(html).not.toContain("Pro accounts");
    expect(html).not.toContain("â");
  });

  it("keeps terms aligned with the free beta release", () => {
    const html = renderToStaticMarkup(<TermsPage />);

    expect(html).toContain("No paid subscription is required for the current beta.");
    expect(html).toContain("Motion coaching beta");
    expect(html).toContain("Features outside that launch surface");
    expect(html).not.toContain("Pro subscriptions");
    expect(html).not.toContain("monthly or yearly through Stripe");
  });
});


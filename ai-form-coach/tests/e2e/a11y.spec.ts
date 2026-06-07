import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Public launch routes + the coach (loopback bypass). /signup redirects to /signin.
// Auth-gated routes (history/settings/session) are deferred — CI has no signed-in user.
const ROUTES = [
  "/",
  "/pricing",
  "/signin",
  "/terms",
  "/privacy",
  "/medical-disclaimer",
  "/coach?e2e-access=1",
];

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type Violation = Awaited<
  ReturnType<InstanceType<typeof AxeBuilder>["analyze"]>
>["violations"][number];

function format(route: string, vs: Violation[]): string {
  if (vs.length === 0) return `${route}: clean`;
  return (
    `${route} — ${vs.length} a11y violation(s):\n` +
    vs
      .map(
        (v) =>
          `  • [${v.impact}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n` +
          `    nodes: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
      )
      .join("\n")
  );
}

for (const route of ROUTES) {
  test(`a11y: ${route} has no serious/critical WCAG violations`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "a11y audit runs on chromium only");

    await page.goto(route);
    await page.waitForLoadState("load");

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    const minor = results.violations.filter(
      (v) => v.impact === "moderate" || v.impact === "minor",
    );
    if (minor.length > 0) {
      console.log(`[a11y][moderate/minor] ${format(route, minor)}`);
    }

    expect(blocking, format(route, blocking)).toEqual([]);
  });
}

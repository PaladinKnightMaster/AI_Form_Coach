import { describe, expect, it } from "vitest";
import {
  MVP_FEATURE_FLAGS,
  getHeaderRoutes,
  getMvpDisabledRedirect,
  getRobotsDisallowPaths,
  getSitemapRoutes,
  isMvpAuthOnlyPath,
  isMvpDisabledPage,
} from "@/lib/mvp/featureRegistry";

describe("featureRegistry", () => {
  it("returns a reduced public header for signed-out users", () => {
    expect(getHeaderRoutes(false).map((route) => route.href)).toEqual(["/", "/pricing", "/signin"]);
  });

  it("returns coach-first header routes for authenticated users", () => {
    expect(getHeaderRoutes(true).map((route) => route.href)).toEqual(["/", "/coach", "/history", "/pricing"]);
  });

  it("marks auth-only paths", () => {
    expect(isMvpAuthOnlyPath("/coach")).toBe(true);
    expect(isMvpAuthOnlyPath("/history/stats")).toBe(true);
    expect(isMvpAuthOnlyPath("/session/123")).toBe(true);
    expect(isMvpAuthOnlyPath("/pricing")).toBe(false);
  });

  it("marks disabled routes", () => {
    expect(isMvpDisabledPage("/nutrition")).toBe(true);
    expect(isMvpDisabledPage("/coach-packs/custom")).toBe(true);
    expect(isMvpDisabledPage("/demo")).toBe(true);
    expect(isMvpDisabledPage("/pricing/success")).toBe(true);
    expect(isMvpDisabledPage("/privacy")).toBe(false);
  });

  it("keeps disabled-prefix coverage on legacy surfaces", () => {
    expect(isMvpDisabledPage("/plans/builder")).toBe(true);
    expect(isMvpDisabledPage("/creator-packs/upload")).toBe(true);
    expect(isMvpDisabledPage("/internal/analytics")).toBe(true);
    expect(isMvpDisabledPage("/faq")).toBe(true);
  });

  it("redirects disabled pricing subroutes to pricing", () => {
    expect(getMvpDisabledRedirect("/pricing/success", true)).toBe("/pricing");
    expect(getMvpDisabledRedirect("/plans", true)).toBe("/coach");
    expect(getMvpDisabledRedirect("/plans", false)).toBe("/");
  });

  it("exports disabled feature flags for non-mvp surfaces", () => {
    expect(MVP_FEATURE_FLAGS.nutritionAi).toBe(false);
    expect(MVP_FEATURE_FLAGS.planGeneration).toBe(false);
    expect(MVP_FEATURE_FLAGS.demoMode).toBe(false);
    expect(MVP_FEATURE_FLAGS.liveCoaching).toBe(true);
  });

  it("builds a limited sitemap and robots set", () => {
    expect(getSitemapRoutes().map((route) => route.url)).toEqual([
      "/",
      "/pricing",
      "/privacy",
      "/terms",
      "/signin",
      "/signup",
    ]);
    expect(getRobotsDisallowPaths()).toContain("/nutrition");
    expect(getRobotsDisallowPaths()).toContain("/coach");
  });
});

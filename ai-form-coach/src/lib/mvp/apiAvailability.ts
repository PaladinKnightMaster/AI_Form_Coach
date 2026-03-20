import { NextResponse } from "next/server";
import { isMvpFeatureEnabled, type MvpFeatureFlag } from "@/lib/mvp/featureRegistry";

const MVP_DISABLED_API_EXACT_PATHS = new Set([
  "/api/ai/analyze-food",
  "/api/ai/generate-food-image",
  "/api/ai/test-gemini",
  "/api/checkout",
  "/api/pose/metrics",
  "/api/pose/metrics/batch",
  "/api/programs",
  "/api/progression",
  "/api/readiness",
  "/api/stripe-webhook",
  "/api/subscription/status",
  "/api/test-image-apis",
  "/api/verification/check-session",
  "/api/verification/session-summary",
  "/api/verification/stats",
]);

const MVP_DISABLED_API_PREFIXES = [
  "/api/activity",
  "/api/analytics",
  "/api/challenges",
  "/api/coach-packs",
  "/api/competition",
  "/api/creator-packs",
  "/api/embeddings",
  "/api/health",
  "/api/leaderboards",
  "/api/monitoring",
  "/api/nutrition",
  "/api/organizations",
  "/api/plans",
];

export function createBetaUnavailableResponse(feature: MvpFeatureFlag) {
  return NextResponse.json(
    {
      error: "This feature is not available in the public beta.",
      feature,
      beta: true,
    },
    { status: 410 },
  );
}

export function createDisabledApiPathResponse(pathname: string) {
  return NextResponse.json(
    {
      error: "This API route is not available in the public beta.",
      path: pathname,
      beta: true,
    },
    { status: 410 },
  );
}

export function isMvpDisabledApiPath(pathname: string) {
  if (MVP_DISABLED_API_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return MVP_DISABLED_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function guardBetaFeature(feature: MvpFeatureFlag) {
  if (!isMvpFeatureEnabled(feature)) {
    return createBetaUnavailableResponse(feature);
  }
  return null;
}
import { NextResponse } from "next/server";
import { isMvpFeatureEnabled, type MvpFeatureFlag } from "@/lib/mvp/featureRegistry";

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

export function guardBetaFeature(feature: MvpFeatureFlag) {
  if (!isMvpFeatureEnabled(feature)) {
    return createBetaUnavailableResponse(feature);
  }
  return null;
}

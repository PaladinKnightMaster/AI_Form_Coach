import { guardBetaFeature } from "@/lib/mvp/apiAvailability";

export async function POST() {
  const blocked = guardBetaFeature("nutritionAi");
  if (blocked) {
    return blocked;
  }

  throw new Error("nutritionAi is expected to remain disabled in public beta.");
}

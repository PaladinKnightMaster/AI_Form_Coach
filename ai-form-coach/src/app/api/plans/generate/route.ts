import { guardBetaFeature } from "@/lib/mvp/apiAvailability";

export async function POST() {
  const blocked = guardBetaFeature("planGeneration");
  if (blocked) {
    return blocked;
  }

  throw new Error("planGeneration is expected to remain disabled in public beta.");
}

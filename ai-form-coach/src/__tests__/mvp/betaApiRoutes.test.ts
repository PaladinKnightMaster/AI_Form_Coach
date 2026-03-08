import { describe, expect, it } from "vitest";
import { POST as analyzeFood } from "@/app/api/ai/analyze-food/route";
import { POST as generateFoodImage } from "@/app/api/ai/generate-food-image/route";
import { GET as testGemini } from "@/app/api/ai/test-gemini/route";
import { POST as generatePlan } from "@/app/api/plans/generate/route";
import { POST as saveAiPlan } from "@/app/api/plans/save-ai-plan/route";

describe("beta-disabled API routes", () => {
  it("returns 410 for disabled nutrition endpoints", async () => {
    const responses = await Promise.all([generateFoodImage(), analyzeFood(), testGemini()]);

    for (const response of responses) {
      const body = await response.json();
      expect(response.status).toBe(410);
      expect(body.beta).toBe(true);
    }
  });

  it("returns 410 for disabled planning endpoints", async () => {
    const responses = await Promise.all([generatePlan(), saveAiPlan()]);

    for (const response of responses) {
      const body = await response.json();
      expect(response.status).toBe(410);
      expect(body.beta).toBe(true);
    }
  });
});

import { describe, expect, it } from "vitest";
import { GET as disabledApiGet, POST as disabledApiPost } from "@/app/api/[...slug]/route";

describe("beta-disabled API routes", () => {
  it("returns 410 for disabled nutrition endpoints", async () => {
    const responses = await Promise.all([
      disabledApiPost(new Request("http://localhost/api/ai/generate-food-image", { method: "POST" })),
      disabledApiPost(new Request("http://localhost/api/ai/analyze-food", { method: "POST" })),
      disabledApiGet(new Request("http://localhost/api/ai/test-gemini", { method: "GET" })),
    ]);

    for (const response of responses) {
      const body = await response.json();
      expect(response.status).toBe(410);
      expect(body.beta).toBe(true);
    }
  });

  it("returns 410 for disabled planning endpoints", async () => {
    const responses = await Promise.all([
      disabledApiPost(new Request("http://localhost/api/plans/generate", { method: "POST" })),
      disabledApiPost(new Request("http://localhost/api/plans/save-ai-plan", { method: "POST" })),
    ]);

    for (const response of responses) {
      const body = await response.json();
      expect(response.status).toBe(410);
      expect(body.beta).toBe(true);
    }
  });
});
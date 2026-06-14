import { describe, it, expect } from "vitest";
import {
  DISCLAIMER_VERSION,
  medicalDisclaimer,
  assumptionOfRisk,
  safetyScreening,
  inSessionMicroDisclaimer,
  signupConsentLabel,
} from "@/lib/legal/legalContent";

describe("legalContent module", () => {
  it("exposes a date-stamped DISCLAIMER_VERSION", () => {
    expect(DISCLAIMER_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("legal sections are counsel-reviewed: no pending flag and no [LAWYER REVIEW REQUIRED] markers", () => {
    for (const section of [medicalDisclaimer, assumptionOfRisk]) {
      expect(section.reviewPending).toBe(false);
      expect(section.paragraphs.join(" ")).not.toContain("[LAWYER REVIEW REQUIRED]");
    }
  });

  it("safety screening is show-don't-store: criteria list + a single attestation label", () => {
    expect(safetyScreening.criteria.length).toBeGreaterThanOrEqual(5);
    expect(safetyScreening.attestationLabel).toContain("healthy enough");
  });

  it("provides the signup consent label and the in-session micro-disclaimer", () => {
    expect(signupConsentLabel).toContain("18");
    expect(inSessionMicroDisclaimer.toLowerCase()).toContain("not medical advice");
  });
});

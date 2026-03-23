export interface VisionReasoningProvider {
  name: string;
  enabled: boolean;
  analyze(input: unknown): Promise<unknown>;
}

export interface TextPlanningProvider {
  name: string;
  enabled: boolean;
  generatePlan(input: unknown): Promise<unknown>;
}

export interface VoiceSynthesisProvider {
  name: string;
  enabled: boolean;
  synthesize(input: { text: string; voiceId?: string }): Promise<unknown>;
}

export const betaDisabledProviders = {
  visionReasoning: {
    name: "beta-disabled-vision",
    enabled: false,
    async analyze() {
      return { beta: true, available: false };
    },
  } satisfies VisionReasoningProvider,
  textPlanning: {
    name: "beta-disabled-text-planning",
    enabled: false,
    async generatePlan() {
      return { beta: true, available: false };
    },
  } satisfies TextPlanningProvider,
  voiceSynthesis: {
    name: "beta-disabled-voice",
    enabled: false,
    async synthesize() {
      return { beta: true, available: false };
    },
  } satisfies VoiceSynthesisProvider,
};

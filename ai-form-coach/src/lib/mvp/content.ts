import type { MvpExercise } from "@/lib/mvp/featureRegistry";

export interface VoiceCue {
  id: string;
  message: string;
  category: "framing" | "tempo" | "alignment" | "visibility" | "reinforcement";
}

export interface VoiceCuePack {
  version: string;
  source: "human_authored";
  exerciseScope: readonly MvpExercise[];
  cues: VoiceCue[];
}

export interface TutorialSampleSession {
  id: string;
  exercise: MvpExercise;
  source: "human_capture";
  status: "planned" | "recorded" | "reviewed";
  notes: string;
}

export const launchBetaVoiceCuePack: VoiceCuePack = {
  version: "2026.03-beta",
  source: "human_authored",
  exerciseScope: ["squat", "pushup", "plank"],
  cues: [
    { id: "frame-body", message: "Step back until your full body is visible.", category: "framing" },
    { id: "slow-down", message: "Slow the rep down and stay controlled.", category: "tempo" },
    { id: "hold-neutral", message: "Keep your torso neutral and steady.", category: "alignment" },
    { id: "reset-visibility", message: "Pause and re-center so I can see your full body.", category: "visibility" },
    { id: "good-rep", message: "Good rep. Keep that pace.", category: "reinforcement" },
  ],
};

export const launchBetaTutorialSamples: TutorialSampleSession[] = [
  {
    id: "tutorial-squat-001",
    exercise: "squat",
    source: "human_capture",
    status: "planned",
    notes: "Front-facing beginner squat sample with stable lighting.",
  },
  {
    id: "tutorial-pushup-001",
    exercise: "pushup",
    source: "human_capture",
    status: "planned",
    notes: "Side-view pushup sample with full-body framing.",
  },
  {
    id: "tutorial-plank-001",
    exercise: "plank",
    source: "human_capture",
    status: "planned",
    notes: "Side-view plank hold showing neutral spine and shoulder stack.",
  },
];

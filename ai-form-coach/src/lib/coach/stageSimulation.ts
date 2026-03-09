export type CoachStageSimulationMode =
  | "none"
  | "camera-blocked"
  | "camera-busy"
  | "detector-error"
  | "camera-blocked-once"
  | "detector-error-once";

export interface CoachStageSimulationIssue {
  kind: "camera" | "detector";
  message: string;
  status: string;
  detail: string;
}

export function getCoachStageSimulationMode(rawValue: string | null): CoachStageSimulationMode {
  if (process.env.NODE_ENV === "production") return "none";

  switch (rawValue) {
    case "camera-blocked":
    case "camera-busy":
    case "detector-error":
    case "camera-blocked-once":
    case "detector-error-once":
      return rawValue;
    default:
      return "none";
  }
}

export function getCoachStageSimulationIssue(
  mode: CoachStageSimulationMode,
  attemptCount: number,
): CoachStageSimulationIssue | null {
  if (mode === "none") return null;
  if (mode === "camera-blocked-once" && attemptCount > 0) return null;
  if (mode === "detector-error-once" && attemptCount > 0) return null;

  if (mode === "camera-blocked" || mode === "camera-blocked-once") {
    return {
      kind: "camera",
      message: "Camera access is blocked. Allow permission and reload.",
      status: "Camera unavailable.",
      detail: "Camera permission is blocked. Open site settings, allow camera access, then retry the stage.",
    };
  }

  if (mode === "camera-busy") {
    return {
      kind: "camera",
      message: "The camera is already in use by another app or tab.",
      status: "Camera unavailable.",
      detail: "Another app or browser tab is still using the camera. Close it, then retry the stage.",
    };
  }

  return {
    kind: "detector",
    message: "Pose detector could not start. Check MediaPipe asset access, then reload.",
    status: "Pose detector unavailable.",
    detail: "The detector failed before the camera could start. Reload once assets are reachable, then retry the stage.",
  };
}

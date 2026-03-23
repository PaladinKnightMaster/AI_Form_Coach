import type { Exercise } from "@/lib/validators/types";

export type CoachDeviceFamily = "iphone-safari" | "android-chrome" | "desktop-chrome" | "desktop-safari" | "android-browser" | "unknown";

export interface CoachDeviceProfile {
  family: CoachDeviceFamily;
  browser: string;
  os: string;
  viewportWidth: number;
  viewportHeight: number;
  touch: boolean;
  pixelRatio: number;
}

interface DetectCoachDeviceProfileArgs {
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
  maxTouchPoints: number;
  pixelRatio: number;
}

export interface CoachRecoveryGuide {
  title: string;
  steps: string[];
}

function detectBrowser(userAgent: string): string {
  if (/(crios|chrome|chromium)/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent) && !/(chrome|chromium|crios|android)/i.test(userAgent)) return "Safari";
  if (/firefox/i.test(userAgent)) return "Firefox";
  return "Unknown";
}

function detectOs(userAgent: string): string {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iPhone";
  if (/android/i.test(userAgent)) return "Android";
  if (/mac os x|macintosh/i.test(userAgent)) return "macOS";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

export function detectCoachDeviceProfile({
  userAgent,
  viewportWidth,
  viewportHeight,
  maxTouchPoints,
  pixelRatio,
}: DetectCoachDeviceProfileArgs): CoachDeviceProfile {
  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);
  const touch = maxTouchPoints > 0;

  let family: CoachDeviceFamily = "unknown";
  if (os === "iPhone" && browser === "Safari") {
    family = "iphone-safari";
  } else if (os === "Android" && browser === "Chrome") {
    family = "android-chrome";
  } else if (os === "Android") {
    family = "android-browser";
  } else if (os === "Windows" && browser === "Chrome") {
    family = "desktop-chrome";
  } else if (os === "macOS" && browser === "Safari") {
    family = "desktop-safari";
  }

  return {
    family,
    browser,
    os,
    viewportWidth,
    viewportHeight,
    touch,
    pixelRatio: Number.isFinite(pixelRatio) ? Number(pixelRatio.toFixed(2)) : 1,
  };
}

export function getCoachDeviceProfile(): CoachDeviceProfile {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      family: "unknown",
      browser: "Unknown",
      os: "Unknown",
      viewportWidth: 0,
      viewportHeight: 0,
      touch: false,
      pixelRatio: 1,
    };
  }

  return detectCoachDeviceProfile({
    userAgent: navigator.userAgent,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    pixelRatio: window.devicePixelRatio || 1,
  });
}

export function formatCoachDeviceSummary(profile: CoachDeviceProfile): string {
  return `${profile.browser} on ${profile.os} | ${profile.viewportWidth}x${profile.viewportHeight} | ${profile.touch ? "touch" : "pointer"}`;
}

export function getCoachRecoveryGuide({
  cameraError,
  detectorError,
  deviceProfile,
}: {
  cameraError: string | null;
  detectorError: string | null;
  deviceProfile: CoachDeviceProfile;
}): CoachRecoveryGuide | null {
  if (detectorError) {
    return {
      title: "Pose detector needs a clean reload",
      steps: [
        "Reload the page once the connection is stable so the pose assets can initialize again.",
        "Turn off blockers or privacy filters that may be preventing MediaPipe assets from loading.",
        "Retry the stage after the page finishes loading and the camera is free.",
      ],
    };
  }

  if (!cameraError) {
    return null;
  }

  if (cameraError.includes("No camera was found")) {
    return {
      title: "No camera was detected",
      steps: [
        "Make sure this device actually exposes a front-facing camera to the browser.",
        "Disconnect stale camera sessions or close any app that may have reserved the device camera.",
        "Retry the coach stage after the camera becomes available.",
      ],
    };
  }

  if (cameraError.includes("already in use")) {
    return {
      title: "The camera is busy in another app",
      steps: [
        "Close other tabs, camera apps, or video calls that may still be holding the camera.",
        "Return to the coach tab and retry once the camera light is off elsewhere.",
        "If the browser still reports the camera as busy, fully close and reopen the browser.",
      ],
    };
  }

  if (deviceProfile.family === "iphone-safari") {
    return {
      title: "Safari still needs camera access",
      steps: [
        "Open this page's settings from Safari's address bar and allow Camera for the site.",
        "Make sure Screen Time, Private Browsing, or another app is not blocking camera access.",
        "Return to the coach and tap retry camera once permission is allowed.",
      ],
    };
  }

  if (deviceProfile.family === "android-chrome") {
    return {
      title: "Chrome still needs camera access",
      steps: [
        "Open the site controls in Chrome and allow Camera for this page.",
        "Check Android app permissions if Chrome itself cannot use the camera.",
        "Return to the coach and retry once the permission change is applied.",
      ],
    };
  }

  return {
    title: "Camera access still needs recovery",
    steps: [
      "Open this page's site settings and allow Camera for the coach stage.",
      "Close other tabs or apps that might still be using the camera.",
      "Retry the stage once the browser shows the camera is available again.",
    ],
  };
}

export function getCoachDeviceExerciseLabel(exercise: Exercise): string {
  return exercise === "plank" ? "Holds" : "Reps";
}

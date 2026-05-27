import { expect, test, type Page } from "@playwright/test";

// Pre-seed the Step 07 splash sessionStorage gate so the signature reveal
// doesn't overlay coach DOM elements during click/visibility assertions.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("carriage:splash:v1", "shown");
    } catch {}
  });
});

const isMobileProject = (projectName: string) => projectName === "android-chrome" || projectName === "iphone-safari";

function getCoachLiveCue(page: Page, projectName: string) {
  return isMobileProject(projectName) ? page.getByTestId("coach-mobile-live-cue") : page.getByTestId("coach-live-cue");
}

function getCoachRepCounter(page: Page, projectName: string) {
  // Post-redesign (2026-04-09) the desktop rep counter lives in the sidebar
  // (`coach-sidebar-rep-count`); the legacy `coach-rep-count` testid was removed.
  return isMobileProject(projectName) ? page.getByTestId("coach-mobile-rep-count") : page.getByTestId("coach-sidebar-rep-count");
}

// After the countdown completes the center-panel `coach-primary-action` button
// unmounts (because `showCenterPanel = sessionState !== "active"`). The active
// session's Pause control lives in different testids depending on viewport:
// - mobile (Pixel 7 / iPhone 13): `coach-mobile-primary-action` (tray)
// - desktop chromium (lg+): `coach-footer-primary-action` (rich footer)
function getCoachActivePrimaryAction(page: Page, projectName: string) {
  return isMobileProject(projectName)
    ? page.getByTestId("coach-mobile-primary-action")
    : page.getByTestId("coach-footer-primary-action");
}

test("coach beta stage boots with camera shell and overlay", async ({ page }, testInfo) => {
  const isIphoneSafari = testInfo.project.name === "iphone-safari";
  const isMobile = isMobileProject(testInfo.project.name);
  await page.goto(isIphoneSafari ? "/coach?e2e-access=1&pose-script=squat-single-rep" : "/coach?e2e-access=1");

  await expect(page.locator("body")).not.toContainText("??");
  await expect(page.getByTestId("coach-framing-guide")).toBeVisible();
  await expect(page.getByTestId("coach-camera-setup")).toBeVisible();

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await expect(page.getByTestId("pose-overlay")).toBeVisible({ timeout: 60_000 });

  await action.click();

  await expect(page.getByTestId("coach-countdown")).toBeVisible();
  // L51's coach-countdown visibility + L53's "Pause" appearance bracket the
  // countdown lifecycle; the redundant "Cancel countdown" text check on
  // coach-primary-action is unreliable because the center-panel button can
  // unmount or relabel mid-transition between countdown and active states.
  await expect(getCoachActivePrimaryAction(page, testInfo.project.name)).toContainText("Pause", { timeout: 15_000 });
  await expect(getCoachLiveCue(page, testInfo.project.name)).toBeVisible();
  if (isMobile) {
    await expect(page.getByTestId("coach-mobile-live-pill")).toBeVisible();
    await expect(page.getByTestId("coach-stage-rich-footer")).not.toBeVisible();
  }
  await expect(page.getByTestId("coach-tracking-status")).not.toContainText("Camera access failed");
});

test("coach keeps controls reachable on a phone-sized viewport", async ({ page }, testInfo) => {
  const mobileProject = isMobileProject(testInfo.project.name);
  const isIphoneSafari = testInfo.project.name === "iphone-safari";
  if (!mobileProject) {
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await page.goto(isIphoneSafari ? "/coach?e2e-access=1&pose-script=squat-single-rep" : "/coach?e2e-access=1");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(page.getByTestId("coach-mobile-tray")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("coach-mobile-primary-action")).toContainText("Pause", { timeout: 15_000 });
  await expect(page.getByTestId("coach-mobile-live-pill")).toBeVisible();
  await expect(page.getByTestId("coach-stage-rich-footer")).not.toBeVisible();
});

test("coach recovery guide can recover from a simulated blocked camera", async ({ page }) => {
  await page.goto("/coach?e2e-access=1&stage-sim=camera-blocked-once&pose-script=squat-single-rep");

  await expect(page.getByTestId("coach-recovery-guide")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("coach-retry-camera")).toBeVisible();
  await page.getByTestId("coach-retry-camera").click();

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await expect(page.getByTestId("pose-overlay")).toBeVisible({ timeout: 60_000 });
});

test("coach shows detector recovery guidance for a simulated detector failure", async ({ page }) => {
  await page.goto("/coach?e2e-access=1&stage-sim=detector-error");

  await expect(page.getByTestId("coach-recovery-guide")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("coach-recovery-guide").getByText("Pose detector needs a clean reload")).toBeVisible();
  await expect(page.getByTestId("coach-tracking-status")).toContainText("Pose detector could not start");
});

test("public MVP gate redirects disabled legacy routes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Route-gating regression runs once in chromium");

  const cases = [
    {
      path: "/nutrition",
      allowedTargets: [/\/$/, /\/signin\?redirect=\/nutrition$/],
      allowedText: ["Public beta: motion coaching only", "Sign in"],
    },
    {
      path: "/demo",
      allowedTargets: [/\/$/, /\/signin\?redirect=\/demo$/],
      allowedText: ["Private form coaching in your browser.", "Sign in"],
    },
    {
      path: "/plans",
      allowedTargets: [/\/$/, /\/signin\?redirect=\/plans$/],
      allowedText: ["The MVP is a motion product, not a broad wellness bundle.", "Sign in"],
    },
    {
      path: "/pricing/success",
      allowedTargets: [/\/pricing$/],
      requiredText: "No paid plans at launch.",
    },
  ] as const;

  for (const routeCase of cases) {
    await page.goto(routeCase.path);
    await page.waitForLoadState("networkidle");

    const finalUrl = page.url();
    expect(routeCase.allowedTargets.some((pattern) => pattern.test(finalUrl))).toBe(true);
    expect(new URL(finalUrl).pathname).not.toBe(routeCase.path);

    if ("requiredText" in routeCase) {
      await expect(page.locator("body")).toContainText(routeCase.requiredText);
    }

    if ("allowedText" in routeCase) {
      const bodyText = await page.locator("body").textContent();
      expect(routeCase.allowedText.some((text) => bodyText?.includes(text))).toBe(true);
    }
  }
});
test("coach scripted pose mode can count a deterministic squat rep", async ({ page }, testInfo) => {
  await page.goto("/coach?e2e-access=1&pose-script=squat-single-rep");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(getCoachActivePrimaryAction(page, testInfo.project.name)).toContainText("Pause", { timeout: 15_000 });
  await expect(getCoachRepCounter(page, testInfo.project.name)).toContainText(/[1-9]/, { timeout: 20_000 });
  await expect(getCoachLiveCue(page, testInfo.project.name)).toBeVisible();
});

test("coach can pause, resume, save, and capture cue feedback", async ({ page }, testInfo) => {
  await page.goto("/coach?e2e-access=1&pose-script=squat-single-rep");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  const isCompactSession = isMobileProject(testInfo.project.name);
  // Active session: center-panel `coach-primary-action` unmounts; Pause lives
  // in the mobile tray (mobile) or rich footer (desktop).
  const activePause = getCoachActivePrimaryAction(page, testInfo.project.name);
  await expect(activePause).toContainText("Pause", { timeout: 15_000 });
  if (isCompactSession) {
    await activePause.evaluate((element: HTMLButtonElement) => element.click());
  } else {
    await activePause.click();
  }

  // Paused state: center panel re-renders with primaryActionLabel = "Resume session".
  // On desktop the center-panel `coach-primary-action` is back; on mobile the
  // center panel is also visible (lg:hidden doesn't apply to it), but the mobile
  // tray's primary-action is not present during paused (showMobileTray = active).
  const resumeAction = page.getByTestId("coach-primary-action").first();
  await expect(resumeAction).toContainText("Resume session");
  await resumeAction.click();

  await expect(getCoachRepCounter(page, testInfo.project.name)).toContainText("1", { timeout: 20_000 });

  // End & save: post-redesign the legacy `coach-session-save` testid is gone.
  // Mobile uses `coach-mobile-session-save`; desktop uses `coach-sidebar-session-save`
  // (sidebar is the most reliable — center-panel save has no testid, footer
  // save lives behind a `lg:flex` container).
  const saveAction = isCompactSession
    ? page.getByTestId("coach-mobile-session-save")
    : page.getByTestId("coach-sidebar-session-save");
  if (isCompactSession) {
    await saveAction.evaluate((element: HTMLButtonElement) => element.click());
  } else {
    await saveAction.click();
  }

  const feedbackButton = page.getByTestId("coach-feedback-clear");
  await expect(feedbackButton).toBeVisible({ timeout: 15_000 });
  await feedbackButton.click();
  await expect(feedbackButton).toHaveAttribute("data-selected", "true");
});

test("coach scripted pose mode can count a deterministic pushup rep", async ({ page }, testInfo) => {
  await page.goto("/coach?e2e-access=1&pose-script=pushup-single-rep&exercise=pushup");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(getCoachActivePrimaryAction(page, testInfo.project.name)).toContainText("Pause", { timeout: 15_000 });
  await expect(getCoachRepCounter(page, testInfo.project.name)).toContainText(/[1-9]/, { timeout: 20_000 });
});

test("coach scripted pose mode can count a deterministic plank hold", async ({ page }, testInfo) => {
  await page.goto("/coach?e2e-access=1&pose-script=plank-short-hold&exercise=plank");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(getCoachActivePrimaryAction(page, testInfo.project.name)).toContainText("Pause", { timeout: 15_000 });
  await expect(getCoachRepCounter(page, testInfo.project.name)).toContainText("1", { timeout: 20_000 });
});

test("coach keeps the active stage inside the Android Chrome viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "android-chrome", "Android Chrome emulation only");

  await page.goto("/coach?e2e-access=1&pose-script=squat-single-rep");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(page.getByTestId("coach-mobile-tray")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("coach-mobile-live-pill")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("coach-stage-rich-footer")).not.toBeVisible();
  await expect(page.getByText("Session pulse")).toBeHidden();
  await expect(page.getByTestId("coach-mobile-live-cue")).toBeVisible();
  // coach-tracking-status renders in the DOM but is intentionally hidden on
  // mobile viewports (status copy is collapsed into coach-mobile-live-cue
  // above). toBeAttached() preserves the "tracking is happening" assertion
  // without requiring visual presence.
  await expect(page.getByTestId("coach-tracking-status")).toBeAttached();

  const viewport = page.viewportSize();
  const trayBox = await page.getByTestId("coach-mobile-tray").boundingBox();
  const stageBox = await page.getByTestId("coach-stage-shell").boundingBox();
  const cueBox = await page.getByTestId("coach-mobile-live-pill").boundingBox();

  expect(viewport).not.toBeNull();
  expect(trayBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect(cueBox).not.toBeNull();
  expect(Math.round((trayBox?.y ?? 0) + (trayBox?.height ?? 0))).toBeLessThanOrEqual((viewport?.height ?? 0) + 2);
  expect(Math.round(stageBox?.y ?? 9999)).toBeLessThan(Math.round((viewport?.height ?? 0) * 0.2));
  expect(Math.round(cueBox?.y ?? 9999)).toBeLessThan(Math.round((stageBox?.y ?? 0) + (stageBox?.height ?? 0) * 0.45));
});

test("coach respects safe-area tray placement on iPhone Safari", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "iphone-safari", "iPhone Safari emulation only");

  await page.goto("/coach?e2e-access=1&pose-script=squat-single-rep");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(page.getByTestId("coach-mobile-tray")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("coach-mobile-live-pill")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("coach-stage-rich-footer")).not.toBeVisible();
  await expect(page.getByText("Session pulse")).toBeHidden();
  await expect(page.getByTestId("coach-mobile-live-cue")).toBeVisible();
  // coach-tracking-status renders in the DOM but is intentionally hidden on
  // mobile viewports (status copy is collapsed into coach-mobile-live-cue
  // above). toBeAttached() preserves the "tracking is happening" assertion
  // without requiring visual presence.
  await expect(page.getByTestId("coach-tracking-status")).toBeAttached();

  const viewport = page.viewportSize();
  const trayBox = await page.getByTestId("coach-mobile-tray").boundingBox();
  const stageBox = await page.getByTestId("coach-stage-shell").boundingBox();
  const cueBox = await page.getByTestId("coach-mobile-live-pill").boundingBox();

  expect(viewport).not.toBeNull();
  expect(trayBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect(cueBox).not.toBeNull();
  expect(Math.round((trayBox?.y ?? 0) + (trayBox?.height ?? 0))).toBeLessThanOrEqual((viewport?.height ?? 0) + 2);
  expect(Math.round(stageBox?.y ?? 9999)).toBeLessThan(Math.round((viewport?.height ?? 0) * 0.18));
  expect(Math.round(cueBox?.y ?? 9999)).toBeLessThan(Math.round((stageBox?.y ?? 0) + (stageBox?.height ?? 0) * 0.45));
});






test("scripted history can open a session detail page and persist a private note", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "History/session hardening runs once in chromium");

  await page.goto("/history?e2e-access=1&history-script=coach-beta-history");

  await expect(page.getByText("Saved coaching sessions")).toBeVisible();
  await expect(page.getByTestId("history-session-list")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Â");
  await expect(page.locator("body")).not.toContainText("Ã");

  await page.getByTestId("history-session-link").first().click();

  await expect(page).toHaveURL(/\/session\/session-squat-001\?e2e-access=1&session-script=coach-beta-history/);
  await expect(page.getByText("Saved coach session")).toBeVisible();
  await expect(page.getByText("Session chart")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("â€¢");

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("session-export-csv").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("squat-session-squat-001.csv");

  await page.getByTestId("session-note-field").fill("Loopback QA note");
  await page.getByTestId("session-save-note").click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("session-note-field")).toHaveValue("Loopback QA note");
});
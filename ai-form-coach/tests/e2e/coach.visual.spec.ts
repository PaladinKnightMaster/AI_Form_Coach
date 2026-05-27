import { expect, test, type Locator, type Page } from "@playwright/test";

const isMobileProject = (projectName: string) => projectName === "android-chrome" || projectName === "iphone-safari";

const screenshotOptions = {
  animations: "disabled" as const,
  caret: "hide" as const,
  scale: "css" as const,
};

async function prepareCoachVisual(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Pre-seed the splash sessionStorage gate so the signature reveal does NOT
  // overlay coach-stage-shell during a screenshot. Without this every visual
  // baseline ends up capturing the splash composition, not the coach surface.
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("carriage:splash:v1", "shown");
    } catch {}
  });
  await page.goto(path);
  await expect(page.getByTestId("coach-stage-shell")).toBeVisible({ timeout: 60_000 });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      [data-nextjs-dev-tools-button], nextjs-portal {
        display: none !important;
      }
    `,
  });
}

async function startScriptedSession(page: Page, projectName: string, path = "/coach?e2e-access=1&pose-script=squat-ready-hold&exercise=squat") {
  await prepareCoachVisual(page, path);
  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  if (isMobileProject(projectName)) {
    await expect(page.getByTestId("coach-mobile-live-pill")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("coach-mobile-tray")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("coach-stage-rich-footer")).not.toBeVisible();
    await expect(page.getByTestId("coach-tracking-status")).toHaveText("Tracking live posture.", { timeout: 20_000 });
    await page.waitForTimeout(250);
    return;
  }

  await expect(page.getByTestId("coach-live-cue")).toBeVisible({ timeout: 20_000 });
}

function getMobileDynamicMasks(page: Page): Locator[] {
  return [
    page.getByTestId("coach-mobile-rep-count"),
    page.getByTestId("coach-mobile-elapsed"),
  ];
}

test.describe("coach visual regression", () => {
  test("desktop squat setup card", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop visual baselines run in chromium only");

    await prepareCoachVisual(page, "/coach?e2e-access=1&pose-script=squat-single-rep&exercise=squat");
    await expect(page.getByTestId("coach-camera-setup")).toContainText("Quarter turn");
    await expect(page.getByTestId("coach-stage-shell")).toHaveScreenshot("coach-setup-squat-desktop.png", screenshotOptions);
  });

  test("desktop pushup setup card", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop visual baselines run in chromium only");

    await prepareCoachVisual(page, "/coach?e2e-access=1&pose-script=pushup-single-rep&exercise=pushup");
    await expect(page.getByTestId("coach-camera-setup")).toContainText("Side profile");
    await expect(page.getByTestId("coach-stage-shell")).toHaveScreenshot("coach-setup-pushup-desktop.png", screenshotOptions);
  });

  test("desktop plank setup card", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop visual baselines run in chromium only");

    await prepareCoachVisual(page, "/coach?e2e-access=1&pose-script=plank-short-hold&exercise=plank");
    await expect(page.getByTestId("coach-camera-setup")).toContainText("Side profile");
    await expect(page.getByTestId("coach-stage-shell")).toHaveScreenshot("coach-setup-plank-desktop.png", screenshotOptions);
  });

  test("android active mobile stage", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "android-chrome", "Android mobile visual baseline only");

    await startScriptedSession(page, testInfo.project.name);
    await expect(page.getByTestId("coach-page-shell")).toHaveScreenshot("coach-mobile-active-android.png", {
      ...screenshotOptions,
      mask: getMobileDynamicMasks(page),
      // Same canvas churn as the iphone-active sibling: scripted-pose frames
      // advance every 16ms, so the skeleton position drifts by a handful of
      // pixels between consecutive captures. Tolerance lets the assertion
      // measure layout/chrome stability instead of frame-accurate pose.
      maxDiffPixels: 1500,
    });
  });

  test("android paused mobile stage", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "android-chrome", "Android mobile visual baseline only");

    await startScriptedSession(page, testInfo.project.name);
    await page.getByTestId("coach-mobile-primary-action").evaluate((element: HTMLButtonElement) => element.click());
    await expect(page.getByRole("button", { name: "Resume session" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("coach-page-shell")).toHaveScreenshot("coach-mobile-paused-android.png", {
      ...screenshotOptions,
      mask: getMobileDynamicMasks(page),
    });
  });

  test("android completed mobile stage", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "android-chrome", "Android mobile visual baseline only");

    await startScriptedSession(page, testInfo.project.name);
    await page.getByTestId("coach-mobile-session-save").evaluate((element: HTMLButtonElement) => element.click());
    await expect(page.getByTestId("coach-feedback-clear")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("coach-page-shell")).toHaveScreenshot("coach-mobile-completed-android.png", screenshotOptions);
  });

  test("iphone active mobile stage", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "iphone-safari", "iPhone mobile visual baseline only");

    await startScriptedSession(page, testInfo.project.name, "/coach?e2e-access=1&pose-script=squat-ready-hold&exercise=squat");
    await expect(page.getByTestId("coach-page-shell")).toHaveScreenshot("coach-mobile-active-iphone.png", {
      ...screenshotOptions,
      mask: getMobileDynamicMasks(page),
      // The pose-overlay canvas advances scripted-pose frames every 16ms,
      // shifting skeleton joint positions by a handful of pixels between
      // consecutive screenshots. The dynamic masks already exclude rep-count
      // and elapsed; this tolerance absorbs the residual canvas churn so the
      // assertion measures layout/chrome stability, not frame-accurate pose.
      maxDiffPixels: 1500,
    });
  });
});

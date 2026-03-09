import { expect, test } from "@playwright/test";

test("coach beta stage boots with camera shell and overlay", async ({ page }) => {
  await page.goto("/coach");

  await expect(page.getByText("Private motion coaching beta")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Ã");
  await expect(page.getByTestId("coach-framing-guide")).toBeVisible();

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await expect(page.getByTestId("pose-overlay")).toBeVisible({ timeout: 60_000 });

  await action.click();

  await expect(page.getByTestId("coach-countdown")).toBeVisible();
  await expect(page.getByTestId("coach-primary-action").first()).toContainText("Cancel countdown");
  await expect(page.getByTestId("coach-primary-action").last()).toContainText("Pause", { timeout: 15_000 });
  await expect(page.getByTestId("coach-live-cue")).toBeVisible();
  await expect(page.getByTestId("coach-tracking-status")).not.toContainText("Camera access failed");
});

test("coach keeps controls reachable on a phone-sized viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/coach");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(page.getByTestId("coach-mobile-tray")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("coach-mobile-primary-action")).toContainText("Pause", { timeout: 15_000 });
  await expect(page.getByTestId("coach-live-cue")).toBeVisible();
});

test("coach scripted pose mode can count a deterministic squat rep", async ({ page }) => {
  await page.goto("/coach?pose-script=squat-single-rep");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(page.getByTestId("coach-primary-action").last()).toContainText("Pause", { timeout: 15_000 });
  await expect(page.getByTestId("coach-rep-count").first()).toContainText(/[1-9]/, { timeout: 20_000 });
  await expect(page.getByTestId("coach-live-cue")).toBeVisible();
});


test("coach can pause, resume, save, and capture cue feedback", async ({ page }) => {
  await page.goto("/coach?pose-script=squat-single-rep");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  const activePause = page.getByTestId("coach-primary-action").first();
  await expect(activePause).toContainText("Pause", { timeout: 15_000 });
  await activePause.click();

  const resumeAction = page.getByTestId("coach-primary-action").first();
  await expect(resumeAction).toContainText("Resume session");
  await resumeAction.click();

  await expect(page.getByTestId("coach-rep-count").first()).toContainText("1", { timeout: 20_000 });
  await page.getByTestId("coach-session-save").first().click();

  const feedbackButton = page.getByTestId("coach-feedback-clear");
  await expect(feedbackButton).toBeVisible({ timeout: 15_000 });
  await feedbackButton.click();
  await expect(feedbackButton).toHaveAttribute("data-selected", "true");
});


test("coach scripted pose mode can count a deterministic pushup rep", async ({ page }) => {
  await page.goto("/coach?pose-script=pushup-single-rep");

  await page.getByTestId("coach-exercise-select").selectOption("pushup");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(page.getByTestId("coach-primary-action").last()).toContainText("Pause", { timeout: 15_000 });
  await expect(page.getByTestId("coach-rep-count").first()).toContainText(/[1-9]/, { timeout: 20_000 });
});

test("coach scripted pose mode can count a deterministic plank hold", async ({ page }) => {
  await page.goto("/coach?pose-script=plank-short-hold");

  await page.getByTestId("coach-exercise-select").selectOption("plank");

  const action = page.getByTestId("coach-primary-action").first();
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await action.click();

  await expect(page.getByTestId("coach-primary-action").last()).toContainText("Pause", { timeout: 15_000 });
  await expect(page.getByTestId("coach-rep-count").first()).toContainText("1", { timeout: 20_000 });
});

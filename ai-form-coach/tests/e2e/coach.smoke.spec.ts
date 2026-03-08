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

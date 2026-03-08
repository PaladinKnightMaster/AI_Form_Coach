import { expect, test } from "@playwright/test";

test("coach beta stage boots with camera shell and overlay", async ({ page }) => {
  await page.goto("/coach");

  await expect(page.getByText("Private motion coaching beta")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Ã");

  const action = page.getByTestId("coach-primary-action");
  await expect(action).toBeEnabled({ timeout: 60_000 });
  await expect(page.getByTestId("pose-overlay")).toBeVisible({ timeout: 60_000 });

  await action.click();

  await expect(page.getByTestId("coach-primary-action")).toContainText("Pause");
  await expect(page.getByTestId("coach-live-cue")).toBeVisible();
  await expect(page.getByTestId("coach-tracking-status")).not.toContainText("Camera access failed");
});
import { expect, test } from '@playwright/test';

test.describe('auth smoke', () => {
  test('signup route lands in create-account mode and keeps redirect intent', async ({ page }) => {
    await page.goto('/signup?redirect=%2Fhistory');

    await expect(page).toHaveURL(/\/signin\?mode=signup&redirect=%2Fhistory$/);
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  });

  test('auth code errors offer retry links that keep the target path', async ({ page }) => {
    await page.goto('/auth/auth-code-error?reason=exchange_failed&next=%2Fhistory');

    await expect(page.getByRole('heading', { name: 'We could not complete your sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Try sign in again' })).toHaveAttribute(
      'href',
      '/signin?redirect=%2Fhistory'
    );
    await expect(page.getByRole('link', { name: 'Send a fresh magic link' })).toHaveAttribute(
      'href',
      '/signin?redirect=%2Fhistory&mode=magic-link'
    );
  });
});

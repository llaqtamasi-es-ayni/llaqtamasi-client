import { expect, test } from '@playwright/test';

test('abre la app en la pestaña Mapa', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/tabs\/mapa/);
  await expect(page.locator('ion-tab-bar')).toContainText('Emergencia');
});

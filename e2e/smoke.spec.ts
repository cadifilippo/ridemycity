import { test, expect } from '@playwright/test';
import { test as authTest } from './fixtures/auth';
import { waitForMapReady } from './helpers/map';

test.describe('Smoke tests', () => {
  test('page loads with correct title and login screen', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Ride My City');
    await expect(page.locator('.login-btn')).toBeVisible();
    await expect(page.locator('text=Entrar con Google')).toBeVisible();
  });
});

authTest.describe('Authenticated smoke tests', () => {
  authTest('authenticated user sees map and sidebar', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await waitForMapReady(page);
    await expect(page.locator('.map-container')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('text=Ride My City')).toBeVisible();
  });

  authTest('authenticated user sees action buttons', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await waitForMapReady(page);
    await expect(page.locator('text=Cargar Salida')).toBeVisible();
    await expect(page.locator('text=Zona a Evitar')).toBeVisible();
  });
});

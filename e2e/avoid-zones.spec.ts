import { test, expect } from './fixtures/auth';
import { waitForMapReady, clickOnMapAt } from './helpers/map';
import { deleteAvoidZone, getAvoidZones, waitForAvoidZonesCount } from './helpers/api';

test.describe('Avoid zone creation E2E', () => {
  let createdZoneIds: string[] = [];
  let authToken: string;

  test.beforeEach(async ({ authToken: token }) => {
    authToken = token;
    createdZoneIds = [];
  });

  test.afterEach(async () => {
    // Clean up any zones created during the test
    for (const id of createdZoneIds) {
      await deleteAvoidZone(authToken, id);
    }
  });

  test('avoid zone creation happy path: draw polygon on map and save', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;
    await waitForMapReady(page);

    // Get initial zone count
    const initialZones = await getAvoidZones(authToken);
    const initialCount = initialZones.length;

    // Start avoid zone drawing mode
    await page.click('text=Zona a Evitar');
    await expect(page.locator('.drawing-panel')).toBeVisible();
    await expect(page.locator('text=Zona a evitar')).toBeVisible();

    // Click 4 points on the map to draw a polygon
    // The app auto-closes the polygon (ensureClosedRing), so we just need 3+ points
    await clickOnMapAt(page, 0.4, 0.3);
    await clickOnMapAt(page, 0.6, 0.3);
    await clickOnMapAt(page, 0.6, 0.5);
    await clickOnMapAt(page, 0.4, 0.5);

    // Save the avoid zone
    await page.click('text=Guardar');

    // Wait for the drawing panel to disappear
    await expect(page.locator('.drawing-panel')).not.toBeVisible();

    // Verify the zone appears in the sidebar list
    // The sidebar shows both rides and zones as .saved-item elements
    // Wait for the zone to appear in the API
    const zonesAfterSave = await waitForAvoidZonesCount(
      authToken,
      initialCount + 1,
    );
    const newZones = zonesAfterSave.filter(
      (z) => !initialZones.some((iz) => iz.id === z.id),
    );
    createdZoneIds = newZones.map((z) => z.id);

    expect(newZones.length).toBe(1);
    // The polygon should have 5 points (4 + closure point)
    expect(newZones[0].coordinates.length).toBe(5);
  });

  test('avoid zone persists after page reload', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;
    await waitForMapReady(page);

    // Get initial state
    const initialZones = await getAvoidZones(authToken);

    // Create an avoid zone
    await page.click('text=Zona a Evitar');
    await clickOnMapAt(page, 0.35, 0.35);
    await clickOnMapAt(page, 0.55, 0.35);
    await clickOnMapAt(page, 0.55, 0.55);
    await clickOnMapAt(page, 0.35, 0.55);
    await page.click('text=Guardar');

    // Wait for zone to be saved
    const zonesAfterSave = await waitForAvoidZonesCount(
      authToken,
      initialZones.length + 1,
    );
    const newZones = zonesAfterSave.filter(
      (z) => !initialZones.some((iz) => iz.id === z.id),
    );
    createdZoneIds = newZones.map((z) => z.id);
    expect(newZones.length).toBe(1);

    // Reload the page
    await page.reload();
    await waitForMapReady(page);

    // Verify the zone is still visible after reload via API
    const zonesAfterReload = await getAvoidZones(authToken);
    expect(zonesAfterReload.length).toBe(zonesAfterSave.length);
  });
});

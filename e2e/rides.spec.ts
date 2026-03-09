import { test, expect } from './fixtures/auth';
import { waitForMapReady, clickOnMapAt } from './helpers/map';
import { deleteRide, getRides, waitForRidesCount } from './helpers/api';

test.describe('Ride creation E2E', () => {
  let createdRideIds: string[] = [];
  let authToken: string;

  test.beforeEach(async ({ authToken: token }) => {
    authToken = token;
    createdRideIds = [];
  });

  test.afterEach(async () => {
    // Clean up any rides created during the test
    for (const id of createdRideIds) {
      await deleteRide(authToken, id);
    }
  });

  test('ride creation happy path: draw route on map and save', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;
    await waitForMapReady(page);

    // Get initial ride count
    const initialRides = await getRides(authToken);
    const initialCount = initialRides.length;

    // Start ride drawing mode
    await page.click('text=Cargar Salida');
    await expect(page.locator('.drawing-panel')).toBeVisible();
    await expect(page.locator('text=Dibujando ruta')).toBeVisible();

    // Click 3 points on the map to trace a route
    await clickOnMapAt(page, 0.4, 0.4);
    await clickOnMapAt(page, 0.5, 0.3);
    await clickOnMapAt(page, 0.6, 0.5);

    // Verify distance is shown
    await expect(page.locator('.drawing-km')).toBeVisible();

    // Save the ride
    await page.click('text=Guardar');

    // Wait for the drawing panel to disappear
    await expect(page.locator('.drawing-panel')).not.toBeVisible();

    // Wait for the ride to be persisted on backend
    const rides = await waitForRidesCount(authToken, initialCount + 1);
    const newRides = rides.filter(
      (r) => !initialRides.some((ir) => ir.id === r.id),
    );
    createdRideIds = newRides.map((r) => r.id);

    expect(newRides.length).toBe(1);
    expect(newRides[0].coordinates.length).toBe(3);
  });

  test('ride persists after page reload', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await waitForMapReady(page);

    // Get initial ride count
    const initialRides = await getRides(authToken);

    // Create a ride
    await page.click('text=Cargar Salida');
    await clickOnMapAt(page, 0.3, 0.3);
    await clickOnMapAt(page, 0.5, 0.5);
    await clickOnMapAt(page, 0.7, 0.3);
    await page.click('text=Guardar');

    // Wait for ride to be persisted on backend
    const ridesAfterSave = await waitForRidesCount(
      authToken,
      initialRides.length + 1,
    );
    const newRides = ridesAfterSave.filter(
      (r) => !initialRides.some((ir) => ir.id === r.id),
    );
    createdRideIds = newRides.map((r) => r.id);

    // Reload the page
    await page.reload();
    await waitForMapReady(page);

    // Verify the ride persists after reload via API
    const ridesAfterReload = await waitForRidesCount(
      authToken,
      ridesAfterSave.length,
    );
    expect(ridesAfterReload.length).toBe(ridesAfterSave.length);
  });
});
